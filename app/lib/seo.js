const SITE_URL = 'https://acadvizen.com'
const SITE_NAME = 'Acadvizen'
const DEFAULT_IMAGE = '/logo.png'

export function buildMetadata({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
}) {
  const url = new URL(path, SITE_URL).toString()
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

export const siteConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
}
