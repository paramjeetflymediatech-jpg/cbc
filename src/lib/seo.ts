import React from 'react';
import { connectDB } from './db';
import { Metadata } from 'next';

/**
 * Strips HTML entity codes (e.g. &amp;, &quot;, &#039;, &nbsp;, &ndash;, etc.)
 * and unescapes double/triple-encoded entities to produce clean, plain SEO text.
 */
export function cleanSeoText(text?: string | null): string {
  if (!text) return '';

  let cleaned = String(text);

  // Unescape HTML entities (recursive up to 3 passes for double-encoded entities like &amp;amp;)
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#039;|&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&mdash;|&#8212;/gi, '—')
      .replace(/&ndash;|&#8211;/gi, '–')
      .replace(/&hellip;|&#8230;/gi, '...')
      .replace(/&#8216;|&#8217;/gi, "'")
      .replace(/&#8220;|&#8221;/gi, '"')
      .replace(/&#038;/gi, '&');
  }

  // Strip unwanted HTML tags if present
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // Normalize excessive whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Cleans all SEO-related text fields on an object.
 */
export function cleanSeoRecord<T extends Record<string, any>>(record: T): T {
  if (!record || typeof record !== 'object') return record;
  const result: any = { ...record };

  const textFields = [
    'title',
    'seoTitle',
    'ogTitle',
    'pageName',
    'description',
    'seoDescription',
    'ogDescription',
    'excerpt',
    'keywords',
    'seoKeywords',
    'serviceTitle',
    'shortDescription',
  ];

  for (const field of textFields) {
    if (typeof result[field] === 'string') {
      result[field] = cleanSeoText(result[field]);
    }
  }

  return result;
}

export function buildMetadataFromRecord(seo: any): Metadata {
  const cleanTitle = cleanSeoText(seo.title);
  const cleanDescription = cleanSeoText(seo.description);

  const metadata: Metadata = {
    title: cleanTitle,
    description: cleanDescription,
  };

  if (seo.keywords) {
    metadata.keywords = cleanSeoText(seo.keywords);
  }

  if (seo.canonicalUrl && seo.canonicalUrl.trim() !== '') {
    metadata.alternates = {
      canonical: seo.canonicalUrl.trim(),
    };
  }

  if (seo.robotsIndex && seo.robotsIndex.trim() !== '') {
    metadata.robots = seo.robotsIndex.trim();
  }

  // Set up Open Graph properties
  const og: any = {};
  if (seo.ogTitle && seo.ogTitle.trim() !== '') {
    og.title = cleanSeoText(seo.ogTitle);
  } else if (cleanTitle) {
    og.title = cleanTitle;
  }

  if (seo.ogDescription && seo.ogDescription.trim() !== '') {
    og.description = cleanSeoText(seo.ogDescription);
  } else if (cleanDescription) {
    og.description = cleanDescription;
  }

  if (seo.ogImage && seo.ogImage.trim() !== '') {
    og.images = [{ url: seo.ogImage.trim() }];
  }

  if (Object.keys(og).length > 0) {
    metadata.openGraph = og;
  }

  return metadata;
}

export async function getPageMetadata(path: string, defaultTitle: string, defaultDescription: string): Promise<Metadata> {
  try {
    const db = await connectDB();
    if (db) {
      const { SeoMetadata } = await import('@/models/SeoMetadata');
      const seo = await SeoMetadata.findOne({ where: { path: path.toLowerCase() } });
      if (seo) {
        return buildMetadataFromRecord(seo);
      }
    }
  } catch (err) {
    console.error('Error fetching SEO metadata for path:', path, err);
  }

  return {
    title: defaultTitle,
    description: defaultDescription,
  };
}

export async function getPageSchemaMarkup(path: string): Promise<string | null> {
  try {
    const db = await connectDB();
    if (db) {
      const { SeoMetadata } = await import('@/models/SeoMetadata');
      const seo = await SeoMetadata.findOne({ where: { path: path.toLowerCase() } });
      if (seo && seo.schemaMarkup) {
        return seo.schemaMarkup;
      }
    }
  } catch (err) {
    console.error('Error fetching Schema Markup for path:', path, err);
  }
  return null;
}

export function parseHtmlTags(html: string): React.ReactNode[] {
  if (!html) return [];
  
  const elements: React.ReactNode[] = [];
  let keyCount = 0;

  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const linkRegex = /<link\b([^>]*)\/?>/gi;
  const metaRegex = /<meta\b([^]*?)\/?>/gi;

  const parseAttrs = (attrsStr: string) => {
    const attrs: Record<string, any> = {};
    const attrRegex = /\b([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;
    while ((match = attrRegex.exec(attrsStr)) !== null) {
      const name = match[1];
      const value = match[2] ?? match[3] ?? match[4];
      if (value === undefined) {
        attrs[name] = true;
      } else {
        if (name === 'class') {
          attrs['className'] = value;
        } else {
          attrs[name] = value;
        }
      }
    }
    return attrs;
  };

  // Extract scripts
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    const content = match[2];
    elements.push(
      React.createElement('script', {
        key: `script-${keyCount++}`,
        ...attrs,
        dangerouslySetInnerHTML: content ? { __html: content } : undefined,
      })
    );
  }

  // Extract styles
  const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    const content = match[2];
    elements.push(
      React.createElement('style', {
        key: `style-${keyCount++}`,
        ...attrs,
        dangerouslySetInnerHTML: content ? { __html: content } : undefined,
      })
    );
  }

  // Extract links
  linkRegex.lastIndex = 0;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    elements.push(
      React.createElement('link', {
        key: `link-${keyCount++}`,
        ...attrs,
      })
    );
  }

  // Extract metas
  metaRegex.lastIndex = 0;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    elements.push(
      React.createElement('meta', {
        key: `meta-${keyCount++}`,
        ...attrs,
      })
    );
  }

  return elements;
}
