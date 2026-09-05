import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Lead, Hospital, Service, User } from '@/models';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const leadId = Number(id);
    if (!leadId) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    await connectDB();

    const lead = await Lead.findByPk(leadId, {
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'slug', 'city', 'state', 'district', 'address', 'phone', 'email', 'rating', 'leadsRemaining'],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category', 'icon', 'image'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
          required: false,
        },
      ],
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Admin lead GET detail error:', error);
    return NextResponse.json({ error: 'Server error loading lead details' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const leadId = Number(id);
    if (!leadId) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    await connectDB();

    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      status,
      patientName,
      phone,
      email,
      city,
      message,
      preferredContactTime,
      hospitalId,
      serviceId,
      newNote,
      notes,
    } = body;

    let updatedNotes = Array.isArray(notes) ? notes : Array.isArray(lead.notes) ? [...lead.notes] : [];

    if (newNote && typeof newNote === 'string' && newNote.trim()) {
      updatedNotes.unshift({
        content: newNote.trim(),
        author: authUser.name || 'Super Admin',
        createdAt: new Date().toISOString(),
      });
    }

    await lead.update({
      status: status || lead.status,
      patientName: patientName !== undefined ? patientName.trim() : lead.patientName,
      phone: phone !== undefined ? phone.trim() : lead.phone,
      email: email !== undefined ? email.trim() : lead.email,
      city: city !== undefined ? city.trim() : lead.city,
      message: message !== undefined ? message : lead.message,
      preferredContactTime: preferredContactTime !== undefined ? preferredContactTime : lead.preferredContactTime,
      hospitalId: hospitalId !== undefined ? Number(hospitalId) : lead.hospitalId,
      serviceId: serviceId !== undefined ? Number(serviceId) : lead.serviceId,
      notes: updatedNotes,
    });

    const refreshedLead = await Lead.findByPk(leadId, {
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'slug', 'city', 'state', 'district', 'address', 'phone', 'email', 'rating', 'leadsRemaining'],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category', 'icon', 'image'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
          required: false,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      lead: refreshedLead,
    });
  } catch (error) {
    console.error('Admin lead PATCH error:', error);
    return NextResponse.json({ error: 'Server error updating lead' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const leadId = Number(id);
    if (!leadId) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    await connectDB();

    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await lead.destroy();

    return NextResponse.json({ success: true, message: 'Lead deleted permanently' });
  } catch (error) {
    console.error('Admin lead DELETE error:', error);
    return NextResponse.json({ error: 'Server error deleting lead' }, { status: 500 });
  }
}
