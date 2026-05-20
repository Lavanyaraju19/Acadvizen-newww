import path from 'node:path'
import sharp from 'sharp'
import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../_utils'
import { isAllowedCmsBucket } from '../../../../lib/mediaBuckets'

export const dynamic = 'force-dynamic'

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'])

function sanitizeBaseName(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'asset'
}

function buildStoragePath(fileName, extension) {
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const stamp = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
  return `${year}/${month}/${sanitizeBaseName(fileName)}-${stamp}.${extension}`
}

async function optimizeUpload(file) {
  const sourceBuffer = Buffer.from(await file.arrayBuffer())
  const originalType = String(file.type || 'application/octet-stream')
  const originalName = String(file.name || 'upload')

  if (!originalType.startsWith('image/') || originalType === 'image/svg+xml' || originalType === 'image/gif') {
    const fallbackExtension = path.extname(originalName).replace('.', '') || 'bin'
    return {
      buffer: sourceBuffer,
      contentType: originalType,
      extension: fallbackExtension,
      width: null,
      height: null,
      size: sourceBuffer.byteLength,
    }
  }

  if (!IMAGE_MIME_TYPES.has(originalType)) {
    const metadata = await sharp(sourceBuffer).metadata().catch(() => ({}))
    const fallbackExtension = path.extname(originalName).replace('.', '') || 'img'
    return {
      buffer: sourceBuffer,
      contentType: originalType,
      extension: fallbackExtension,
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
      size: sourceBuffer.byteLength,
    }
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
    extension: 'webp',
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    size: optimizedBuffer.byteLength,
  }
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  try {
    const formData = await request.formData()
    const bucket = String(formData.get('bucket') || '').trim()
    const file = formData.get('file')

    if (!bucket) return jsonError('bucket is required.', 400)
    if (!isAllowedCmsBucket(bucket)) return jsonError(`Unsupported upload bucket "${bucket}".`, 400)
    if (!(file instanceof File)) return jsonError('file is required.', 400)

    const optimized = await optimizeUpload(file)
    const storagePath = buildStoragePath(file.name, optimized.extension)
    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, optimized.buffer, {
      contentType: optimized.contentType,
      cacheControl: '31536000',
      upsert: false,
    })

    if (uploadError) {
      return jsonError(`Failed to upload file: ${uploadError.message}`, 500)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    return jsonOk({
      bucket,
      path: storagePath,
      url: data?.publicUrl || '',
      type: optimized.contentType.startsWith('video/')
        ? 'video'
        : optimized.contentType.startsWith('image/')
          ? 'image'
          : 'file',
      width: optimized.width,
      height: optimized.height,
      size: optimized.size,
      contentType: optimized.contentType,
      originalName: file.name,
    })
  } catch (error) {
    return jsonError(error?.message || 'Upload failed.', 500)
  }
}

export async function DELETE(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const bucket = String(body?.bucket || '').trim()
  const targetPath = String(body?.path || '').trim()

  if (!bucket || !targetPath) return jsonError('bucket and path are required.', 400)
  if (!isAllowedCmsBucket(bucket)) return jsonError(`Unsupported upload bucket "${bucket}".`, 400)

  const { error } = await supabase.storage.from(bucket).remove([targetPath])
  if (error) return jsonError(`Failed to delete file: ${error.message}`, 500)

  return jsonOk({ bucket, path: targetPath, deleted: true })
}
