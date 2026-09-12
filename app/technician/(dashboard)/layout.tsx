import Link from 'next/link'
import { techLogout } from '@/app/actions/auth'
import { verifyTechnician } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import PendingCountAlert from '@/app/ui/PendingCountAlert'
import AssignmentAlert from '@/app/ui/AssignmentAlert'

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyTechnician()
  const [me, pendingAssignments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    }),
    prisma.jobAssignment.findMany({
      where: {
        userId: session.userId,
        acknowledgedAt: null,
        request: { status: { notIn: [RequestStatus.DONE, RequestStatus.COMPLETED] } },
      },
      include: { request: { include: { branch: { select: { name: true } } } } },
      orderBy: { assignedAt: 'asc' },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <PendingCountAlert
        endpoint="/api/tech/pending-count"
        messageTemplate="มีงานเข้ามาใหม่ {count} งาน ที่ยังไม่มีช่างรับ"
      />
      <AssignmentAlert
        assignments={pendingAssignments.map((a) => ({
          requestId: a.requestId,
          branchName: a.request.branch.name,
          location: a.request.location,
        }))}
      />
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors">
            ← หน้าแรก
          </Link>
          <span className="text-gray-200">|</span>
          <div>
            <p className="font-semibold text-gray-900">{me?.name}</p>
            <p className="text-xs text-gray-400">ช่างซ่อมบำรุง</p>
          </div>
        </div>
        <form action={techLogout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            ออกจากระบบ
          </button>
        </form>
      </header>
      {children}
    </div>
  )
}
