import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  try {
    const { connectDB } = await import('../lib/db');
    const db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database');
      process.exit(1);
    }
    const { Setting, SeoMetadata } = await import('../models');
    
    console.log('Syncing Setting table...');
    await Setting.sync({ force: true });
    console.log('✅ Setting table synced successfully!');

    console.log('Syncing SeoMetadata table...');
    await SeoMetadata.sync({ force: true });
    console.log('✅ SeoMetadata table synced successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync script failed:', error);
    process.exit(1);
  }
}

main();
