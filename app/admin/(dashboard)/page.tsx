import Link from 'next/link'
import { verifyAdmin } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import DeleteRequestButton from '@/app/ui/DeleteRequestButton'

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'รอ assign',
  ASSIGNED: 'assigned แล้ว',
  IN_PROGRESS: 'กำลังซ่อม',
  DONE: 'ส่งงาน',
  COMPLETED: 'เสร็จสิ้น',
}

const STATUS_COLOR: Record<RequestStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

function slaChip(deadline: Date | null, status: RequestStatus) {
  if (!deadline || status === RequestStatus.DONE) return null
  const now = Date.now()
  const diff = deadline.getTime() - now
  const hours = diff / 1000 / 60 / 60
  if (diff < 0) return <span className="ml-2 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">เกิน SLA</span>
  if (hours < 24) return <span className="ml-2 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">ใกล้หมด SLA</span>
  return null
}

export default async function AdminPage() {
  await verifyAdmin()

  const requests = await prisma.repairRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      branch: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  })

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === RequestStatus.PENDING).length,
    inProgress: requests.filter((r) => r.status === RequestStatus.IN_PROGRESS).length,
    done: requests.filter((r) => r.status === RequestStatus.DONE).length,
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ทั้งหมด', value: counts.total, color: 'text-gray-700' },
          { label: 'รอ assign', value: counts.pending, color: 'text-gray-600' },
          { label: 'กำลังซ่อม', value: counts.inProgress, color: 'text-yellow-600' },
          { label: 'ส่งงาน', value: counts.done, color: 'text-green-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow-sm p-4 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">วันที่แจ้ง</th>
              <th className="px-4 py-3 font-medium">สาขา</th>
              <th className="px-4 py-3 font-medium">จุดที่เสีย</th>
              <th className="px-4 py-3 font-medium">ผู้แจ้ง</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">ช่าง</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีใบแจ้งงาน
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">
                  {r.createdAt.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.branch.name}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{r.location}</td>
                <td className="px-4 py-3 text-gray-600">{r.reporterName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {slaChip(r.slaDeadline, r.status)}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.assignedTo?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    >
                      ดูรายละเอียด
                    </Link>
                    <DeleteRequestButton id={r.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
