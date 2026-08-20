import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function cleanupBlogSeo() {
  // 1. Clean JSON file
  const jsonPath = path.resolve(process.cwd(), 'src/data/extracted_seo_data.json');
  if (fs.existsSync(jsonPath)) {
    const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const beforeCount = fileData.seoMetadata?.length || 0;
    fileData.seoMetadata = (fileData.seoMetadata || []).filter(
      (item: any) => !item.path || !item.path.startsWith('/blog/')
    );
    const afterCount = fileData.seoMetadata.length;
    fs.writeFileSync(jsonPath, JSON.stringify(fileData, null, 2), 'utf8');
    console.log(`✅ Cleaned extracted_seo_data.json: removed ${beforeCount - afterCount} blog post entries (retained ${afterCount} core page entries).`);
  }

  // 2. Clean Database seo_metadata table
  try {
    const { connectDB } = await import('@/lib/db');
    const { SeoMetadata } = await import('@/models');
    await connectDB();

    const deleted = await SeoMetadata.destroy({
      where: {
        path: {
          [Op.like]: '/blog/%',
        },
      },
    });

    console.log(`✅ Cleaned seo_metadata table: removed ${deleted} redundant /blog/... entries.`);
  } catch (dbErr) {
    console.warn('Database cleanup notice:', (dbErr as Error)?.message || dbErr);
  }
}

cleanupBlogSeo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  });
