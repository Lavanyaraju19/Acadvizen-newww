export const revalidate = 1;

import { ContactClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Get in touch with Acadvizen admissions and support teams in Jayanagar, Bangalore.',
  path: '/contact',
})

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Contact Acadvizen</h1>
      <ContactClientPage />
    </>
  )
}

