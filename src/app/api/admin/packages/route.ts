import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { LeadPackage } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const packages = await LeadPackage.findAll({ order: [['price', 'ASC']] });
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Admin GET packages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { name, leadCount, price, currency, validityDays, description, status } = await req.json();

    if (!name || !leadCount || price === undefined) {
      return NextResponse.json({ error: 'Package name, lead count and price are required' }, { status: 400 });
    }

    const pkg = await LeadPackage.create({
      name: name.trim(),
      leadCount: Number(leadCount),
      price: Number(price),
      currency: currency || 'INR',
      validityDays: validityDays ? Number(validityDays) : null,
      description: description ? description.trim() : null,
      status: status || 'ACTIVE',
    });

    return NextResponse.json({ message: 'Lead Package created', package: pkg }, { status: 201 });
  } catch (error) {
    console.error('Admin POST package error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id, name, leadCount, price, currency, validityDays, description, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const pkg = await LeadPackage.findByPk(id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    await pkg.update({
      name: name ? name.trim() : pkg.name,
      leadCount: leadCount !== undefined ? Number(leadCount) : pkg.leadCount,
      price: price !== undefined ? Number(price) : pkg.price,
      currency: currency !== undefined ? currency : pkg.currency,
      validityDays: validityDays !== undefined ? Number(validityDays) : pkg.validityDays,
      description: description !== undefined ? description : pkg.description,
      status: status !== undefined ? status : pkg.status,
    });

    return NextResponse.json({ message: 'Package updated', package: pkg });
  } catch (error) {
    console.error('Admin PUT package error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const pkg = await LeadPackage.findByPk(id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    await pkg.destroy();
    return NextResponse.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Admin DELETE package error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
