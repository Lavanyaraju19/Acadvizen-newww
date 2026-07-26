import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

const CMS_PUBLIC_PATHS = [
  '/',
  '/about',
  '/achievements',
  '/contact',
  '/courses',
  '/placement',
  '/testimonials',
  '/projects',
  '/soft-skills',
  '/hire-from-us',
  '/tools',
  '/blog',
]

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const paths = body?.paths || CMS_PUBLIC_PATHS
    const slug = body?.slug
    const secret = request.headers.get('x-revalidate-secret')

    // Optional: validate secret if configured
    const expectedSecret = process.env.REVALIDATION_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ revalidated: false, error: 'Invalid secret' }, { status: 401 })
    }

    // Revalidate specific slug if provided
    if (slug) {
      const slugPath = slug.startsWith('/') ? slug : `/${slug}`
      revalidatePath(slugPath)
      
      // Also revalidate location pages patterns
      if (slug.startsWith('digital-marketing-course-')) {
        const citySlug = slug.replace('digital-marketing-course-', '')
        revalidatePath(`/digital-marketing-course-${citySlug}`)
        revalidatePath(`/digital-marketing-course-in-${citySlug}`)
        revalidatePath(`/digital-marketing-courses-${citySlug}`)
      }
    }

    // Revalidate all known CMS paths
    const validPaths = Array.isArray(paths) ? paths : CMS_PUBLIC_PATHS
    for (const path of validPaths) {
      try {
        revalidatePath(path)
      } catch {
        // Ignore per-path failures
      }
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      paths: slug ? [slug, ...validPaths] : validPaths,
    })
  } catch (error) {
    return NextResponse.json(
      { revalidated: false, error: error?.message || 'Revalidation failed' },
      { status: 500 }
    )
  }
}
