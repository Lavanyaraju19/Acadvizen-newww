export const revalidate = 0
export const dynamic = 'force-dynamic'

import { ToolsClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const metadata = buildMetadata({
  title: 'Tools',
  description:
    'Browse AI and digital marketing tools covered in Acadvizen programs, with categories and practical use cases.',
  path: '/tools',
})

export default function Page() {
  return <ToolsClientPage />
}
