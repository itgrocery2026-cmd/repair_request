import { getSession } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import { Role, RequestStatus } from '@/app/generated/prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session?.userId || session.role !== Role.TECHNICIAN) {
    return Response.json({ count: 0 }, { status: 401 })
  }
  const count = await prisma.repairRequest.count({
    where: { status: RequestStatus.PENDING },
  })
  return Response.json({ count })
}
