/**
 * Validate external/CMS-supplied URLs so only http: and https: schemes can be navigated or opened.
 * Blocks javascript:, data:, vbscript:, and malformed schemes.
 */
export function sanitizeSafeExternalUrl(rawUrl, fallback = '') {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }
    return parsed.href.replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

