export const revalidate = 1;

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://acadvizen.com/sitemap.xml',
  }
}
