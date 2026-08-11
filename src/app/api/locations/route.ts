import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { State, District, City, initAssociations } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    initAssociations();

    // Ensure tables exist before querying
    await State.sync();
    await District.sync();
    await City.sync();

    const { searchParams } = new URL(req.url);
    const stateId = searchParams.get('stateId');
    const stateName = searchParams.get('state');
    const districtId = searchParams.get('districtId');
    const districtName = searchParams.get('district');

    if (districtId) {
      const cities = await City.findAll({
        where: { districtId: Number(districtId), status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ cities });
    }

    if (districtName) {
      const distObj = await District.findOne({ where: { name: districtName } });
      if (!distObj) {
        return NextResponse.json({ cities: [] });
      }
      const cities = await City.findAll({
        where: { districtId: distObj.id, status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ district: distObj, cities });
    }

    if (stateId) {
      const districts = await District.findAll({
        where: { stateId: Number(stateId), status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      const cities = await City.findAll({
        where: { stateId: Number(stateId), status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ districts, cities });
    }

    if (stateName) {
      const stateObj = await State.findOne({ where: { name: stateName } });
      if (!stateObj) {
        return NextResponse.json({ districts: [], cities: [] });
      }
      const districts = await District.findAll({
        where: { stateId: stateObj.id, status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      const cities = await City.findAll({
        where: { stateId: stateObj.id, status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ state: stateObj, districts, cities });
    }

    // Fetch all states with associated active districts & cities
    const states = await State.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: District,
          as: 'districts',
          where: { status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: City,
              as: 'cities',
              where: { status: 'ACTIVE' },
              required: false,
            },
          ],
        },
        {
          model: City,
          as: 'cities',
          where: { status: 'ACTIVE' },
          required: false,
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: District, as: 'districts' }, 'name', 'ASC'],
        [{ model: City, as: 'cities' }, 'name', 'ASC'],
      ],
    });

    return NextResponse.json({ states });
  } catch (error) {
    console.error('GET locations error:', error);
    return NextResponse.json({ error: 'Server error fetching locations' }, { status: 500 });
  }
}
