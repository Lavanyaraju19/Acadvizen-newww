import AdminLayoutClient from './AdminLayoutClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
