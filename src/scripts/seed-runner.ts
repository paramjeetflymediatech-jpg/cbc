import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing any database models
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  try {
    console.log('Environment configuration loaded:');
    console.log('• MYSQL_HOST:', process.env.MYSQL_HOST);
    console.log('• MYSQL_USER:', process.env.MYSQL_USER);
    console.log('• MYSQL_DATABASE:', process.env.MYSQL_DATABASE);

    // Dynamically import seedDatabase AFTER process.env is configured
    const { seedDatabase } = await import('../lib/seed');
    await seedDatabase();

    console.log('✅ Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }
}

main();
