import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function cleanAllDatabaseEntities() {
  console.log('Connecting to database to clean SEO HTML entities (&amp;, &quot;, &#039;, etc.)...');
  
  const { connectDB } = await import('@/lib/db');
  const { SeoMetadata, BlogPost, Service, ServiceLocation } = await import('@/models');
  const { cleanSeoText } = await import('@/lib/seo');

  await connectDB();

  // 1. Clean seo_metadata
  const allSeo = await SeoMetadata.findAll();
  let seoCleaned = 0;
  for (const item of allSeo) {
    const newTitle = cleanSeoText(item.title);
    const newDesc = cleanSeoText(item.description);
    const newPageName = cleanSeoText(item.pageName);
    const newKeywords = cleanSeoText(item.keywords);
    const newOgTitle = cleanSeoText(item.ogTitle);
    const newOgDesc = cleanSeoText(item.ogDescription);

    if (
      newTitle !== item.title ||
      newDesc !== item.description ||
      newPageName !== item.pageName ||
      newKeywords !== item.keywords ||
      newOgTitle !== item.ogTitle ||
      newOgDesc !== item.ogDescription
    ) {
      await item.update({
        title: newTitle,
        description: newDesc,
        pageName: newPageName,
        keywords: newKeywords,
        ogTitle: newOgTitle,
        ogDescription: newOgDesc,
      });
      seoCleaned++;
    }
  }
  console.log(`✅ Cleaned ${seoCleaned} records in seo_metadata table.`);

  // 2. Clean blog_posts
  const allBlogs = await BlogPost.findAll();
  let blogsCleaned = 0;
  for (const blog of allBlogs) {
    const newTitle = cleanSeoText(blog.title);
    const newExcerpt = cleanSeoText(blog.excerpt);
    const newSeoTitle = cleanSeoText(blog.seoTitle);
    const newSeoDesc = cleanSeoText(blog.seoDescription);
    const newKeywords = cleanSeoText(blog.seoKeywords);
    const newOgTitle = cleanSeoText(blog.ogTitle);
    const newOgDesc = cleanSeoText(blog.ogDescription);
    const newCategory = cleanSeoText(blog.category);

    if (
      newTitle !== blog.title ||
      newExcerpt !== blog.excerpt ||
      newSeoTitle !== blog.seoTitle ||
      newSeoDesc !== blog.seoDescription ||
      newKeywords !== blog.seoKeywords ||
      newOgTitle !== blog.ogTitle ||
      newOgDesc !== blog.ogDescription ||
      newCategory !== blog.category
    ) {
      await blog.update({
        title: newTitle,
        excerpt: newExcerpt,
        seoTitle: newSeoTitle,
        seoDescription: newSeoDesc,
        seoKeywords: newKeywords,
        ogTitle: newOgTitle,
        ogDescription: newOgDesc,
        category: newCategory,
      });
      blogsCleaned++;
    }
  }
  console.log(`✅ Cleaned ${blogsCleaned} records in blog_posts table.`);

  // 3. Clean services
  const allServices = await Service.findAll();
  let servicesCleaned = 0;
  for (const s of allServices) {
    const newName = cleanSeoText(s.name);
    const newSeoTitle = cleanSeoText(s.seoTitle);
    const newSeoDesc = cleanSeoText(s.seoDescription);

    if (newName !== s.name || newSeoTitle !== s.seoTitle || newSeoDesc !== s.seoDescription) {
      await s.update({
        name: newName,
        seoTitle: newSeoTitle,
        seoDescription: newSeoDesc,
      });
      servicesCleaned++;
    }
  }
  console.log(`✅ Cleaned ${servicesCleaned} records in services table.`);

  // 4. Clean service_locations
  const allLocations = await ServiceLocation.findAll();
  let locationsCleaned = 0;
  for (const loc of allLocations) {
    const newTitle = cleanSeoText(loc.serviceTitle);
    const newShort = cleanSeoText(loc.shortDescription);
    const newSeoTitle = cleanSeoText(loc.seoTitle);
    const newSeoDesc = cleanSeoText(loc.seoDescription);

    if (
      newTitle !== loc.serviceTitle ||
      newShort !== loc.shortDescription ||
      newSeoTitle !== loc.seoTitle ||
      newSeoDesc !== loc.seoDescription
    ) {
      await loc.update({
        serviceTitle: newTitle,
        shortDescription: newShort,
        seoTitle: newSeoTitle,
        seoDescription: newSeoDesc,
      });
      locationsCleaned++;
    }
  }
  console.log(`✅ Cleaned ${locationsCleaned} records in service_locations table.`);

  console.log('\n🎉 ALL SEO DATA AND HTML ENTITIES CLEANED SUCCESSFULLY!\n');
}

cleanAllDatabaseEntities()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error cleaning SEO database entities:', err);
    process.exit(1);
  });
