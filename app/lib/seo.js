const SITE_URL = 'https://acadvizen.com'
const SITE_NAME = 'Acadvizen'
const DEFAULT_IMAGE = '/logo.png'

export function buildMetadata({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
}) {
  const url = canonical || new URL(path, SITE_URL).toString()
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  const metadata = {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      title: ogTitle || fullTitle,
      description: ogDescription || description,
      siteName: SITE_NAME,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle || fullTitle,
      description: twitterDescription || description,
      images: [image],
    },
  }
  if (noindex) {
    metadata.robots = {
      index: false,
      follow: true,
    }
  }
  return metadata
}

export const siteConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
}
