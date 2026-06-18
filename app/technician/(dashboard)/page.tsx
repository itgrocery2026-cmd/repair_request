import Link from 'next/link'
import { verifyTechnician } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import { unclaimJob } from '@/app/actions/technician'

function SlaChip({ deadline, status }: { deadline: Date | null; status: RequestStatus }) {
  if (!deadline || status === RequestStatus.DONE) return null
  const diff = deadline.getTime() - Date.now()
  const hours = diff / 1000 / 60 / 60
  if (diff < 0)
    return <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">เกิน SLA</span>
  if (hours < 24)
    return <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">ใกล้หมด SLA</span>
  return null
}

const TABS = [
  { key: 'mine', label: 'งานของฉัน' },
  { key: 'pending', label: 'ยังไม่มีช่างรับ' },
  { key: 'team', label: 'งานของทีม' },
] as const

type Tab = (typeof TABS)[number]['key']

export default async function TechnicianPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await verifyTechnician()
  const { tab } = await searchParams
  const activeTab: Tab = (tab === 'pending' || tab === 'team') ? tab : 'mine'

  const [myJobs, pendingJobs, teamJobs] = await Promise.all([
    activeTab === 'mine'
      ? prisma.repairRequest.findMany({
          where: { assignedToId: session.userId, status: { notIn: [RequestStatus.DONE, RequestStatus.COMPLETED] } },
          orderBy: { assignedAt: 'desc' },
          include: { branch: { select: { name: true } } },
        })
      : [],
    activeTab === 'pending'
      ? prisma.repairRequest.findMany({
          where: { status: RequestStatus.PENDING },
          orderBy: { createdAt: 'asc' },
          include: { branch: { select: { name: true } } },
        })
      : [],
    activeTab === 'team'
      ? prisma.repairRequest.findMany({
          where: {
            assignedToId: { not: session.userId },
            status: { in: [RequestStatus.IN_PROGRESS, RequestStatus.ASSIGNED] },
          },
          orderBy: { assignedAt: 'desc' },
          include: {
            branch: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
        })
      : [],
  ])

  const counts = await prisma.repairRequest.groupBy({
    by: ['status'],
    _count: true,
    where: {
      OR: [
        { status: RequestStatus.PENDING },
        { assignedToId: session.userId, status: { not: RequestStatus.DONE } },
      ],
    },
  })
  const pendingCount = counts.find((c) => c.status === RequestStatus.PENDING)?._count ?? 0
  const myCount = counts
    .filter((c) => c.status !== RequestStatus.PENDING)
    .reduce((sum, c) => sum + c._count, 0)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <nav className="flex border-b border-gray-200 mb-6">
        {TABS.map(({ key, label }) => {
          const badge =
            key === 'mine' ? myCount :
            key === 'pending' ? pendingCount :
            null
          return (
            <Link
              key={key}
              href={`/technician?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {activeTab === 'mine' && (
        <div className="space-y-3">
          {myJobs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">ยังไม่มีงานที่รับ</p>
          ) : (
            myJobs.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/technician/requests/${r.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{r.location}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{r.branch.name} · {r.description}</p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <SlaChip deadline={r.slaDeadline} status={r.status} />
                    <form action={unclaimJob}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors"
                      >
                        คืนงาน
                      </button>
                    </form>
                  </div>
                </div>
                {r.slaDeadline && (
                  <p className="text-xs text-gray-400 mt-2">
                    กำหนดเสร็จ:{' '}
                    {r.slaDeadline.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">ไม่มีงานที่รอช่าง</p>
          ) : (
            pendingJobs.map((r) => (
              <Link
                key={r.id}
                href={`/technician/requests/${r.id}`}
                className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-gray-900">{r.location}</p>
                <p className="text-sm text-gray-500 mt-0.5">{r.branch.name} · {r.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  แจ้งเมื่อ:{' '}
                  {r.createdAt.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-3">
          {teamJobs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">ไม่มีงานของทีมในขณะนี้</p>
          ) : (
            teamJobs.map((r) => (
              <Link
                key={r.id}
                href={`/technician/requests/${r.id}`}
                className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{r.location}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{r.branch.name} · {r.description}</p>
                  </div>
                  <SlaChip deadline={r.slaDeadline} status={r.status} />
                </div>
                <p className="text-xs text-gray-400 mt-2">ช่าง: {r.assignedTo?.name}</p>
                {r.slaDeadline && (
                  <p className="text-xs text-gray-400">
                    กำหนดเสร็จ:{' '}
                    {r.slaDeadline.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </main>
  )
}
