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

    console.log('Clearing existing SEO and Setting test records...');
    await SeoMetadata.destroy({ where: {} });
    
    // Seed settings keys
    console.log('Seeding global settings...');
    await Setting.upsert({ key: 'google_analytics_id', value: 'G-DUMMY12345' });
    await Setting.upsert({ key: 'google_tag_manager_id', value: 'GTM-DUMMY67890' });
    await Setting.upsert({
      key: 'global_schema',
      value: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Clinic By Choice Network',
        'url': 'https://clinicbychoice.com',
        'logo': 'https://clinicbychoice.com/images/logoblac.png',
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+91-81462-69537',
          'contactType': 'customer service'
        }
      }, null, 2)
    });
    await Setting.upsert({ key: 'header_script', value: '<!-- Seeded Global Header Script -->' });
    await Setting.upsert({ key: 'footer_script', value: '<!-- Seeded Global Footer Script -->' });

    // Seed SEO metadata overrides
    console.log('Seeding SEO page metadata overrides...');
    
    await SeoMetadata.create({
      pageName: 'Homepage Override',
      path: '/',
      title: 'Clinic By Choice | Seeded Premium Healthcare & Medical Tourism',
      description: 'Find top-rated accredited hospitals and clinics in India. Compare medical tour packages and consult with board-certified specialists.',
      keywords: 'medical tourism india, best hospitals in india, clinic by choice',
      canonicalUrl: 'https://clinicbychoice.com/',
      ogTitle: 'Clinic By Choice | Premium Healthcare',
      ogDescription: 'Find the best accredited healthcare centers in India.',
      ogImage: 'https://clinicbychoice.com/images/logoblac.png',
      robotsIndex: 'index, follow',
      schemaMarkup: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Clinic By Choice',
        'url': 'https://clinicbychoice.com'
      }, null, 2)
    });

    await SeoMetadata.create({
      pageName: 'About Us Page',
      path: '/about-us',
      title: 'About Our Healthcare Network - Clinic By Choice',
      description: 'Clinic By Choice connects international and domestic patients with accredited medical centers across India. Read our mission.',
      keywords: 'about clinic by choice, medical tourism team',
      canonicalUrl: 'https://clinicbychoice.com/about-us',
      ogTitle: 'About Clinic By Choice',
      ogDescription: 'Connecting patients with elite medical facilities.',
      ogImage: 'https://clinicbychoice.com/images/mission-bg.jpg',
      robotsIndex: 'index, follow',
      schemaMarkup: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': 'About Clinic By Choice',
        'description': 'Clinic By Choice Medical Network connecting patients globally.'
      }, null, 2)
    });

    await SeoMetadata.create({
      pageName: 'Oncology Hospitals Search (Seeded)',
      path: '/hospitals/cancer-hospital/india',
      title: 'Best Cancer & Oncology Hospitals in India - Clinic By Choice',
      description: 'Search accredited oncology clinics and hospitals in India. Compare cancer treatment packages, surgery cost, and specialist doctors.',
      keywords: 'cancer hospitals india, best cancer treatment, oncology cost',
      canonicalUrl: 'https://clinicbychoice.com/hospitals/cancer-hospital/india',
      ogTitle: 'Cancer Hospitals & Treatment Costs in India',
      ogDescription: 'Compare verified oncology clinics and top cancer surgeons in India.',
      robotsIndex: 'index, follow',
      schemaMarkup: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        'aspect': 'Cancer Treatments and Surgery Centers'
      }, null, 2)
    });

    console.log('✅ SEO and script dummy data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
