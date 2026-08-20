import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables before importing DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function importSeoData() {
  const jsonPath = path.resolve(process.cwd(), 'src/data/extracted_seo_data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON file not found at: ${jsonPath}. Run 'npm run extract:seo' first.`);
    process.exit(1);
  }

  console.log('Connecting to database...');
  console.log(`• Host: ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`• DB: ${process.env.MYSQL_DATABASE || 'clinicbychoice'}`);

  const { connectDB } = await import('@/lib/db');
  const { SeoMetadata, Service } = await import('@/models');
  const { Op } = await import('sequelize');

  await connectDB();

  const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const seoRecords = fileData.seoMetadata || [];

  console.log(`Found ${seoRecords.length} SEO metadata records to insert/update...`);

  // 1. Remove obsolete legacy un-prefixed paths that were replaced
  const validPaths = new Set(seoRecords.map((r: any) => r.path));
  
  // Clean individual /blog/ paths from seo_metadata
  await SeoMetadata.destroy({
    where: {
      path: {
        [Op.like]: '/blog/%',
      },
    },
  });

  // Clean old un-prefixed service paths (e.g., /gastroenterologist, /dermatologists, etc.)
  const allDbSeo = await SeoMetadata.findAll({ attributes: ['id', 'path'] });
  let deletedOld = 0;
  for (const entry of allDbSeo) {
    if (!validPaths.has(entry.path)) {
      await entry.destroy();
      deletedOld++;
    }
  }
  if (deletedOld > 0) {
    console.log(`🧹 Cleaned up ${deletedOld} old/outdated SEO paths from database.`);
  }

  let seoInserted = 0;
  let seoUpdated = 0;
  let servicesUpdated = 0;

  for (const item of seoRecords) {
    try {
      // Never insert individual blog post paths into seo_metadata (they belong in blog_posts)
      if (item.path && item.path.startsWith('/blog/')) {
        continue;
      }

      const existing = await SeoMetadata.findOne({ where: { path: item.path } });
      if (existing) {
        await existing.update({
          pageName: item.pageName,
          title: item.title,
          description: item.description,
          keywords: item.keywords,
          canonicalUrl: item.canonicalUrl,
          ogTitle: item.ogTitle,
          ogDescription: item.ogDescription,
          ogImage: item.ogImage,
          robotsIndex: item.robotsIndex,
          schemaMarkup: item.schemaMarkup,
        });
        seoUpdated++;
      } else {
        await SeoMetadata.create({
          pageName: item.pageName,
          path: item.path,
          title: item.title,
          description: item.description,
          keywords: item.keywords,
          canonicalUrl: item.canonicalUrl,
          ogTitle: item.ogTitle,
          ogDescription: item.ogDescription,
          ogImage: item.ogImage,
          robotsIndex: item.robotsIndex,
          schemaMarkup: item.schemaMarkup,
        });
        seoInserted++;
      }

      // Also update services table if slug matches
      if (item.slug) {
        const matchingService = await Service.findOne({
          where: {
            [Op.or]: [
              { slug: item.slug },
              { slug: item.slug.replace(/s$/, '') },
            ],
          },
        });
        if (matchingService) {
          await matchingService.update({
            seoTitle: item.title,
            seoDescription: item.description,
          });
          servicesUpdated++;
        }
      }
    } catch (err) {
      console.warn(`Warning processing path ${item.path}:`, (err as Error)?.message || err);
    }
  }

  console.log('\n========================================');
  console.log('✅ SEO DATA IMPORT SUMMARY:');
  console.log(`- New SEO Metadata Records Created: ${seoInserted}`);
  console.log(`- Existing SEO Metadata Records Updated: ${seoUpdated}`);
  console.log(`- Services SEO Details Updated: ${servicesUpdated}`);
  console.log('========================================\n');
}

importSeoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during SEO import:', err);
    process.exit(1);
  });
