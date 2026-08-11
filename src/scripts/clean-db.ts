import dotenv from 'dotenv';
import path from 'path';

// Load environment variables prior to importing models & DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function cleanDatabase() {
  const { connectDB, getSequelize } = await import('../lib/db');

  console.log(' Connecting to database...');
  const sequelize = await connectDB();
  const dbInstance = getSequelize();

  if (!sequelize || !dbInstance) {
    throw new Error('Database connection failed.');
  }

  console.log(' Disabling foreign key checks...');
  await dbInstance.query('SET FOREIGN_KEY_CHECKS = 0;');

  try {
    console.log(' Dropping and recreating all tables in the database...');

    await dbInstance.query(`
      DROP TABLE IF EXISTS 
        lead_transactions, leads, hospital_packages, payments, 
        hospital_services, notifications, users, hospitals, 
        lead_packages, cities, districts, states, services;
    `);

    console.log(' Rebuilding clean database schema...');
    await dbInstance.sync();

    console.log(' All tables cleaned & rebuilt successfully!');
  } finally {
    console.log(' Re-enabling foreign key checks...');
    await dbInstance.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

async function main() {
  try {
    console.log('----------------------------------------------------');
    console.log(' Clinic By Choice - Database Cleanup Tool');
    console.log('----------------------------------------------------');
    console.log('• MYSQL_HOST:', process.env.MYSQL_HOST || '127.0.0.1');
    console.log('• MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('• MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'clinicbychoice');
    console.log('----------------------------------------------------');

    await cleanDatabase();

    // Check if --seed flag was passed
    if (process.argv.includes('--seed')) {
      console.log('\n Re-seeding database...');
      const { seedDatabase } = await import('../lib/seed');
      await seedDatabase();
    }

    console.log(' Done!');
    process.exit(0);
  } catch (error) {
    console.error(' Database cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
