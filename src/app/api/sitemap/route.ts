import { NextRequest, NextResponse } from 'next/server';
import { getAllRoutes } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  let chunkId = 1;

  // 1. Try to get from searchParams (if rewrite passed it)
  const idStr = request.nextUrl.searchParams.get('id');
  if (idStr) {
    chunkId = parseInt(idStr, 10);
  } else {
    // 2. Extract directly from the URL path (e.g., /sitemap2.xml -> 2)
    const match = request.nextUrl.pathname.match(/sitemap(\d+)\.xml/);
    if (match && match[1]) {
      chunkId = parseInt(match[1], 10);
    }
  }
  
  const chunkIndex = Math.max(0, chunkId - 1);
  
  const routes = await getAllRoutes();
  
  const start = chunkIndex * 5000;
  const end = start + 5000;
  const chunk = routes.slice(start, end);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  for (const route of chunk) {
    xml += `\n  <url>\n    <loc>${route.url}</loc>`;
    if (route.lastModified) {
      const dateStr = route.lastModified instanceof Date 
        ? route.lastModified.toISOString() 
        : new Date(route.lastModified).toISOString();
      xml += `\n    <lastmod>${dateStr}</lastmod>`;
    }
    if (route.changeFrequency) {
      xml += `\n    <changefreq>${route.changeFrequency}</changefreq>`;
    }
    if (route.priority) {
      xml += `\n    <priority>${route.priority}</priority>`;
    }
    xml += `\n  </url>`;
  }
  
  xml += `\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
