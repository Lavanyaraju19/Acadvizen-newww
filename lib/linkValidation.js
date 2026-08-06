// Shared link validators for admin editors (footer, header, menus) that let an admin type a
// raw URL for a nav/CTA link. Each editor used to have its own copy-pasted `isValidUrl`, and
// they disagreed on what "valid" meant:
//  - the footer's rejected every relative internal path ("/about") because `new URL()` throws
//    without a host, which flagged the site's own normal internal links as invalid
//  - the header's silently prefixed "https://" before validating, so almost anything
//    ("asdf", "not a url") parsed as valid instead of catching a real typo
// Neither actually confirmed the target route exists - that's a separate, larger problem
// (would need a live lookup against pages/locations/city_pages/etc.) that these validators
// don't attempt to solve. They only catch structurally malformed input.

export function isValidNavUrl(url) {
  const value = String(url || '').trim()
  if (!value) return true
  if (value.startsWith('/') || value.startsWith('#')) return true
  if (/^(mailto:|tel:)/i.test(value)) return true
  try {
    const parsed = new URL(value)
    return Boolean(parsed.protocol && parsed.host)
  } catch {
    return false
  }
}

export function isValidAbsoluteUrl(url) {
  const value = String(url || '').trim()
  if (!value) return true
  if (/^(mailto:|tel:)/i.test(value)) return true
  try {
    const parsed = new URL(value)
    return Boolean(parsed.protocol && parsed.host)
  } catch {
    return false
  }
}
