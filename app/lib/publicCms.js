export function isPublicCmsEnabled() {
  const value = String(process.env.NEXT_PUBLIC_ENABLE_CMS_PUBLIC || '').toLowerCase()
  return value === 'true' || value === '1' || value === 'on'
}
