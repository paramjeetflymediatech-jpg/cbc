import fs from 'fs';
import readline from 'readline';
import path from 'path';

interface WPAttachment {
  id: number;
  guid: string;
}

interface WPPostRaw {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  status: string;
  type: string;
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
}

export async function extractBlogs() {
  const sqlPath = path.resolve('/Users/flymedia/Downloads/clinicbychoice_wp_rwcjs.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found at: ${sqlPath}`);
    return;
  }

  console.log('Extracting blogs and media from WordPress SQL dump...');
  const fileStream = fs.createReadStream(sqlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const blogsMap = new Map<number, WPPostRaw>();
  const attachmentsMap = new Map<number, string>(); // attachmentId -> guid
  const postThumbnailMap = new Map<number, number>(); // postId -> thumbnailId
  const aioseoMap = new Map<number, WPAIOSEO>();

  let inPosts = false;
  let inPostMeta = false;
  let inAioseo = false;

  for await (const line of rl) {
    // 1. Posts table
    if (line.includes('INSERT INTO `4rrBFRW_posts`')) {
      inPosts = true;
    }
    if (inPosts) {
      // Row pattern: (ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, ...)
      // Extract attachments
      const attachMatches = line.matchAll(/\((\d+),\s*\d+,\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'inherit',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*'attachment'/g);
      for (const m of attachMatches) {
        attachmentsMap.set(parseInt(m[1], 10), m[2].replace(/\\'/g, "'"));
      }

      // Extract published posts
      const postMatches = line.matchAll(/\((\d+),\s*\d+,\s*'(\d{4}-\d{2}-\d{2}[^']*)',\s*'[^']*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'publish',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'((?:[^'\\]|\\.)*)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(?:[^'\\]|\\.)*',\s*\d+,\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*'post'/g);
      for (const m of postMatches) {
        const id = parseInt(m[1], 10);
        blogsMap.set(id, {
          id,
          date: m[2],
          content: m[3].replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
          title: m[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
          excerpt: m[5].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
          slug: m[6].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
          status: 'publish',
          type: 'post',
        });
      }

      if (line.endsWith(';')) inPosts = false;
    }

    // 2. PostMeta table (for _thumbnail_id)
    if (line.includes('INSERT INTO `4rrBFRW_postmeta`')) {
      inPostMeta = true;
    }
    if (inPostMeta) {
      const metaMatches = line.matchAll(/\(\d+,\s*(\d+),\s*'_thumbnail_id',\s*'(\d+)'\)/g);
      for (const m of metaMatches) {
        postThumbnailMap.set(parseInt(m[1], 10), parseInt(m[2], 10));
      }
      if (line.endsWith(';')) inPostMeta = false;
    }

    // 3. AIOSEO table
    if (line.includes('INSERT INTO `4rrBFRW_aioseo_posts`')) {
      inAioseo = true;
    }
    if (inAioseo) {
      const rowMatches = line.matchAll(/\(\d+,\s*(\d+),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL),\s*(?:'((?:[^'\\]|\\.)*)'|NULL)/g);

      for (const match of rowMatches) {
        const postId = parseInt(match[1], 10);
        aioseoMap.set(postId, {
          postId,
          title: match[2] ? match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
          description: match[3] ? match[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
          keywords: match[4] ? match[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
          canonicalUrl: match[7] ? match[7].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
          ogTitle: match[8] ? match[8].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
          ogDescription: match[9] ? match[9].replace(/\\'/g, "'").replace(/\\\\/g, '\\') : undefined,
        });
      }
      if (line.endsWith(';')) inAioseo = false;
    }
  }

  console.log(`Found ${blogsMap.size} published blog posts, ${attachmentsMap.size} attachments, ${aioseoMap.size} AIOSEO records.`);

  // Also read downloaded JSON metadata to enrich categories if available
  const jsonMetaPath = '/Users/flymedia/Downloads/clinicbychoice_blogs_hospitals_seo_full.json';
  const categoryMap = new Map<number, string>();
  if (fs.existsSync(jsonMetaPath)) {
    try {
      const jsonData = JSON.parse(fs.readFileSync(jsonMetaPath, 'utf8'));
      if (Array.isArray(jsonData.blogPosts)) {
        for (const bp of jsonData.blogPosts) {
          if (bp.wordpressId && bp.categories && bp.categories.length > 0) {
            categoryMap.set(bp.wordpressId, bp.categories.map((c: any) => c.name).join(', '));
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const finalBlogs = [];

  for (const [id, post] of blogsMap.entries()) {
    const seo: WPAIOSEO = aioseoMap.get(id) || {};
    const thumbId = postThumbnailMap.get(id);
    let imageUrl = thumbId ? attachmentsMap.get(thumbId) : null;
    if (!imageUrl) {
      // Find first <img> in content
      const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const cleanTitle = (seo.title || post.title || '')
      .replace(/#site_title/g, 'Clinic By Choice')
      .replace(/#tagline/g, 'Medical Tourism & Healthcare in India')
      .replace(/#post_title/g, post.title)
      .replace(/#separator_sa/g, '-')
      .replace(/#sep/g, '|')
      .trim();

    const cleanDesc = (seo.description || post.excerpt || '')
      .replace(/#site_title/g, 'Clinic By Choice')
      .replace(/#tagline/g, 'Medical Tourism & Healthcare in India')
      .replace(/#post_title/g, post.title)
      .replace(/#separator_sa/g, '-')
      .replace(/#sep/g, '|')
      .trim();

    const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    finalBlogs.push({
      wordpressId: id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || cleanDesc.slice(0, 200),
      content: post.content,
      image: imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
      category: categoryMap.get(id) || 'Medical Guide',
      author: 'Clinic By Choice Medical Editorial Board',
      readTime: `${readTimeMinutes} min read`,
      tags: categoryMap.get(id) || 'Healthcare, Treatments, India',
      seoTitle: cleanTitle || `${post.title} | Clinic By Choice`,
      seoDescription: cleanDesc || post.title,
      seoKeywords: seo.keywords || `${post.title.toLowerCase()}, clinic by choice`,
      canonicalUrl: seo.canonicalUrl || `https://clinicbychoice.com/blog/${post.slug}`,
      ogImage: imageUrl || 'https://clinicbychoice.com/images/og/default.jpg',
      ogTitle: seo.ogTitle || cleanTitle || post.title,
      ogDescription: seo.ogDescription || cleanDesc || post.title,
      robotsIndex: 'index, follow',
      schemaMarkup: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: cleanDesc || post.title,
        image: imageUrl || 'https://clinicbychoice.com/images/og/default.jpg',
        datePublished: post.date,
        author: {
          '@type': 'Organization',
          name: 'Clinic By Choice',
        },
      }, null, 2),
      status: 'PUBLISHED',
      publishedAt: post.date ? new Date(post.date) : new Date(),
      views: Math.floor(120 + Math.random() * 850),
    });
  }

  const outputPath = path.resolve(process.cwd(), 'src/data/extracted_blog_posts.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ total: finalBlogs.length, blogPosts: finalBlogs }, null, 2), 'utf8');

  console.log(`✅ Successfully extracted ${finalBlogs.length} full blog posts to: ${outputPath}`);
  return finalBlogs;
}

extractBlogs().catch(console.error);
