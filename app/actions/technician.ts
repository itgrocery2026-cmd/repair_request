'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { verifyTechnician } from '@/app/lib/dal'
import { RequestStatus } from '@/app/generated/prisma/client'
import { uploadImagesToBucket } from '@/app/lib/supabase'

export async function claimJob(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string
  const slaDeadline = formData.get('slaDeadline') as string
  const slaNote = (formData.get('slaNote') as string) || null

  if (!slaDeadline) return

  const request = await prisma.repairRequest.findUnique({
    where: { id: requestId },
    select: { status: true },
  })

  if (!request || request.status !== RequestStatus.PENDING) return

  const deadline = new Date(slaDeadline)
  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId },
      data: {
        assignedToId: session.userId,
        assignedAt: new Date(),
        slaDeadline: deadline,
        slaNote,
        status: RequestStatus.IN_PROGRESS,
      },
    }),
    prisma.slaLog.create({
      data: { requestId, deadline, note: slaNote },
    }),
    ...(imageUrls.length > 0
      ? [prisma.repairImage.createMany({ data: imageUrls.map((url) => ({ requestId, url })) })]
      : []),
  ])

  revalidatePath('/technician')
  redirect('/technician')
}

export async function extendSla(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string
  const slaDeadline = formData.get('slaDeadline') as string
  const slaNote = (formData.get('slaNote') as string).trim()

  if (!slaDeadline || !slaNote) return

  const deadline = new Date(slaDeadline)

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId, assignedToId: session.userId },
      data: { slaDeadline: deadline, slaNote: slaNote || null },
    }),
    prisma.slaLog.create({
      data: { requestId, deadline, note: slaNote },
    }),
  ])

  revalidatePath(`/technician/requests/${requestId}`)
}

export async function unclaimJob(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string

  await prisma.$transaction([
    prisma.slaLog.deleteMany({ where: { requestId } }),
    prisma.repairRequest.update({
      where: { id: requestId, assignedToId: session.userId },
      data: {
        assignedToId: null,
        assignedAt: null,
        slaDeadline: null,
        slaNote: null,
        status: RequestStatus.PENDING,
      },
    }),
  ])

  revalidatePath('/technician')
  redirect('/technician')
}

export async function markDone(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string
  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId, assignedToId: session.userId },
      data: {
        status: RequestStatus.DONE,
        completedAt: new Date(),
      },
    }),
    ...(imageUrls.length > 0
      ? [prisma.repairImage.createMany({ data: imageUrls.map((url) => ({ requestId, url })) })]
      : []),
  ])

  revalidatePath('/technician')
  redirect('/technician')
}
