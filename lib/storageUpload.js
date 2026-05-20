import { adminApiFetch } from './adminApiClient'

export async function uploadFileAsset(file, bucket) {
  if (!file) {
    throw new Error('No file selected for upload.')
  }
  if (!bucket) {
    throw new Error('Storage bucket is required.')
  }

  const formData = new FormData()
  formData.set('bucket', bucket)
  formData.set('file', file)

  const payload = await adminApiFetch('/api/cms/upload', {
    method: 'POST',
    body: formData,
  })

  if (!payload?.data?.url) {
    throw new Error('Upload completed without a public URL.')
  }

  return payload.data
}

export async function uploadFile(file, bucket) {
  const asset = await uploadFileAsset(file, bucket)
  return asset.url
}

export async function deleteFileAsset({ bucket, path }) {
  if (!bucket || !path) return

  await adminApiFetch('/api/cms/upload', {
    method: 'DELETE',
    body: { bucket, path },
  })
}
