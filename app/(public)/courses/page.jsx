export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import CoursesLegacyClient from '../../legacy-fallback/CoursesLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('courses', '/courses', {
    title: 'Courses',
    description: 'Explore digital marketing courses, curriculum depth, and project-led outcomes.',
  })
}

// Mirrors /api/courses's query + normalization - CoursesPage previously only fetched this
// client-side (a `useEffect` after mount), so the course catalogue was absent from the initial
// server-rendered HTML and invisible to crawlers/anyone viewing source. Fetching it here and
// seeding CoursesPage's state via CoursesLegacyClient's initialCourses prop puts the same real
// course cards in the first response; CoursesPage's own client fetch still runs afterward as a
// live refresh, unchanged.
function normalizeCourse(row = {}) {
  return {
    ...row,
    title: row.title || row.course_name || '',
    short_description: row.short_description || row.overview || '',
    image_url: row.image_url || row.featured_image || '',
  }
}

async function fetchInitialCourses() {
  try {
    const supabase = getServerSupabaseClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (error || !Array.isArray(data)) return []
    return data
      .map(normalizeCourse)
      .filter((course) => course && course.id && course.slug && course.title)
  } catch {
    return []
  }
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    const initialCourses = await fetchInitialCourses()
    return <CoursesLegacyClient initialCourses={initialCourses} />
  }

  const cmsPage = await fetchCmsPageBySlug('courses')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy client to avoid blank page.
  if (cmsPage?.sections?.length) return <DynamicPageRenderer page={cmsPage} />
  const initialCourses = await fetchInitialCourses()
  return <CoursesLegacyClient initialCourses={initialCourses} />
}
