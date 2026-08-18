import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  try {
    const { connectDB } = await import('../lib/db');
    console.log('Connecting to database...');
    const db = await connectDB();
    if (!db) {
      console.error('Failed to connect to database');
      process.exit(1);
    }
    
    const { BlogPost } = await import('../models');
    console.log('Syncing BlogPost table with alter: true...');
    await BlogPost.sync({ alter: true });
    
    console.log('✅ BlogPost table schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ BlogPost sync failed:', error);
    process.exit(1);
  }
}

main();
