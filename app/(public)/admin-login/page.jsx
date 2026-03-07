import AdminLoginForm from '../../../components/AdminLoginForm'
import { buildMetadata } from '../../lib/seo'

export const metadata = buildMetadata({
  title: 'Admin Login',
  description: 'Hidden admin login for ACADVIZEN CMS access.',
  path: '/admin-login',
})
metadata.robots = {
  index: false,
  follow: false,
}

export default function Page() {
  return <AdminLoginForm />
}
