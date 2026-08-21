import { NextResponse } from 'next/server';
import { getAllRoutes } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const routes = await getAllRoutes();
  const chunkCount = Math.ceil(routes.length / 5000) || 1;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clinicbychoice.com').replace(/\/$/, '');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (let i = 1; i <= chunkCount; i++) {
    xml += `\n  <sitemap>\n    <loc>${baseUrl}/sitemap${i}.xml</loc>\n  </sitemap>`;
  }
  xml += `\n</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
