export function isPublicCmsEnabled() {
  const value = String(process.env.NEXT_PUBLIC_ENABLE_CMS_PUBLIC || '').toLowerCase()
  if (['false', '0', 'off', 'disabled'].includes(value)) return false
  return true
}
