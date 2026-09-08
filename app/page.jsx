export const revalidate = 0
export const dynamic = 'force-dynamic'

import HomePage from '../src/legacy/pages/HomePage'
import { fetchAllHomepageData } from '../lib/homepageCmsData'
import { fetchSiteCmsData } from '../lib/siteCmsServer'
import { fetchPublishedPublicBlogs } from '../lib/publicBlogData'
import { PublicLayout } from '../src/components/Layout/PublicLayout'
import { buildMetadata } from './lib/seo'

export async function generateMetadata() {
  return {
    ...buildMetadata({
      title: 'Acadvizen: Digital Marketing Course in Bangalore with AI Training',
      description: 'Join Acadvizen\'s Digital Marketing Course in Bangalore with AI Training. Learn SEO, Google Ads, Meta Ads, AI Automation, Website Development, Content Marketing, Analytics, and more through live projects, internships, and placement assistance.',
      path: '/',
    }),
    keywords: 'digital marketing course in bangalore, digital marketing training with AI, AI marketing course bangalore, SEO course bangalore, Google Ads training, Meta Ads course, digital marketing with placement, Acadvizen, AI Digital Marketing, Digital Marketing, Learn AI Digital Marketing, AI integrated Digital Marketing',
  }
}

export default async function Page() {
  // Fetch homepage content, shared header/footer/site data, and the latest blog posts in
  // parallel - all three are independent reads, so there is no reason to wait on one before
  // starting the others. Blog posts are fetched here (server-side, same fetchPublishedPublicBlogs
  // helper /blog uses) rather than left to the client-only `loadBlogPosts` effect in HomePage,
  // which only ran after an idle callback/timeout - so the "From the Blog" section rendered
  // "No blog posts yet" on first paint (and for any crawler that doesn't execute JS) even though
  // published posts exist.
  const [cmsData, siteCmsData, blogPosts] = await Promise.all([
    fetchAllHomepageData(),
    fetchSiteCmsData(),
    fetchPublishedPublicBlogs({
      select: 'id,slug,title,description,excerpt,featured_image,published_at,created_at,status,deleted_at',
      limit: 6,
    }).catch(() => []),
  ])

  return (
    <PublicLayout initialSiteCmsData={siteCmsData}>
      <HomePage cmsData={cmsData} initialBlogPosts={blogPosts} />
    </PublicLayout>
  )
}
