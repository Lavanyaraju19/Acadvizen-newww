/**
 * Which WordPress static files the Main Website serves for WordPress-rendered pages (pure).
 *
 * The plugin rewrites CSS, JS, fonts and SVG to /_acv/c/… (wp-content) and /_acv/i/… (wp-includes).
 * Images, video and documents are loaded by browsers directly from WordPress instead.
 */

const AREAS = { c: '/wp-content/', i: '/wp-includes/' }
const STATIC_FILE = /\.(?:css|js|mjs|map|json|woff2?|ttf|otf|eot|svg|png|jpe?g|gif|webp|avif|ico)$/i
// A comma appears in real plugin file names (WooCommerce's "Inter-VariableFont_slnt,wght.woff2").
const SAFE_SEGMENT = /^[A-Za-z0-9._@+~,-]+$/

/**
 * @param {string} area "c" (wp-content) or "i" (wp-includes)
 * @param {string[]} segments decoded path segments after the area
 * @returns {string|null} the WordPress path, or null when the request must be refused
 */
export function staticAssetPath(area, segments) {
  const prefix = AREAS[area]
  if (!prefix || !Array.isArray(segments) || segments.length === 0 || segments.length > 20) return null
  for (const segment of segments) {
    if (typeof segment !== 'string' || !SAFE_SEGMENT.test(segment) || segment === '.' || segment === '..') return null
  }
  const relative = segments.join('/')
  if (!STATIC_FILE.test(relative)) return null
  // Never serve PHP-adjacent or private areas even if they had a static-looking name.
  if (/^(?:uploads\/(?:wc-logs|woocommerce_uploads)|upgrade|cache|litespeed|debug\.log)/i.test(relative)) return null
  return `${prefix}${relative}`
}

/** CDN caching for successful static responses (files are versioned with ?ver=). */
export const STATIC_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
export const STATIC_MAX_BYTES = 4 * 1024 * 1024
