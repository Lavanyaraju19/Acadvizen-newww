import { buildSourceChain, normalizeAssetPath } from './mediaAssets'

export function normalizeToolKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

const TOOL_LOGO_OVERRIDES = {
  activecampaign: '/tools/activecampaign.png',
  ahrefs: '/tools/ahrefs.png',
  analytics: '/tools/analytics.png',
  answerthepublic: '/logos/google.png',
  buffer: '/tools/buffer.png',
  canva: '/tools/canva.png',
  chatgpt: '/tools/chatgpt.png',
  clarity: '/tools/clarity.png',
  dalle: '/logo-mark.png',
  elevenlabs: '/tools/elevenlabs.png',
  figma: '/logo-mark.png',
  ga4: '/tools/analytics.png',
  googleads: '/tools/googleads.png',
  googleanalytics: '/tools/analytics.png',
  googlesearchconsole: '/logos/google.png',
  googletagmanager: '/tools/tagmanager.png',
  hootsuite: '/tools/hootsuite.png',
  hotjar: '/tools/hotjar.png',
  hubspot: '/tools/hubspot.png',
  illustrator: '/logos/adobe.png',
  jasper: '/tools/jasper.png',
  later: '/tools/later.png',
  mailchimp: '/tools/mailchimp.png',
  metaads: '/tools/metaads.png',
  metricool: '/tools/metricool.png',
  midjourney: '/tools/midjourney.png',
  photoshop: '/logos/adobe.png',
  screamingfrog: '/tools/screamingfrog.png',
  semrush: '/tools/semrush.png',
  synthesia: '/tools/synthesia.png',
  tagmanager: '/tools/tagmanager.png',
  webflow: '/tools/webflow.png',
  youtubeads: '/tools/youtubeads.png',
}

export function resolveToolLogoCandidates(tool = {}) {
  const keys = [tool.slug, tool.name].map(normalizeToolKey).filter(Boolean)
  const localSources = keys.map((key) => TOOL_LOGO_OVERRIDES[key] || `/tools/${key}.png`)
  const remoteFromWebsite = tool.website_url
    ? `https://logo.clearbit.com/${String(tool.website_url).replace(/^https?:\/\//i, '').split('/')[0]}`
    : null

  return buildSourceChain(
    localSources,
    normalizeAssetPath(tool.logo_url),
    remoteFromWebsite,
    '/logo-mark.png'
  )
}

export function resolveToolLogoSrc(tool = {}) {
  return resolveToolLogoCandidates(tool)[0] || normalizeAssetPath('/logo-mark.png')
}

