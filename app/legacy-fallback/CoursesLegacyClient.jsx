'use client'

import { CoursesPage } from '../../src/legacy/pages/CoursesPage'

export default function CoursesLegacyClient({ initialCourses = [] }) {
  return <CoursesPage initialCourses={initialCourses} />
}
