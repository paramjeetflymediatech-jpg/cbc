import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { State, City, initAssociations } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    initAssociations();

    // Ensure tables exist before querying
    await State.sync({ alter: true });
    await City.sync({ alter: true });

    const { searchParams } = new URL(req.url);
    const stateId = searchParams.get('stateId');
    const stateName = searchParams.get('state');

    if (stateId) {
      const cities = await City.findAll({
        where: { stateId: Number(stateId), status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ cities });
    }

    if (stateName) {
      const stateObj = await State.findOne({ where: { name: stateName } });
      if (!stateObj) {
        return NextResponse.json({ cities: [] });
      }
      const cities = await City.findAll({
        where: { stateId: stateObj.id, status: 'ACTIVE' },
        order: [['name', 'ASC']],
      });
      return NextResponse.json({ state: stateObj, cities });
    }

    // Fetch all states with associated active cities
    const states = await State.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: City,
          as: 'cities',
          where: { status: 'ACTIVE' },
          required: false,
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: City, as: 'cities' }, 'name', 'ASC'],
      ],
    });

    return NextResponse.json({ states });
  } catch (error) {
    console.error('GET locations error:', error);
    return NextResponse.json({ error: 'Server error fetching locations' }, { status: 500 });
  }
}
