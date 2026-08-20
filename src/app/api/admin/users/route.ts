import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { User, Hospital, Lead } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role')?.trim() || 'ALL';
    const status = searchParams.get('status')?.trim() || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Build filter condition
    const where: any = {};

    if (role !== 'ALL') {
      where.role = role;
    }

    if (status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
      ];
    }

    // Compute overview metrics
    const [totalUsers, totalPatients, totalHospitals, totalAdmins, activeUsers] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'PATIENT' } }),
      User.count({ where: { role: 'HOSPITAL' } }),
      User.count({ where: { role: { [Op.in]: ['SUPER_ADMIN', 'ADMIN'] } } }),
      User.count({ where: { status: 'ACTIVE' } }),
    ]);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'hospitalId',
        'phone',
        'avatar',
        'address',
        'city',
        'state',
        'pincode',
        'status',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'slug', 'city', 'state', 'phone', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Also get lead counts for each user
    const userIds = users.map((u) => u.id);
    let leadCountsMap: Record<number, number> = {};
    if (userIds.length > 0) {
      const leads = await Lead.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ['userId'],
      });
      leads.forEach((l) => {
        if (l.userId) {
          leadCountsMap[l.userId] = (leadCountsMap[l.userId] || 0) + 1;
        }
      });
    }

    const enhancedUsers = users.map((u) => ({
      ...u.toJSON(),
      leadCount: leadCountsMap[u.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      users: enhancedUsers,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      stats: {
        totalUsers,
        totalPatients,
        totalHospitals,
        totalAdmins,
        activeUsers,
      },
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Server error retrieving users list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { name, email, password, role, phone, city, state, hospitalId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 409 });
    }

    const passHash = await hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: passHash,
      role,
      phone: phone ? phone.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      hospitalId: hospitalId ? Number(hospitalId) : null,
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Server error creating user' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { id, name, phone, role, status, city, state, address, pincode, newPassword, hospitalId } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent non-super-admins from modifying super-admins
    if (targetUser.role === 'SUPER_ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admins can modify Super Admin accounts' }, { status: 403 });
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (role !== undefined) updatePayload.role = role;
    if (status !== undefined) updatePayload.status = status;
    if (city !== undefined) updatePayload.city = city ? city.trim() : null;
    if (state !== undefined) updatePayload.state = state ? state.trim() : null;
    if (address !== undefined) updatePayload.address = address ? address.trim() : null;
    if (pincode !== undefined) updatePayload.pincode = pincode ? pincode.trim() : null;
    if (hospitalId !== undefined) updatePayload.hospitalId = hospitalId ? Number(hospitalId) : null;

    if (newPassword && newPassword.trim().length >= 6) {
      updatePayload.passwordHash = await hashPassword(newPassword.trim());
    }

    await targetUser.update(updatePayload);

    return NextResponse.json({
      success: true,
      message: 'User details updated successfully',
      user: targetUser,
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Server error updating user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Safety checks: Cannot delete self or Super Admin
    if (Number(targetUser.id) === Number(authUser.userId)) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin accounts cannot be deleted.' }, { status: 403 });
    }

    await targetUser.destroy();

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been deleted successfully.`,
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Server error deleting user' }, { status: 500 });
  }
}
