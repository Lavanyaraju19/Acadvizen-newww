export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../../components/cms/DynamicPageRenderer'
import { buildMetadata } from '../../../lib/seo'
import { fetchCourseBySlug } from '../../../lib/contentMeta'
import { fetchCmsPageByAnySlug, fetchLocationPageBySlug } from '../../../../lib/cmsServer'
import { isPublicCmsEnabled } from '../../../lib/publicCms'
import CourseDetailLegacyClient from '../../../legacy-fallback/CourseDetailLegacyClient'

export const dynamicParams = true

export async function generateStaticParams() {
  return [{ slug: 'basic' }, { slug: 'advanced' }, { slug: 'master' }]
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || ''
  if (isPublicCmsEnabled()) {
    const cmsPage = await fetchCmsPageByAnySlug([`course-${slug}`, `courses-${slug}`, slug])
    if (cmsPage) {
      return buildMetadata({
        title: cmsPage.seo_title || cmsPage.title || 'Course Details',
        description: cmsPage.seo_description || cmsPage.description || 'Course details at Acadvizen.',
        path: `/courses/${slug}`,
      })
    }
  }

  const course = slug ? await fetchCourseBySlug(slug) : null

  return buildMetadata({
    title: course?.title || 'Course Details',
    description:
      course?.short_description ||
      course?.description ||
      'Detailed digital marketing course curriculum, modules, resources, and outcomes at Acadvizen.',
    path: `/courses/${slug}`,
  })
}

export default async function Page({ params }) {
  const slug = params?.slug || ''
  if (isPublicCmsEnabled()) {
    const cmsPage = await fetchCmsPageByAnySlug([`course-${slug}`, `courses-${slug}`, slug])
    if (cmsPage) {
      return <DynamicPageRenderer page={cmsPage} />
    }

    const locationLike = await fetchLocationPageBySlug(`course-${slug}`)
    if (locationLike) {
      return <DynamicPageRenderer page={locationLike} />
    }
  }

  return (
    <>
      <div className="sr-only">
        <a href="/blog">Read latest blogs</a>
        <a href="/contact">Contact admissions</a>
        <a href="/digital-marketing-course-in-bangalore">Digital marketing course in Bangalore</a>
      </div>
      <CourseDetailLegacyClient />
    </>
  )
}
