import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Lead } from '@/models';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser();

    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 });
    }

    const lead = await Lead.findOne({
      where: { id: Number(id), hospitalId: authUser.hospitalId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const currentNotes = Array.isArray(lead.notes) ? lead.notes : [];
    const newNote = {
      content: content.trim(),
      author: authUser.name || 'Hospital Staff',
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...currentNotes];
    await lead.update({ notes: updatedNotes });

    return NextResponse.json({ message: 'Note added successfully', notes: updatedNotes });
  } catch (error) {
    console.error('Add lead note error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
