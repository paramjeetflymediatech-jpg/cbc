import dotenv from 'dotenv';
import path from 'path';

// Load environment variables prior to importing models & DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrate() {
  const { connectDB, sequelize } = await import('../lib/db');
  console.log('🔄 Connecting to database to apply schema updates...');
  await connectDB();

  try {
    // 1. Check and add columns to `users` table
    const [userCols]: any = await sequelize.query('SHOW COLUMNS FROM `users`');
    const existingUserCols = new Set(userCols.map((c: any) => c.Field));

    const userFieldsToAdd = [
      { name: 'avatar', sql: 'ALTER TABLE `users` ADD COLUMN `avatar` VARCHAR(500) NULL DEFAULT NULL' },
      { name: 'address', sql: 'ALTER TABLE `users` ADD COLUMN `address` TEXT NULL DEFAULT NULL' },
      { name: 'city', sql: 'ALTER TABLE `users` ADD COLUMN `city` VARCHAR(100) NULL DEFAULT NULL' },
      { name: 'state', sql: 'ALTER TABLE `users` ADD COLUMN `state` VARCHAR(100) NULL DEFAULT NULL' },
      { name: 'pincode', sql: 'ALTER TABLE `users` ADD COLUMN `pincode` VARCHAR(20) NULL DEFAULT NULL' },
    ];

    for (const field of userFieldsToAdd) {
      if (!existingUserCols.has(field.name)) {
        await sequelize.query(field.sql);
        console.log(`✅ Added column '${field.name}' to 'users' table`);
      } else {
        console.log(`ℹ️ Column '${field.name}' already exists in 'users' table`);
      }
    }

    // 2. Check and add columns to `leads` table
    const [leadCols]: any = await sequelize.query('SHOW COLUMNS FROM `leads`');
    const existingLeadCols = new Set(leadCols.map((c: any) => c.Field));

    if (!existingLeadCols.has('deletedByUser')) {
      await sequelize.query('ALTER TABLE `leads` ADD COLUMN `deletedByUser` TINYINT(1) NOT NULL DEFAULT 0');
      console.log(`✅ Added column 'deletedByUser' to 'leads' table`);
    } else {
      console.log(`ℹ️ Column 'deletedByUser' already exists in 'leads' table`);
    }

    console.log('\n🎉 Database schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
