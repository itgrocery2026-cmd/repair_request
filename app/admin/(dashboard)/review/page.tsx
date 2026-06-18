import Link from 'next/link'
import { verifyAdmin } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import { fmtDate } from '@/app/lib/fmt'
import { approveJob } from '@/app/actions/admin'

export default async function ReviewPage() {
  await verifyAdmin()

  const requests = await prisma.repairRequest.findMany({
    where: { status: RequestStatus.DONE },
    orderBy: { updatedAt: 'desc' },
    include: {
      branch: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  })

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-900 text-lg">
          ตรวจงาน
          <span className="ml-2 text-sm font-normal text-gray-400">({requests.length} รายการ)</span>
        </h1>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">ไม่มีงานรอตรวจ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-900">{r.location}</span>
                    <span className="text-xs text-gray-400">{r.branch.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{r.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>ผู้แจ้ง: {r.reporterName}</span>
                    <span>ช่าง: {r.assignedTo?.name ?? '—'}</span>
                    {r.slaDeadline && <span>SLA: {fmtDate(r.slaDeadline)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    ดูรายละเอียด
                  </Link>
                  <form action={approveJob}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      อนุมัติ
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
