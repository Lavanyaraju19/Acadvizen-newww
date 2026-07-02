import { Surface } from '../../../src/components/ui/Surface'
import { redirect } from 'next/navigation'

export default function TrustConversionPage() {
  redirect('/admin/trust')
  return null
}
