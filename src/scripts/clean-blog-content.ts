import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function cleanAllBlogContentInDB() {
  console.log('Connecting to database to clean blog post HTML content & corrupted link redirections...');

  const { connectDB } = await import('@/lib/db');
  const { BlogPost } = await import('@/models');
  const { cleanBlogHtml } = await import('@/lib/blog-utils');

  await connectDB();

  const allBlogs = await BlogPost.findAll();
  console.log(`Found ${allBlogs.length} blog posts. Checking for content cleaning...`);

  let updatedCount = 0;

  for (const blog of allBlogs) {
    if (!blog.content) continue;

    const cleanedContent = cleanBlogHtml(blog.content);

    if (cleanedContent !== blog.content) {
      await blog.update({
        content: cleanedContent,
      });
      updatedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Successfully cleaned ${updatedCount} / ${allBlogs.length} blog posts in database.`);
  console.log(`========================================\n`);
}

cleanAllBlogContentInDB()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error cleaning blog content:', err);
    process.exit(1);
  });
