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

  await connectDB();

  const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const seoRecords = fileData.seoMetadata || [];

  console.log(`Found ${seoRecords.length} SEO metadata records to insert/update...`);

  let seoInserted = 0;
  let seoUpdated = 0;
  let servicesUpdated = 0;

  for (const item of seoRecords) {
    try {
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
        const matchingService = await Service.findOne({ where: { slug: item.slug } });
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
