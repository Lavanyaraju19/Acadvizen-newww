// The sitemap's fixed routes (kept apart from lib/publicSitemap.js so tests can read them).
export const STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/about', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/achievements', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/placement', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/testimonials', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/projects', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/soft-skills', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/hire-from-us', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/privacy-policy', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/terms-of-service', priority: 0.8, changeFrequency: 'weekly' },
  // Not /digital-marketing-course-in-bangalore or -jayanagar: both permanently redirect to the
  // city pages (/digital-marketing-courses-bangalore, -jayanagar), which the sitemap lists.
  { path: '/seo-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/social-media-marketing-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/google-ads-course-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/ai-digital-marketing-course', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/digital-marketing-internship-in-bangalore', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/companies', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/internships', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.6, changeFrequency: 'weekly' },
]
