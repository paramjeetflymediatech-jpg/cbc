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

    let cleanPath = `/${post.slug}`;
    if (post.type === 'post') {
      cleanPath = `/blog/${post.slug}`;
    } else if (post.type === 'hospital') {
      cleanPath = `/hospital/${post.slug}`;
    } else if (post.type === 'service') {
      cleanPath = `/hospitals/${post.slug}/india`;
    }

    if (post.slug === 'home' || post.slug === 'front-page') {
      cleanPath = '/';
    }

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
        '@type': post.type === 'post' ? 'BlogPosting' : 'MedicalWebPage',
        name: post.title,
        url: `https://clinicbychoice.com${cleanPath}`,
        description: finalDesc,
      }, null, 2),
    };

    combinedSeoList.push(seoRecord);

    if (post.type === 'service' || post.type === 'page' || post.slug.includes('orthopedics') || post.slug.includes('cardiology') || post.slug.includes('ivf')) {
      servicesSeoList.push({
        slug: post.slug,
        name: post.title,
        seoTitle: finalTitle,
        seoDescription: finalDesc,
      });
    }
  }

  const outputPath = path.resolve(process.cwd(), 'src/data/extracted_seo_data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const resultData = {
    source: 'clinicbychoice_wp_rwcjs.sql',
    generatedAt: new Date().toISOString(),
    totalPublicPages: combinedSeoList.length,
    seoMetadata: combinedSeoList,
    servicesSeo: servicesSeoList,
  };

  fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2), 'utf8');
  console.log(`✅ Successfully extracted ${combinedSeoList.length} SEO records to: ${outputPath}`);
  return resultData;
}

extractSeoFromSql().catch(console.error);
