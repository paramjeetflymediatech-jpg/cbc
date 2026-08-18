import React from 'react';
import { connectDB } from './db';
import { Metadata } from 'next';

export function buildMetadataFromRecord(seo: any): Metadata {
  const metadata: Metadata = {
    title: seo.title,
    description: seo.description,
  };

  if (seo.keywords) {
    metadata.keywords = seo.keywords;
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
    og.title = seo.ogTitle.trim();
  }
  if (seo.ogDescription && seo.ogDescription.trim() !== '') {
    og.description = seo.ogDescription.trim();
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
