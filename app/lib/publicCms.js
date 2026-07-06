export function isPublicCmsEnabled() {
  const value = String(process.env.NEXT_PUBLIC_ENABLE_CMS_PUBLIC || '').toLowerCase()

  console.log("==== PUBLIC CMS DEBUG ====")
  console.log("NEXT_PUBLIC_ENABLE_CMS_PUBLIC =", process.env.NEXT_PUBLIC_ENABLE_CMS_PUBLIC)
  console.log("normalized =", value)
  console.log("returns =", !['false','0','off','disabled'].includes(value))
  console.log("==========================")

  if (['false','0','off','disabled'].includes(value)) return false
  return true
}
