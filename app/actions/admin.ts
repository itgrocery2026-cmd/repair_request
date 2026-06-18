'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { verifyAdmin } from '@/app/lib/dal'
import { RequestStatus } from '@/app/generated/prisma/client'

type State = { error: string } | { success: true } | null

export async function addTechnician(_prevState: State, formData: FormData): Promise<State> {
  await verifyAdmin()

  const name = (formData.get('name') as string).trim()
  const employeeId = (formData.get('employeeId') as string).trim()

  if (!name || !employeeId) return { error: 'กรุณากรอกข้อมูลให้ครบ' }

  const existing = await prisma.user.findUnique({ where: { employeeId } })
  if (existing) return { error: `รหัสพนักงาน "${employeeId}" มีอยู่ในระบบแล้ว` }

  await prisma.user.create({
    data: { name, employeeId, role: 'TECHNICIAN', isActive: false },
  })

  revalidatePath('/admin/technicians')
  return { success: true }
}

export async function resetTechnicianPassword(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.user.update({
    where: { id },
    data: { password: null, isActive: false },
  })
  revalidatePath('/admin/technicians')
}

export async function deleteTechnician(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin/technicians')
}

export async function approveJob(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('id') as string

  await prisma.repairRequest.update({
    where: { id, status: RequestStatus.DONE },
    data: { status: RequestStatus.COMPLETED, completedAt: new Date() },
  })

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteRequest(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('id') as string
  await prisma.$transaction([
    prisma.slaLog.deleteMany({ where: { requestId: id } }),
    prisma.repairRequest.deleteMany({ where: { id } }),
  ])
  revalidatePath('/admin')
}
