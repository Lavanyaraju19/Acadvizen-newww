export const revalidate = 1;

import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/admin-login')
}

