'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { uploadImagesToBucket } from '@/app/lib/supabase'

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
  const imageUrls = await uploadImagesToBucket('repair-images', files)

  await prisma.repairRequest.create({
    data: {
      branchId,
      location,
      description,
      images: { create: imageUrls.map((url) => ({ url, label: 'แจ้งซ่อม' })) },
      reporterName,
    },
  })

  revalidatePath('/')
  return { success: true }
}
