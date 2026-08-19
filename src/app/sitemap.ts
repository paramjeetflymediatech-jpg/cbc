import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Service, Hospital, BlogPost, SeoMetadata } from '@/models';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clinicbychoice.com').replace(/\/$/, '');

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/get-listed`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    await connectDB();

    // 1. Dynamic Treatment / Service Pages (/hospitals/${service.slug}/india)
    const services = await Service.findAll({
      attributes: ['slug', 'updatedAt'],
      raw: true,
    });
    for (const service of services as any[]) {
      if (service.slug) {
        routes.push({
          url: `${baseUrl}/hospitals/${service.slug}/india`,
          lastModified: service.updatedAt ? new Date(service.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    }

    // 2. Dynamic Hospital Profiles (/hospital/${hospital.slug})
    const hospitals = await Hospital.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['slug', 'updatedAt'],
      raw: true,
    });
    for (const hospital of hospitals as any[]) {
      if (hospital.slug) {
        routes.push({
          url: `${baseUrl}/hospital/${hospital.slug}`,
          lastModified: hospital.updatedAt ? new Date(hospital.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // 3. Dynamic Blog Articles (/blog/${blog.slug})
    const blogs = await BlogPost.findAll({
      where: { status: 'PUBLISHED' },
      attributes: ['slug', 'updatedAt', 'publishedAt'],
      raw: true,
    });
    for (const blog of blogs as any[]) {
      if (blog.slug) {
        routes.push({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.updatedAt ? new Date(blog.updatedAt) : (blog.publishedAt ? new Date(blog.publishedAt) : new Date()),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // 4. Custom SEO URLs from seo_metadata
    const seoEntries = await SeoMetadata.findAll({
      attributes: ['path', 'updatedAt', 'robotsIndex'],
      raw: true,
    });
    const existingUrls = new Set(routes.map((r) => r.url));
    for (const entry of seoEntries as any[]) {
      if (
        entry.path &&
        !entry.path.startsWith('/admin') &&
        !entry.path.startsWith('/api') &&
        !entry.path.startsWith('/login') &&
        !(entry.robotsIndex && entry.robotsIndex.includes('noindex'))
      ) {
        const cleanPath = entry.path.startsWith('/') ? entry.path : `/${entry.path}`;
        const fullUrl = `${baseUrl}${cleanPath}`;
        if (!existingUrls.has(fullUrl)) {
          existingUrls.add(fullUrl);
          routes.push({
            url: fullUrl,
            lastModified: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.75,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
  }

  return routes;
}
