/**
 * XML and HTML parsing utilities for RSS feeds.
 * @module lib/xmlParser
 */

/**
 * Extracts content of an XML tag using regex.
 */
export function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = regex.exec(xml);
  return m ? (m[1] || m[2] || '').trim() : null;
}

/**
 * Extracts the domain from a URL string.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Strips HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Decodes common HTML entities.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}