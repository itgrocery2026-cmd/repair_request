'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { createSupabaseClient } from '@/app/lib/supabase'

type State = { error: string } | { success: true } | null

export async function createRepairRequest(_prevState: State, formData: FormData): Promise<State> {
  const branchId = formData.get('branchId') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const reporterName = formData.get('reporterName') as string

  if (!branchId || !location || !description || !reporterName) {
    return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
  }

  const files = formData.getAll('images') as File[]
  const validFiles = files.filter((f) => f.size > 0)
  const imageUrls: string[] = []

  if (validFiles.length > 0) {
    const supabase = createSupabaseClient()
    for (const file of validFiles) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error } = await supabase.storage
        .from('repair-images')
        .upload(fileName, buffer, { contentType: file.type })

      if (!error) {
        const { data } = supabase.storage.from('repair-images').getPublicUrl(fileName)
        imageUrls.push(data.publicUrl)
      }
    }
  }

  await prisma.repairRequest.create({
    data: {
      branchId,
      location,
      description,
      images: imageUrls,
      reporterName,
    },
  })

  revalidatePath('/')
  return { success: true }
}
