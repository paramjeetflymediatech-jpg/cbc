import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables before importing DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function importBlogs() {
  const jsonPath = path.resolve(process.cwd(), 'src/data/extracted_blog_posts.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON file not found at: ${jsonPath}. Run 'npm run extract:blogs' first.`);
    process.exit(1);
  }

  console.log('Connecting to database...');
  console.log(`• Host: ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`• DB: ${process.env.MYSQL_DATABASE || 'clinicbychoice'}`);

  const { connectDB } = await import('@/lib/db');
  const { BlogPost } = await import('@/models');
  const { cleanBlogHtml } = await import('@/lib/blog-utils');

  await connectDB();

  const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const blogs = fileData.blogPosts || [];

  console.log(`Found ${blogs.length} blog posts to insert/update into database...`);

  let inserted = 0;
  let updated = 0;

  for (const post of blogs) {
    try {
      const existing = await BlogPost.findOne({ where: { slug: post.slug } });
      if (existing) {
        await existing.update({
          title: post.title,
          excerpt: post.excerpt,
          content: cleanBlogHtml(post.content),
          image: post.image,
          category: post.category,
          author: post.author,
          readTime: post.readTime,
          tags: post.tags,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          seoKeywords: post.seoKeywords,
          canonicalUrl: post.canonicalUrl,
          ogImage: post.ogImage,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          robotsIndex: post.robotsIndex,
          schemaMarkup: post.schemaMarkup,
          status: 'PUBLISHED',
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
        });
        updated++;
      } else {
        await BlogPost.create({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: cleanBlogHtml(post.content),
          image: post.image,
          category: post.category,
          author: post.author,
          readTime: post.readTime,
          tags: post.tags,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          seoKeywords: post.seoKeywords,
          canonicalUrl: post.canonicalUrl,
          ogImage: post.ogImage,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          robotsIndex: post.robotsIndex,
          schemaMarkup: post.schemaMarkup,
          status: 'PUBLISHED',
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          views: post.views || 0,
        });
        inserted++;
      }
    } catch (err) {
      console.warn(`Warning importing blog "${post.slug}":`, (err as Error)?.message || err);
    }
  }

  console.log('\n========================================');
  console.log('✅ BLOG POSTS IMPORT SUMMARY:');
  console.log(`- New Blog Posts Inserted: ${inserted}`);
  console.log(`- Existing Blog Posts Updated: ${updated}`);
  console.log(`- Total Processed: ${inserted + updated}`);
  console.log('========================================\n');
}

importBlogs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during blog import:', err);
    process.exit(1);
  });
