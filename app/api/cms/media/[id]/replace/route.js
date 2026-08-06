import path from 'node:path'
import sharp from 'sharp'
import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

// This is image-replace specifically (the admin UI only ever offers it for item.type ===
// 'image'), so the allowlist stays image-only rather than mirroring the general upload route's
// broader set - anything else here would be an unexpected/forged request, not a legitimate use.
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif'])
const MAX_REPLACE_BYTES = 25 * 1024 * 1024

async function optimizeUpload(file) {
  if (file.size > MAX_REPLACE_BYTES) {
    throw new Error(`File is too large. Maximum size is ${Math.round(MAX_REPLACE_BYTES / (1024 * 1024))}MB.`)
  }
  const sourceBuffer = Buffer.from(await file.arrayBuffer())
  const originalType = String(file.type || 'application/octet-stream')

  if (!IMAGE_MIME_TYPES.has(originalType)) {
    throw new Error(`Unsupported file type "${originalType}". Replace only accepts images.`)
  }

  const transformer = sharp(sourceBuffer, { failOn: 'none' }).rotate().resize({
    width: 2400,
    height: 2400,
    fit: 'inside',
    withoutEnlargement: true,
  })
  const metadata = await transformer.metadata()
  const optimizedBuffer = await transformer.webp({ quality: 84 }).toBuffer()

  return {
    buffer: optimizedBuffer,
    contentType: 'image/webp',
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    size: optimizedBuffer.byteLength,
  }
}

// Replaces the actual file behind an existing media library entry, in place: same media row,
// same public URL. That's the point - the "Save & Replace" button used to just create a brand
// new media row for the edited image, leaving every page/blog/banner that already referenced
// the original URL still pointing at the old, unedited file. Uploading to the exact same
// storage path with upsert means every existing reference picks up the new content for free,
// with no need to hunt down and update each reference individually.
export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const { data: existing, error: existingError } = await supabase.from('media').select('*').eq('id', id).maybeSingle()
  if (existingError) return jsonError(`Failed to load media: ${existingError.message}`, 500)
  if (!existing) return jsonError('Media not found.', 404)
  if (!existing.bucket || !existing.path) {
    return jsonError('This media entry has no storage path on record, so it cannot be replaced in place. Delete it and upload a new file instead.', 400)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return jsonError('file is required.', 400)

    const optimized = await optimizeUpload(file)
    const extension = optimized.contentType === 'image/webp' ? 'webp' : (path.extname(existing.path).replace('.', '') || 'bin')
    // Keep the same directory, but the extension may change (e.g. a PNG replacement gets
    // re-encoded to WebP) - if it does, the old object is removed after the new one uploads.
    const targetPath = existing.path.replace(/\.[^./]+$/, '') + `.${extension}`

    const { error: uploadError } = await supabase.storage.from(existing.bucket).upload(targetPath, optimized.buffer, {
      contentType: optimized.contentType,
      cacheControl: '31536000',
      upsert: true,
    })
    if (uploadError) return jsonError(`Failed to upload replacement file: ${uploadError.message}`, 500)

    if (targetPath !== existing.path) {
      await supabase.storage.from(existing.bucket).remove([existing.path])
    }

    const { data: publicUrlData } = supabase.storage.from(existing.bucket).getPublicUrl(targetPath)

    const { data: updated, error: updateError } = await supabase
      .from('media')
      .update({
        url: publicUrlData?.publicUrl || existing.url,
        path: targetPath,
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) return jsonError(`File replaced in storage, but failed to update media record: ${updateError.message}`, 500)
    return jsonOk(updated)
  } catch (error) {
    return jsonError(error?.message || 'Replace failed.', 500)
  }
}
