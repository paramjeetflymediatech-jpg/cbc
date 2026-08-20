import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser, comparePassword, hashPassword } from '@/lib/auth';
import { User, Lead, Hospital } from '@/models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findByPk(authUser.userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Calculate user inquiry stats
    const leads = await Lead.findAll({
      where: {
        [Op.or]: [{ userId: user.id }, { email: user.email.toLowerCase().trim() }],
      },
      attributes: ['id', 'hospitalId', 'status'],
    });

    const uniqueHospitalIds = new Set(leads.map((l) => l.hospitalId).filter(Boolean));

    const stats = {
      totalEnquiries: leads.length,
      totalHospitalsContacted: uniqueHospitalIds.size,
      activeEnquiries: leads.filter((l) => ['NEW', 'CONTACTED', 'IN_PROGRESS'].includes(l.status)).length,
      resolvedEnquiries: leads.filter((l) => ['CONVERTED', 'CLOSED'].includes(l.status)).length,
    };

    return NextResponse.json({
      user,
      stats,
    });
  } catch (error) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json({ error: 'Server error fetching profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findByPk(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const { name, phone, currentPassword, newPassword } = await req.json();

    const updates: Partial<User> = {};

    if (name && typeof name === 'string') {
      updates.name = name.trim();
    }
    if (phone !== undefined) {
      updates.phone = phone ? phone.trim() : null;
    }

    // Password change request
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Please enter your current password to set a new password.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password. Please try again.' }, { status: 400 });
      }

      updates.passwordHash = await hashPassword(newPassword);
    }

    await user.update(updates);

    return NextResponse.json({
      success: true,
      message: newPassword
        ? 'Profile and password updated successfully!'
        : 'Profile details updated successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Server error updating profile' }, { status: 500 });
  }
}
