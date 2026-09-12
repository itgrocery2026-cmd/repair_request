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
  const now = new Date()
  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])
  const slaCount = await prisma.slaLog.count({ where: { requestId } })
  const label = `SLA ครั้งที่ ${slaCount + 1}`

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId },
      data: {
        assignedAt: now,
        slaDeadline: deadline,
        slaNote,
        status: RequestStatus.IN_PROGRESS,
      },
    }),
    prisma.jobAssignment.create({
      data: { requestId, userId: session.userId, assignedAt: now, acknowledgedAt: now },
    }),
    prisma.slaLog.create({
      data: { requestId, deadline, note: slaNote, technicianId: session.userId },
    }),
    ...(imageUrls.length > 0
      ? [prisma.repairImage.createMany({ data: imageUrls.map((url) => ({ requestId, url, label })) })]
      : []),
  ])

  revalidatePath('/technician')
  redirect('/technician')
}

export async function confirmAssignment(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string
  const slaDeadline = formData.get('slaDeadline') as string
  const slaNote = (formData.get('slaNote') as string) || null

  if (!slaDeadline) return

  const assignment = await prisma.jobAssignment.findUnique({
    where: { requestId_userId: { requestId, userId: session.userId } },
  })
  if (!assignment) return

  const deadline = new Date(slaDeadline)
  const now = new Date()
  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])

  await prisma.$transaction(async (tx) => {
    // Race-safe: only the first confirmer actually sets the SLA. If someone beat us to
    // it, just join the job (mark acknowledged) without creating a duplicate SLA log.
    const { count } = await tx.repairRequest.updateMany({
      where: { id: requestId, slaDeadline: null },
      data: { slaDeadline: deadline, slaNote, status: RequestStatus.IN_PROGRESS },
    })

    await tx.jobAssignment.update({
      where: { requestId_userId: { requestId, userId: session.userId } },
      data: { acknowledgedAt: now },
    })

    if (count > 0) {
      await tx.slaLog.create({
        data: { requestId, deadline, note: slaNote, technicianId: session.userId },
      })
      if (imageUrls.length > 0) {
        await tx.repairImage.createMany({
          data: imageUrls.map((url) => ({ requestId, url, label: 'SLA ครั้งที่ 1' })),
        })
      }
    }
  })

  revalidatePath(`/technician/requests/${requestId}`)
  redirect(`/technician/requests/${requestId}`)
}

export async function acknowledgeAssignment(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string

  await prisma.jobAssignment.update({
    where: { requestId_userId: { requestId, userId: session.userId } },
    data: { acknowledgedAt: new Date() },
  })

  redirect(`/technician/requests/${requestId}`)
}

export async function extendSla(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string
  const slaDeadline = formData.get('slaDeadline') as string
  const slaNote = (formData.get('slaNote') as string).trim()

  if (!slaDeadline || !slaNote) return

  const assignment = await prisma.jobAssignment.findUnique({
    where: { requestId_userId: { requestId, userId: session.userId } },
  })
  if (!assignment) return

  const deadline = new Date(slaDeadline)
  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])
  const slaCount = await prisma.slaLog.count({ where: { requestId } })
  const label = `SLA ครั้งที่ ${slaCount + 1}`

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId },
      data: { slaDeadline: deadline, slaNote: slaNote || null },
    }),
    prisma.slaLog.create({
      data: { requestId, deadline, note: slaNote, technicianId: session.userId },
    }),
    ...(imageUrls.length > 0
      ? [prisma.repairImage.createMany({ data: imageUrls.map((url) => ({ requestId, url, label })) })]
      : []),
  ])

  revalidatePath(`/technician/requests/${requestId}`)
}

export async function unclaimJob(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.jobAssignment.deleteMany({ where: { requestId, userId: session.userId } })
    if (deleted.count === 0) return

    const remaining = await tx.jobAssignment.count({ where: { requestId } })
    if (remaining === 0) {
      await tx.slaLog.deleteMany({ where: { requestId } })
      await tx.repairRequest.update({
        where: { id: requestId },
        data: {
          assignedAt: null,
          slaDeadline: null,
          slaNote: null,
          status: RequestStatus.PENDING,
        },
      })
    }
  })

  revalidatePath('/technician')
  redirect('/technician')
}

export async function markDone(formData: FormData) {
  const session = await verifyTechnician()
  const requestId = formData.get('requestId') as string

  const assignment = await prisma.jobAssignment.findUnique({
    where: { requestId_userId: { requestId, userId: session.userId } },
  })
  if (!assignment) return

  const imageUrls = await uploadImagesToBucket('repair-images', formData.getAll('images') as File[])

  await prisma.$transaction([
    prisma.repairRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.DONE,
        completedAt: new Date(),
      },
    }),
    ...(imageUrls.length > 0
      ? [prisma.repairImage.createMany({ data: imageUrls.map((url) => ({ requestId, url, label: 'เสร็จสิ้น' })) })]
      : []),
  ])

  revalidatePath('/technician')
  redirect('/technician')
}
