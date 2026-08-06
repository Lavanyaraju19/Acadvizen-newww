export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { permanentRedirect, redirect } from 'next/navigation'
import DynamicPageRenderer from '../../../../components/cms/DynamicPageRenderer'
import { buildMetadata } from '../../../lib/seo'
import { fetchCourseBySlug } from '../../../lib/contentMeta'
import { fetchCmsPageByAnySlug, fetchLocationPageBySlug, fetchRedirectByPath } from '../../../../lib/cmsServer'
import { isPublicCmsEnabled } from '../../../lib/publicCms'
import CourseDetailLegacyClient from '../../../legacy-fallback/CourseDetailLegacyClient'
import Breadcrumbs from '../../../../components/cms/templates/Breadcrumbs'
import JsonLd from '../../../../components/cms/templates/JsonLd'
import { buildBreadcrumbSchema, buildCourseSchema } from '../../../../lib/structuredData'

export const dynamicParams = true

export async function generateMetadata({ params }) {
  const { slug } = await params
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
  const { slug } = await params
  const redirectRule = await fetchRedirectByPath(`/courses/${slug}`)
  if (redirectRule?.to_path) {
    if ((redirectRule.status_code || redirectRule.redirect_type) === 301) {
      permanentRedirect(redirectRule.to_path)
    }
    redirect(redirectRule.to_path)
  }

  if (isPublicCmsEnabled()) {
    const cmsPage = await fetchCmsPageByAnySlug([`course-${slug}`, `courses-${slug}`, slug])
    // Only use CMS renderer if the page has actual sections with content.
    if (cmsPage?.sections?.length) {
      return (
        <DynamicPageRenderer
          page={cmsPage}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Courses', href: '/courses' }, { label: cmsPage.title || 'Course' }]}
        />
      )
    }

    const locationLike = await fetchLocationPageBySlug(`course-${slug}`)
    // Only use CMS renderer if the location page has actual sections with content.
    if (locationLike?.sections?.length) {
      return (
        <DynamicPageRenderer
          page={locationLike}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Courses', href: '/courses' }, { label: locationLike.title || 'Course' }]}
        />
      )
    }
  }

  const course = await fetchCourseBySlug(slug)
  const courseTitle = course?.title || 'Course Details'
  const breadcrumbItems = [
    { label: 'Home', href: '/', path: '/' },
    { label: 'Courses', href: '/courses', path: '/courses' },
    { label: courseTitle, path: `/courses/${slug}` },
  ]

  return (
    <>
      <JsonLd id="course-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        id="course-schema"
        data={buildCourseSchema({
          name: courseTitle,
          description: course?.short_description || course?.description,
          path: `/courses/${slug}`,
        })}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <div className="sr-only">
        <Link href="/blog">Read latest blogs</Link>
        <Link href="/contact">Contact admissions</Link>
        <Link href="/digital-marketing-course-in-bangalore">Digital marketing course in Bangalore</Link>
      </div>
      <CourseDetailLegacyClient />
    </>
  )
}
