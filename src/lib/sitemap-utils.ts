import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService, ServiceLocation, BlogPost, initAssociations } from '@/models';

export async function getAllRoutes(): Promise<MetadataRoute.Sitemap> {
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
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/data-deletion`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    await connectDB();
    initAssociations();

    // 1. Dynamic Treatment / Service Pages (/hospitals/${service.slug}/india)
    const services = await Service.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'slug', 'updatedAt'],
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

    // 2. Only include City Service URLs (/hospitals/${service.slug}/${citySlug}) if active hospitals exist or custom content is configured
    const validServiceCityPairs = new Set<string>();

    const activeHospitalServices = await HospitalService.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Hospital,
          as: 'hospital',
          where: { status: 'APPROVED', accountStatus: 'ACTIVE' },
          attributes: ['city'],
        },
        {
          model: Service,
          as: 'service',
          where: { status: 'ACTIVE' },
          attributes: ['slug'],
        },
      ],
    });

    activeHospitalServices.forEach((hs: any) => {
      const sSlug = hs.service?.slug;
      const hCity = hs.hospital?.city;
      if (sSlug && hCity && hCity.trim()) {
        const cSlug = hCity.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (cSlug) {
          validServiceCityPairs.add(`${sSlug}/${cSlug}`);
        }
      }
    });

    // Also include any explicitly configured custom ServiceLocation pages
    const customServiceLocations = await ServiceLocation.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['serviceSlug', 'citySlug', 'updatedAt'],
      raw: true,
    });

    customServiceLocations.forEach((sl: any) => {
      if (sl.serviceSlug && sl.citySlug) {
        validServiceCityPairs.add(`${sl.serviceSlug}/${sl.citySlug}`);
      }
    });

    for (const pair of validServiceCityPairs) {
      routes.push({
        url: `${baseUrl}/hospitals/${pair}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // 3. Dynamic Hospital Profiles (/hospital/${hospital.slug})
    const hospitals = await Hospital.findAll({
      where: { status: 'APPROVED', accountStatus: 'ACTIVE' },
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
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
  }

  return routes;
}
