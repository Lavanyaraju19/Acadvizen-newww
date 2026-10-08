import AdminLayoutClient from './AdminLayoutClient'
import { getWordPressConfig } from '../../lib/wordpress/config'
import { isWordPressOwnershipEnabled } from '../../lib/wordpress/contentOwnership'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }) {
  // Public website content is edited in the WordPress Master Admin; tell administrators where.
  const origin = isWordPressOwnershipEnabled() ? getWordPressConfig().origin : ''
  const wordpress = isWordPressOwnershipEnabled() ? { adminUrl: origin ? `${origin}/wp-admin/` : '' } : null
  return <AdminLayoutClient wordpress={wordpress}>{children}</AdminLayoutClient>
}
