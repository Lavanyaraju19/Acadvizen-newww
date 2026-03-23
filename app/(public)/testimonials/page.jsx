export const revalidate = 0
export const dynamic = 'force-dynamic'

import TestimonialsLegacyClient from '../../legacy-fallback/TestimonialsLegacyClient'

export const metadata = {
  title: 'Testimonials',
  description: 'Explore Acadvizen alumni outcomes and student placement stories.',
}

export default function Page() {
  return <TestimonialsLegacyClient />
}
