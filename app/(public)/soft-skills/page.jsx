export const revalidate = 0
export const dynamic = 'force-dynamic'

import SoftSkillsLegacyClient from '../../legacy-fallback/SoftSkillsLegacyClient'

export const metadata = {
  title: 'Soft Skills',
  description: 'Soft skills training for career-ready digital marketing learners.',
}

export default function Page() {
  return <SoftSkillsLegacyClient />
}
