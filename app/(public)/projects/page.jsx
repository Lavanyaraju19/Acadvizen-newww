export const revalidate = 0
export const dynamic = 'force-dynamic'

import ProjectsLegacyClient from '../../legacy-fallback/ProjectsLegacyClient'

export const metadata = {
  title: 'Projects',
  description: 'Explore AI-led digital marketing projects and case studies.',
}

export default function Page() {
  return <ProjectsLegacyClient />
}
