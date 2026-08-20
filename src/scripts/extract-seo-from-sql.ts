import fs from 'fs';
import readline from 'readline';
import path from 'path';

interface WPPost {
  id: number;
  title: string;
  slug: string;
  type: string;
  status: string;
}

interface WPAIOSEO {
  postId?: number;
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  schema?: string;
  robotsNoIndex?: boolean;
}

const VALID_POST_TYPES = new Set(['page', 'post', 'doctor', 'product', 'service', 'hospital']);

const KNOWN_SERVICES = [
  'orthopedic',
  'orthopedics',
  'gastroenterologist',
  'gastroenterology',
  'dermatologists',
  'dermatologist',
  'dermatology',
  'transgender-surgery',
  'dental-care',
  'eye-care',
  'neurologist',
  'neurology',
  'urologist',
  'urology',
  'sexologist',
  'plastic-surgery',
  'infertility-treatment',
  'hair-transplant',
  'ent-hospitals',
  'practology-hospitals',
  'pediatric-orthopedics',
  'anaesthesia',
  'cancer-hospital',
  'laparoscopy',
  'obstetrics-and-gynecology',
  'neonatology-hospital',
  'homeopathy-hospital',
  'psychiatrist',
  'heart-hospital',
  'ayurdeva',
  'general-surgery',
  'hepatologyy',
  'physiotherapy',
  'cardiology',
  'nephrology',
  'gynecology',
  'pediatrics',
  'ophthalmology',
  'pulmonology',
  'endocrinology',
  'rheumatology',
  'vascular-surgery',
  'bariatric-surgery',
  'ivf-fertility',
  'hematology',
  'organ-transplant',
  'critical-care',
  'pathology-diagnostics',
].sort((a, b) => b.length - a.length);

const KNOWN_CITIES = [
  'ludhiana',
  'mumbai',
  'visakhapatnam',
  'bangalore',
  'bengaluru',
  'phagwara',
  'jalandhar',
  'moga',
  'amritsar',
  'bathinda',
  'delhi',
  'patna',
  'chennai',
  'hyderabad',
  'kolkata',
  'chandigarh',
  'pune',
  'jaipur',
  'mohali',
  'patiala',
  'ahmedabad',
  'lucknow',
  'whitefield',
].sort((a, b) => b.length - a.length);

function mapSlugToNextJsPath(slug: string, postType: string): string | null {
  if (slug === 'home' || slug === 'front-page' || slug === 'home-2') return '/';
  if (slug === 'about-us') return '/about-us';
  if (slug === 'contact-us') return '/contact-us';
  if (slug === 'our-service') return '/hospital';
  if (slug === 'blog') return '/blog';
  if (slug === 'get-listed') return '/get-listed';
  if (slug === 'login' || slug === 'staff-cabinate') return null;

  const cleanSlug = slug.replace(/^hospitals-/, '');

  // Special cases
  if (slug === 'orthopatna') return '/hospitals/orthopedic/patna';
  if (slug === 'ludhiana') return '/hospital?city=Ludhiana';

  // 1. Check if it matches a service-city combination
  for (const s of KNOWN_SERVICES) {
    for (const c of KNOWN_CITIES) {
      if (cleanSlug === `${s}-${c}`) {
        return `/hospitals/${s}/${c}`;
      }
    }
  }

  // 2. Check if it is a standalone service (All-India Page)
  for (const s of KNOWN_SERVICES) {
    if (cleanSlug === s) {
      return `/hospitals/${s}/india`;
    }
  }

  // 3. Otherwise treat as hospital or clinic profile
  return `/hospital/${slug}`;
}

export async function extractSeoFromSql() {
  const sqlPath = path.resolve('/Users/flymedia/Downloads/clinicbychoice_wp_rwcjs.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found at: ${sqlPath}`);
    return;
  }

  console.log('Reading WordPress SQL dump:', sqlPath);
  const fileStream = fs.createReadStream(sqlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const postsMap = new Map<number, WPPost>();
  const aioseoMap = new Map<number, WPAIOSEO>();

  let inPostsInsert = false;
  let inAioseoInsert = false;

  for await (const line of rl) {
    // 1. Process 4rrBFRW_posts
    if (line.includes('INSERT INTO `4rrBFRW_posts`')) {
      inPostsInsert = true;
    }

    if (inPostsInsert) {
      const rowMatches = line.matchAll(/\((\d+),\s*\d+,\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'(?:[^'\\]|\\.)*',\s*'([^']*)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'((?:[^'\\]|\\.)*)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'[^']*',\s*\d+,\s*'([^']*)'/g);
      
      for (const match of rowMatches) {
        const id = parseInt(match[1], 10);
        const rawTitle = match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        const status = match[3];
        const rawSlug = match[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        const type = match[5];

        if (status === 'publish' && VALID_POST_TYPES.has(type)) {
          postsMap.set(id, {
            id,
            title: rawTitle,
            slug: rawSlug,
            type,
            status,
          });
        }
      }

      if (line.endsWith(';')) inPostsInsert = false;
    }

    // 2. Process 4rrBFRW_aioseo_posts
    if (line.includes('INSERT INTO `4rrBFRW_aioseo_posts`')) {
      inAioseoInsert = true;
    }

    if (inAioseoInsert) {
      const rowMatches = line.matchAll(/\(\d+,\s*(\d+),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL)/g);

      for (const match of rowMatches) {
        const postId = parseInt(match[1], 10);
        const title = match[2] ? match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;
        const description = match[3] ? match[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;
        const keywords = match[4] ? match[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;
        const canonicalUrl = match[7] ? match[7].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;
        const ogTitle = match[8] ? match[8].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;
        const ogDescription = match[9] ? match[9].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined;

        aioseoMap.set(postId, {
          postId,
          title,
          description,
          keywords,
          canonicalUrl,
          ogTitle,
          ogDescription,
        });
      }

      if (line.endsWith(';')) inAioseoInsert = false;
    }
  }

  const combinedSeoList = [];
  const servicesSeoList = [];

  for (const [postId, post] of postsMap.entries()) {
    // Skip individual blog posts (managed separately in BlogPost / Admin Blogs)
    if (post.type === 'post') {
      continue;
    }

    const cleanPath = mapSlugToNextJsPath(post.slug, post.type);
    if (!cleanPath) {
      continue;
    }

    const seo: WPAIOSEO = aioseoMap.get(postId) || {};

    const cleanTitle = (seo.title || post.title || '')
      .replace(/#site_title/g, 'Clinic By Choice')
      .replace(/#tagline/g, 'Medical Tourism & Healthcare in India')
      .replace(/#post_title/g, post.title)
      .replace(/#separator_sa/g, '-')
      .replace(/#sep/g, '|')
      .trim();

    const cleanDesc = (seo.description || '')
      .replace(/#site_title/g, 'Clinic By Choice')
      .replace(/#tagline/g, 'Medical Tourism & Healthcare in India')
      .replace(/#post_title/g, post.title)
      .replace(/#separator_sa/g, '-')
      .replace(/#sep/g, '|')
      .trim();

    const finalTitle = cleanTitle || `${post.title} | Clinic By Choice`;
    const finalDesc = cleanDesc || `Explore ${post.title} with Clinic By Choice. Compare premier hospitals, top doctors, and affordable healthcare in India.`;

    const seoRecord = {
      postId: post.id,
      postType: post.type,
      pageName: post.title,
      slug: post.slug,
      path: cleanPath,
      title: finalTitle,
      description: finalDesc,
      keywords: seo.keywords || `${post.title.toLowerCase()}, clinic by choice, hospitals in india`,
      canonicalUrl: seo.canonicalUrl || `https://clinicbychoice.com${cleanPath}`,
      ogTitle: seo.ogTitle || finalTitle,
      ogDescription: seo.ogDescription || finalDesc,
      ogImage: seo.ogImageUrl || 'https://clinicbychoice.com/images/og/default.jpg',
      robotsIndex: seo.robotsNoIndex ? 'noindex, nofollow' : 'index, follow',
      schemaMarkup: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: post.title,
        url: `https://clinicbychoice.com${cleanPath}`,
        description: finalDesc,
      }, null, 2),
    };

    combinedSeoList.push(seoRecord);

    if (cleanPath.startsWith('/hospitals/')) {
      servicesSeoList.push({
        slug: post.slug,
        path: cleanPath,
        name: post.title,
        seoTitle: finalTitle,
        seoDescription: finalDesc,
      });
    }
  }

  const outDir = path.resolve(process.cwd(), 'src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputPath = path.join(outDir, 'extracted_seo_data.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        source: 'clinicbychoice_wp_rwcjs.sql',
        generatedAt: new Date().toISOString(),
        totalPublicPages: combinedSeoList.length,
        seoMetadata: combinedSeoList,
        servicesSeo: servicesSeoList,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`\n✅ Extracted ${combinedSeoList.length} SEO metadata records successfully!`);
  console.log(` Output saved to: ${outputPath}`);
}

extractSeoFromSql().catch(console.error);
