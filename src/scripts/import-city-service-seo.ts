import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables prior to importing models & DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Exact 27 Service Names as per UI Navigation menu
export const EXACT_SERVICES = [
  { name: 'Anaesthesia', slug: 'anaesthesia', category: 'General Medicine' },
  { name: 'Ayurveda', slug: 'ayurveda', category: 'Alternative Care' },
  { name: 'Cancer Hospital', slug: 'cancer-hospital', category: 'Oncology' },
  { name: 'Dental Care', slug: 'dental-care', category: 'Dental' },
  { name: 'Dermatologists', slug: 'dermatologists', category: 'Dermatology' },
  { name: 'ENT Hospitals', slug: 'ent-hospitals', category: 'ENT' },
  { name: 'Eye Care', slug: 'eye-care', category: 'Ophthalmology' },
  { name: 'Gastroenterologist', slug: 'gastroenterologist', category: 'Gastroenterology' },
  { name: 'General surgery', slug: 'general-surgery', category: 'Surgery' },
  { name: 'Hair Transplant', slug: 'hair-transplant', category: 'Cosmetic Surgery' },
  { name: 'Heart Hospital', slug: 'heart-hospital', category: 'Cardiology' },
  { name: 'Hepatology', slug: 'hepatology', category: 'Hepatology' },
  { name: 'Homeopathy Hospital', slug: 'homeopathy-hospital', category: 'Alternative Care' },
  { name: 'Infertility Treatment', slug: 'infertility-treatment', category: 'Fertility' },
  { name: 'Laparoscopy', slug: 'laparoscopy', category: 'Surgery' },
  { name: 'Neonatology Hospital', slug: 'neonatology-hospital', category: 'Pediatrics' },
  { name: 'Neurologist', slug: 'neurologist', category: 'Neurology' },
  { name: 'Obstetrics & Gynecology', slug: 'obstetrics-gynecology', category: 'Gynecology' },
  { name: 'Orthopedic', slug: 'orthopedic', category: 'Orthopedics' },
  { name: 'Pediatric Orthopedics', slug: 'pediatric-orthopedics', category: 'Orthopedics' },
  { name: 'Physiotherapy', slug: 'physiotherapy', category: 'Rehabilitation' },
  { name: 'Plastic Surgery', slug: 'plastic-surgery', category: 'Plastic Surgery' },
  { name: 'Proctology Hospital', slug: 'proctology-hospital', category: 'Proctology' },
  { name: 'Psychiatrist', slug: 'psychiatrist', category: 'Psychiatry' },
  { name: 'Sexologist', slug: 'sexologist', category: 'Sexual Health' },
  { name: 'Transgender Surgery', slug: 'transgender-surgery', category: 'Surgery' },
  { name: 'Urologist', slug: 'urologist', category: 'Urology' },
];

export async function importCityServiceAndSeo() {
  const { connectDB, sequelize } = await import('../lib/db');
  const { Service } = await import('../models/Service');

  console.log('🔄 Connecting to database...');
  await connectDB();

  // Locate the CSV file
  const possiblePaths = [
    path.resolve(process.cwd(), 'data/India_Cities_Towns_Statewise - City Service Mapping.csv'),
    '/Users/flymedia/Downloads/India_Cities_Towns_Statewise - City Service Mapping.csv',
  ];

  let csvPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  if (!csvPath) {
    console.error('❌ Could not locate India_Cities_Towns_Statewise - City Service Mapping.csv file.');
    process.exit(1);
  }

  console.log(`📂 Using CSV file at: ${csvPath}`);

  // 1. Synchronize Exact 27 Services in `services` table
  console.log('🛠️ Setting up exact 27 Services in database...');
  const serviceMap = new Map<string, any>();

  for (const item of EXACT_SERVICES) {
    let [service] = await Service.findOrCreate({
      where: { slug: item.slug },
      defaults: {
        name: item.name,
        slug: item.slug,
        category: item.category,
        status: 'ACTIVE',
      },
    });

    // Ensure name is clean and exact
    if (service.name !== item.name) {
      await service.update({ name: item.name, category: item.category, status: 'ACTIVE' });
    }

    serviceMap.set(item.slug.toLowerCase(), service);
    serviceMap.set(item.name.toLowerCase().trim(), service);
    serviceMap.set(slugify(item.name), service);
  }

  // Also check existing DB services and register them
  const allDbServices = await Service.findAll();
  for (const s of allDbServices) {
    if (!serviceMap.has(s.slug.toLowerCase())) {
      serviceMap.set(s.slug.toLowerCase(), s);
    }
    if (!serviceMap.has(s.name.toLowerCase().trim())) {
      serviceMap.set(s.name.toLowerCase().trim(), s);
    }
  }

  // 2. Read and parse CSV
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineIndex = 0;
  const BATCH_SIZE = 1000;
  let serviceLocationBatch: any[] = [];
  let seoMetadataBatch: any[] = [];
  let totalProcessed = 0;

  console.log('🚀 Beginning bulk import of ServiceLocations and SeoMetadata...');

  for await (const line of rl) {
    lineIndex++;
    if (lineIndex === 1 || !line.trim()) continue; // Skip header and empty lines

    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    const [stateRaw, cityRaw, serviceRaw, metaTitle, metaDescription, ogTitle, ogDescription] = cols;
    const stateName = (stateRaw || '').trim();
    const cityName = (cityRaw || '').trim();
    const serviceNameRaw = (serviceRaw || '').trim();

    if (!cityName || !serviceNameRaw) continue;

    const sSlug = slugify(serviceNameRaw);
    const citySlug = slugify(cityName);

    // Find matching service
    let matchedService =
      serviceMap.get(sSlug) ||
      serviceMap.get(serviceNameRaw.toLowerCase()) ||
      serviceMap.get(serviceNameRaw.toLowerCase().replace(/s$/, ''));

    if (!matchedService) {
      matchedService = await Service.create({
        name: serviceNameRaw,
        slug: sSlug,
        status: 'ACTIVE',
      });
      serviceMap.set(sSlug, matchedService);
      serviceMap.set(serviceNameRaw.toLowerCase(), matchedService);
    }

    const serviceId = matchedService.id;
    const actualServiceSlug = matchedService.slug || sSlug;
    const actualServiceName = matchedService.name || serviceNameRaw;

    // Requested banner name format: "service name in cityname "
    const bannerName = `${actualServiceName} in ${cityName}`;
    const pagePath = `/hospitals/${actualServiceSlug}/${citySlug}`;

    // ServiceLocation record
    serviceLocationBatch.push({
      serviceId,
      serviceSlug: actualServiceSlug,
      serviceTitle: bannerName, // Banner Name
      cityName,
      citySlug,
      stateName,
      shortDescription: metaDescription || `Find the best ${actualServiceName} hospitals and doctors in ${cityName}, ${stateName}.`,
      seoTitle: metaTitle || `${bannerName} | Clinic By Choice`,
      seoDescription: metaDescription || `Explore ${actualServiceName} care options in ${cityName}, ${stateName}. Compare top accredited hospitals and specialists.`,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // SeoMetadata record
    seoMetadataBatch.push({
      pageName: bannerName,
      path: pagePath,
      title: metaTitle || `${bannerName} | Clinic By Choice`,
      description: metaDescription || `Explore ${actualServiceName} care options in ${cityName}, ${stateName}.`,
      ogTitle: (ogTitle || metaTitle || `${bannerName} | Clinic By Choice`).trim(),
      ogDescription: (ogDescription || metaDescription || '').trim(),
      canonicalUrl: `https://clinicbychoice.com${pagePath}`,
      robotsIndex: 'index, follow',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (serviceLocationBatch.length >= BATCH_SIZE) {
      await insertBatches(serviceLocationBatch, seoMetadataBatch, sequelize);
      totalProcessed += serviceLocationBatch.length;
      if (totalProcessed % 5000 === 0 || totalProcessed >= 30000) {
        console.log(`⏳ Processed ${totalProcessed} / 32,239 records...`);
      }
      serviceLocationBatch = [];
      seoMetadataBatch = [];
    }
  }

  // Insert remaining records
  if (serviceLocationBatch.length > 0) {
    await insertBatches(serviceLocationBatch, seoMetadataBatch, sequelize);
    totalProcessed += serviceLocationBatch.length;
  }

  console.log(`\n🎉 Successfully imported and synchronized ${totalProcessed} ServiceLocation and SeoMetadata records with exact service names!`);
  process.exit(0);
}

async function insertBatches(serviceLocations: any[], seoMetadata: any[], sequelizeInstance: any) {
  if (serviceLocations.length === 0) return;

  // Bulk upsert for service_locations using raw SQL for speed and reliability
  const slValues: string[] = [];
  for (const sl of serviceLocations) {
    const esc = (val: any) => (val ? sequelizeInstance.escape(val) : 'NULL');
    slValues.push(
      `(${sl.serviceId}, ${esc(sl.serviceSlug)}, ${esc(sl.serviceTitle)}, ${esc(sl.cityName)}, ${esc(sl.citySlug)}, ${esc(sl.stateName)}, ${esc(sl.shortDescription)}, ${esc(sl.seoTitle)}, ${esc(sl.seoDescription)}, 'ACTIVE', NOW(), NOW())`
    );
  }

  const slQuery = `
    INSERT INTO service_locations (serviceId, serviceSlug, serviceTitle, cityName, citySlug, stateName, shortDescription, seoTitle, seoDescription, status, createdAt, updatedAt)
    VALUES ${slValues.join(',\n')}
    ON DUPLICATE KEY UPDATE
      serviceTitle = VALUES(serviceTitle),
      seoTitle = VALUES(seoTitle),
      seoDescription = VALUES(seoDescription),
      shortDescription = VALUES(shortDescription),
      stateName = VALUES(stateName),
      status = 'ACTIVE',
      updatedAt = NOW()
  `;

  // Bulk upsert for seo_metadata
  const seoValues: string[] = [];
  for (const seo of seoMetadata) {
    const esc = (val: any) => (val ? sequelizeInstance.escape(val) : 'NULL');
    seoValues.push(
      `(${esc(seo.pageName)}, ${esc(seo.path)}, ${esc(seo.title)}, ${esc(seo.description)}, ${esc(seo.ogTitle)}, ${esc(seo.ogDescription)}, ${esc(seo.canonicalUrl)}, 'index, follow', NOW(), NOW())`
    );
  }

  const seoQuery = `
    INSERT INTO seo_metadata (pageName, path, title, description, ogTitle, ogDescription, canonicalUrl, robotsIndex, createdAt, updatedAt)
    VALUES ${seoValues.join(',\n')}
    ON DUPLICATE KEY UPDATE
      pageName = VALUES(pageName),
      title = VALUES(title),
      description = VALUES(description),
      ogTitle = VALUES(ogTitle),
      ogDescription = VALUES(ogDescription),
      canonicalUrl = VALUES(canonicalUrl),
      updatedAt = NOW()
  `;

  await sequelizeInstance.query(slQuery);
  await sequelizeInstance.query(seoQuery);
}

if (require.main === module) {
  importCityServiceAndSeo().catch((err) => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}
