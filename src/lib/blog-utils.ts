/**
 * Utility functions for blog HTML sanitization, link resolution, and formatting.
 */

export function cleanBlogHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';

  let html = String(rawHtml);

  // 1. Remove WordPress Gutenberg block comments e.g. <!-- wp:paragraph -->, <!-- /wp:heading -->
  html = html.replace(/<!--\s*\/?wp:[^>]*-->/gi, '');

  // 2. Remove backslash escapes before quotes (e.g. \" -> ", \' -> ')
  html = html.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');

  // 3. Process and sanitize all anchor (<a>) tags
  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, text) => {
    // Extract href value
    let href = '';
    const hrefMatch = attrs.match(/href\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i);
    if (hrefMatch) {
      href = hrefMatch[1] ?? hrefMatch[2] ?? '';
    }

    // Clean href
    let cleanHref = href
      .replace(/&quot;/gi, '')
      .replace(/&apos;|&#039;|&#39;/gi, '')
      .replace(/%22/gi, '')
      .replace(/^[\s\\"'\u201C\u201D\\]+|[\s\\"'\u201C\u201D\\]+$/g, '')
      .trim();

    // Fix malformed protocol (e.g. https:/domain.com -> https://domain.com)
    cleanHref = cleanHref.replace(/^(https?:)\/([^\/])/i, '$1//$2');

    // Convert internal clinicbychoice.com URLs into clean relative paths
    cleanHref = cleanHref.replace(/^https?:\/\/(?:www\.)?clinicbychoice\.com(\/.*)?$/i, (_m: string, pathSegment: string) => {
      return pathSegment || '/';
    });

    // If protocol-less www link, add https://
    if (/^www\./i.test(cleanHref)) {
      cleanHref = 'https://' + cleanHref;
    }

    if (!cleanHref) {
      cleanHref = '#';
    }

    const isExternal = /^https?:\/\//i.test(cleanHref);

    // Filter other attributes, stripping corrupted quotes
    let cleanAttrs = attrs
      .replace(/href\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/target\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/rel\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/title\s*=\s*["']\s*["']/gi, '') // remove empty title=""
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanAttrs) {
      // Clean up stray double quotes in attributes
      cleanAttrs = cleanAttrs.replace(/=""/g, '=""');
    }

    if (isExternal) {
      return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text}</a>`;
    } else {
      return `<a href="${cleanHref}"${cleanAttrs ? ' ' + cleanAttrs : ''}>${text}</a>`;
    }
  });

  // 4. Clean image (<img>) tags
  html = html.replace(/<img\b([^>]*)>/gi, (_match, attrs) => {
    let cleanAttrs = attrs
      .replace(/src\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i, (_m: string, s1: string, s2: string) => {
        let src = (s1 || s2 || '')
          .replace(/&quot;/gi, '')
          .replace(/%22/gi, '')
          .replace(/^[\s\\"'\\]+|[\s\\"'\\]+$/g, '')
          .trim();
        return `src="${src}"`;
      })
      .replace(/\s+/g, ' ')
      .trim();

    return `<img ${cleanAttrs} />`;
  });

  // 5. Clean other HTML tags to ensure no stray backslashes or corrupted quotes in classes/attributes
  html = html.replace(/<([a-z0-9]+)\b([^>]*)>/gi, (match, tag, attrs) => {
    if (tag.toLowerCase() === 'a' || tag.toLowerCase() === 'img') return match;
    let cleanAttrs = attrs
      .replace(/class="\\*([^"\\]*)\\*"/gi, 'class="$1"')
      .replace(/\s+/g, ' ')
      .trim();
    return `<${tag}${cleanAttrs ? ' ' + cleanAttrs : ''}>`;
  });

  // 6. Clean empty paragraphs
  html = html.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '');

  return html.trim();
}
