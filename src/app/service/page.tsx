import React from 'react';
import ServicePageClient from './ServicePageClient';
import { getPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getPageMetadata(
    '/service',
    'Explore Medical Services & Treatments - Clinic By Choice',
    'Browse all accredited medical specialties, procedures, and treatments. Find top specialist hospitals and packages across India.'
  );
}

export default async function ServicesPage() {
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/service');

  return (
    <>
      <ServicePageClient />
      {schemaMarkup && (
        schemaMarkup.includes('<script') ? (
          <span dangerouslySetInnerHTML={{ __html: schemaMarkup }} />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          />
        )
      )}
    </>
  );
}
