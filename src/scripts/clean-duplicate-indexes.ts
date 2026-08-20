import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function cleanDuplicateIndexes() {
  const { sequelize } = await import('../lib/db');
  console.log('🔄 Inspecting and cleaning up duplicate indexes from tables...');

  try {
    const [tables]: any = await sequelize.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];
    const tableNames = tables.map((t: any) => t[tableKey]);

    for (const table of tableNames) {
      const [indexes]: any = await sequelize.query(`SHOW INDEX FROM \`${table}\``);
      const indexNames = Array.from(new Set(indexes.map((i: any) => i.Key_name))) as string[];

      // Find redundant numbered duplicate indexes created by sync({ alter: true })
      // e.g. path_2, path_3, slug_2, slug_3, etc.
      const duplicateIndexes = indexNames.filter((name) => {
        if (name === 'PRIMARY') return false;
        // Matches names like `name_2`, `name_3`, `name_64`, `slug_12`, etc.
        return /_\d+$/.test(name);
      });

      if (duplicateIndexes.length > 0) {
        console.log(`🧹 Table '${table}' has ${duplicateIndexes.length} redundant duplicate indexes.`);
        for (const idxName of duplicateIndexes) {
          try {
            await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${idxName}\``);
          } catch (dropErr: any) {
            console.warn(`  Could not drop index ${idxName}:`, dropErr.message);
          }
        }
        console.log(`✅ Successfully cleaned up duplicate indexes on '${table}'.`);
      } else {
        console.log(`✨ Table '${table}' is clean (Total indexes: ${indexNames.length}).`);
      }
    }

    console.log('\n🎉 All duplicate MySQL indexes have been cleaned up!');
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
  }
}

if (require.main === module) {
  cleanDuplicateIndexes().then(() => process.exit(0));
}
