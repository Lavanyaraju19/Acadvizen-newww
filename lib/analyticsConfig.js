// Shared by the root layout and by WordPress-rendered (Render Bridge) pages, which bypass the layout.
export const GA_ID = 'G-XHHL082QEE'
export const GTM_ID = 'GTM-T6Q5DK5C'

export function isAnalyticsEnabled(siteUrl) {
  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' || siteUrl === 'https://acadvizen.com'
}

/**
 * The Meta (Facebook) pixel runs on every public page of the live site, including pages rendered
 * by WordPress. Vercel preview deployments (the staging Main Website) must not send production
 * advertising events, so it is off there. Server-side only (reads VERCEL_ENV).
 */
export function isMetaPixelEnabled(env = process.env) {
  return env.VERCEL_ENV !== 'preview' && env.META_PIXEL_DISABLED !== 'true'
}
