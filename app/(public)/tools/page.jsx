export const revalidate = 1;

import { ToolsClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Tools',
  description:
    'Browse AI and digital marketing tools covered in Acadvizen programs, with categories and practical use cases.',
  path: '/tools',
})

export default function Page() {
  return <ToolsClientPage />
}


