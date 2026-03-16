export const LIVE_SYNC_TARGETS = [
  { id: 'home', title: 'Home', slug: 'home' },
  { id: 'about', title: 'About', slug: 'about' },
  { id: 'contact', title: 'Contact', slug: 'contact' },
  { id: 'courses', title: 'Courses', slug: 'courses' },
  { id: 'placement', title: 'Placement', slug: 'placement' },
  { id: 'hire-from-us', title: 'Hire From Us', slug: 'hire-from-us' },
  { id: 'tools', title: 'Tools', slug: 'tools' },
  { id: 'ai-digital-marketing-course', title: 'AI Digital Marketing Course', slug: 'ai-digital-marketing-course' },
  {
    id: 'digital-marketing-course-in-bangalore',
    title: 'Digital Marketing Course In Bangalore',
    slug: 'digital-marketing-course-in-bangalore',
  },
  {
    id: 'digital-marketing-course-in-jayanagar',
    title: 'Digital Marketing Course In Jayanagar',
    slug: 'digital-marketing-course-in-jayanagar',
  },
  {
    id: 'digital-marketing-internship-in-bangalore',
    title: 'Digital Marketing Internship In Bangalore',
    slug: 'digital-marketing-internship-in-bangalore',
  },
  {
    id: 'google-ads-course-in-bangalore',
    title: 'Google Ads Course In Bangalore',
    slug: 'google-ads-course-in-bangalore',
  },
  { id: 'seo-course-in-bangalore', title: 'SEO Course In Bangalore', slug: 'seo-course-in-bangalore' },
  {
    id: 'social-media-marketing-course-in-bangalore',
    title: 'Social Media Marketing Course In Bangalore',
    slug: 'social-media-marketing-course-in-bangalore',
  },
]

export function findLiveSyncTargetBySlug(slug = '') {
  return LIVE_SYNC_TARGETS.find((target) => target.slug === slug) || null
}
