export const revalidate = 1;

import { CoursesClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Courses',
  description:
    'Explore Acadvizen digital marketing courses, highlights, curriculum depth, and project-led learning outcomes.',
  path: '/courses',
})

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Digital Marketing Courses</h1>
      <CoursesClientPage />
    </>
  )
}

