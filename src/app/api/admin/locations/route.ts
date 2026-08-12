import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { State, District, City, initAssociations } from '@/models';
import { cleanLocationName } from '@/lib/locationUtils';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    initAssociations();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const type = searchParams.get('type') || 'ALL'; // 'STATE' | 'DISTRICT' | 'CITY' | 'ALL'
    const stateId = searchParams.get('stateId');
    const districtId = searchParams.get('districtId');

    const states = await State.findAll({
      order: [['name', 'ASC']],
    });

    const districtWhere: Record<string | symbol, unknown> = {};
    if (stateId) districtWhere.stateId = Number(stateId);
    if (search) districtWhere.name = { [Op.like]: `%${search}%` };

    const districts = await District.findAll({
      where: districtWhere,
      order: [['name', 'ASC']],
    });

    const cityWhere: Record<string | symbol, unknown> = {};
    if (stateId) cityWhere.stateId = Number(stateId);
    if (districtId) cityWhere.districtId = Number(districtId);
    if (search) cityWhere.name = { [Op.like]: `%${search}%` };

    const cities = await City.findAll({
      where: cityWhere,
      order: [['name', 'ASC']],
    });

    return NextResponse.json({
      states,
      districts,
      cities,
      type,
    });
  } catch (error) {
    console.error('Admin GET locations error:', error);
    return NextResponse.json({ error: 'Server error fetching locations.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { entityType, name, stateId, districtId, isPopular, status } = body;

    if (!entityType || !name) {
      return NextResponse.json({ error: 'Entity type and name are required.' }, { status: 400 });
    }

    const cleanName = cleanLocationName(name);

    if (entityType === 'STATE') {
      const existing = await State.findOne({ where: { name: { [Op.like]: cleanName } } });
      if (existing) {
        return NextResponse.json({ error: `State "${cleanName}" already exists.` }, { status: 400 });
      }
      const state = await State.create({
        name: cleanName,
        status: status || 'ACTIVE',
      });
      return NextResponse.json({ message: 'State created successfully', state }, { status: 201 });
    }

    if (entityType === 'DISTRICT') {
      if (!stateId) {
        return NextResponse.json({ error: 'State selection is required for district.' }, { status: 400 });
      }
      const existing = await District.findOne({
        where: { stateId: Number(stateId), name: { [Op.like]: cleanName } },
      });
      if (existing) {
        return NextResponse.json({ error: `District "${cleanName}" already exists in this state.` }, { status: 400 });
      }
      const district = await District.create({
        stateId: Number(stateId),
        name: cleanName,
        status: status || 'ACTIVE',
      });
      return NextResponse.json({ message: 'District created successfully', district }, { status: 201 });
    }

    if (entityType === 'CITY') {
      if (!stateId) {
        return NextResponse.json({ error: 'State selection is required for city.' }, { status: 400 });
      }
      const existing = await City.findOne({
        where: { stateId: Number(stateId), name: { [Op.like]: cleanName } },
      });
      if (existing) {
        return NextResponse.json({ error: `City "${cleanName}" already exists in this state.` }, { status: 400 });
      }
      const city = await City.create({
        stateId: Number(stateId),
        districtId: districtId ? Number(districtId) : null,
        name: cleanName,
        isPopular: Boolean(isPopular),
        status: status || 'ACTIVE',
      });
      return NextResponse.json({ message: 'City created successfully', city }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error) {
    console.error('Admin POST location error:', error);
    return NextResponse.json({ error: 'Server error creating location.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { entityType, id, name, stateId, districtId, isPopular, status } = body;

    if (!entityType || !id || !name) {
      return NextResponse.json({ error: 'ID, Entity type, and Name are required.' }, { status: 400 });
    }

    const cleanName = cleanLocationName(name);

    if (entityType === 'STATE') {
      const state = await State.findByPk(Number(id));
      if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 });

      await state.update({
        name: cleanName,
        status: status || state.status,
      });
      return NextResponse.json({ message: 'State updated successfully', state });
    }

    if (entityType === 'DISTRICT') {
      const district = await District.findByPk(Number(id));
      if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

      await district.update({
        name: cleanName,
        stateId: stateId ? Number(stateId) : district.stateId,
        status: status || district.status,
      });
      return NextResponse.json({ message: 'District updated successfully', district });
    }

    if (entityType === 'CITY') {
      const city = await City.findByPk(Number(id));
      if (!city) return NextResponse.json({ error: 'City not found' }, { status: 404 });

      await city.update({
        name: cleanName,
        stateId: stateId ? Number(stateId) : city.stateId,
        districtId: districtId !== undefined ? (districtId ? Number(districtId) : null) : city.districtId,
        isPopular: isPopular !== undefined ? Boolean(isPopular) : city.isPopular,
        status: status || city.status,
      });
      return NextResponse.json({ message: 'City updated successfully', city });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error) {
    console.error('Admin PUT location error:', error);
    return NextResponse.json({ error: 'Server error updating location.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const id = searchParams.get('id');

    if (!entityType || !id) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 });
    }

    const numId = Number(id);

    if (entityType === 'STATE') {
      await State.destroy({ where: { id: numId } });
      return NextResponse.json({ message: 'State deleted successfully' });
    }

    if (entityType === 'DISTRICT') {
      await District.destroy({ where: { id: numId } });
      return NextResponse.json({ message: 'District deleted successfully' });
    }

    if (entityType === 'CITY') {
      await City.destroy({ where: { id: numId } });
      return NextResponse.json({ message: 'City deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error) {
    console.error('Admin DELETE location error:', error);
    return NextResponse.json({ error: 'Server error deleting location.' }, { status: 500 });
  }
}
