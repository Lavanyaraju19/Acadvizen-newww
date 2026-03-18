import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Acadvizen',
    short_name: 'Acadvizen',
    description: 'Acadvizen digital marketing institute website',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1d36',
    theme_color: '#0d1d36',
    icons: [
      {
        src: '/site-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/site-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/site-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
