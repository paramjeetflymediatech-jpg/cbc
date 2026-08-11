import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { initAssociations } from '@/models';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    initAssociations();
    await sequelize.authenticate();
    await sequelize.sync();
    await seedDatabase();
    return NextResponse.json({ message: 'Database seeded successfully with states, cities, services, and default admin.' });
  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: 'Seed failed', details: error?.message }, { status: 500 });
  }
}
