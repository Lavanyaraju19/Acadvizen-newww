import { supabase } from './supabaseClient'

export async function uploadFile(file, bucket) {
  if (!file) {
    throw new Error('No file selected for upload.')
  }
  if (!bucket) {
    throw new Error('Storage bucket is required.')
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData?.session) {
    throw new Error('You must be signed in to upload files.')
  }

  const safeName = file.name.replace(/\s+/g, '-')
  const fileName = `${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true })
  if (error) {
    throw new Error(error.message || 'Upload failed.')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data?.publicUrl || ''
}
