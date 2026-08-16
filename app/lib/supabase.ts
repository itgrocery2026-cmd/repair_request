import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Bypasses RLS — server-only, never expose to the browser.
function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function uploadImagesToBucket(bucket: string, files: File[]): Promise<string[]> {
  const validFiles = files.filter((f) => f.size > 0)
  if (validFiles.length === 0) return []

  const supabase = createSupabaseClient()
  const urls: string[] = []

  for (const file of validFiles) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType: file.type })

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
  }

  return urls
}

export async function deleteStorageObjectsByUrl(bucket: string, urls: string[]) {
  const paths = urls
    .map((url) => url.split(`/${bucket}/`)[1])
    .filter((path): path is string => !!path)

  if (paths.length === 0) return

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) console.error('Failed to delete storage objects:', error)
}
