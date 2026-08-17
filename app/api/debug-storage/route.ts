import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/app/lib/dal'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  await verifyAdmin()

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const info = {
    hasKey: !!key,
    keyPrefix: key?.slice(0, 12) ?? null,
    keyLength: key?.length ?? 0,
  }

  if (!key) {
    return NextResponse.json({ ...info, error: 'SUPABASE_SERVICE_ROLE_KEY is not set in this deployment' })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
  const list = await supabase.storage.from('repair-images').list(undefined, { limit: 5 })

  return NextResponse.json({
    ...info,
    listError: list.error,
    fileCount: list.data?.length ?? null,
    files: list.data?.map((f) => f.name) ?? null,
  })
}
