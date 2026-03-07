export const revalidate = 1;

import { CourseDetailClientPage } from '../../../client-pages'
import { buildMetadata } from '../../../lib/seo'
import { fetchCourseBySlug } from '../../../lib/contentMeta'

export const dynamicParams = true

export async function generateStaticParams() {
  return [{ slug: 'basic' }, { slug: 'advanced' }, { slug: 'master' }]
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || ''
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

export default function Page() {
  return (
    <>
      <div className="sr-only">
        <h1>Digital Marketing Course Details</h1>
        <a href="/blog">Read latest blogs</a>
        <a href="/contact">Contact admissions</a>
        <a href="/digital-marketing-course-in-bangalore">Digital marketing course in Bangalore</a>
      </div>
      <CourseDetailClientPage />
    </>
  )
}
