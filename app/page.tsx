import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import RepairForm from '@/app/ui/RepairForm'
import { RequestStatus } from '@/app/generated/prisma/client'
import { fmtDate } from '@/app/lib/fmt'

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'รอดำเนินการ',
  ASSIGNED: 'มีช่างรับแล้ว',
  IN_PROGRESS: 'กำลังซ่อม',
  DONE: 'กำลังซ่อม',
  COMPLETED: 'เสร็จสิ้น',
}

const STATUS_COLOR: Record<RequestStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

const FILTERS: { label: string; value: string }[] = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'รอดำเนินการ', value: 'PENDING' },
  { label: 'กำลังซ่อม', value: 'IN_PROGRESS' },
  { label: 'เสร็จสิ้น', value: 'COMPLETED' },
]

function isValidStatus(s: string): s is RequestStatus {
  return Object.values(RequestStatus).includes(s as RequestStatus)
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeStatus = status && isValidStatus(status) ? status : null

  const whereStatus =
    activeStatus === RequestStatus.IN_PROGRESS
      ? { status: { in: [RequestStatus.IN_PROGRESS, RequestStatus.DONE] } }
      : activeStatus
      ? { status: activeStatus }
      : undefined

  const [branches, requests] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
    prisma.repairRequest.findMany({
      where: whereStatus,
      orderBy: { updatedAt: 'desc' },
      include: { branch: { select: { name: true } } },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-gray-900">ระบบแจ้งซ่อม</span>
        <div className="flex gap-4 text-sm">
          <Link href="/technician/login" className="text-gray-500 hover:text-blue-600 transition-colors">ช่าง</Link>
          <Link href="/admin/login" className="text-gray-500 hover:text-blue-600 transition-colors">Admin</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <details className="group">
          <summary className="list-none cursor-pointer w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm text-center">
            + แจ้งซ่อมใหม่
          </summary>
          <div className="mt-4">
            <RepairForm branches={branches} />
          </div>
        </details>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400',   label: 'รอดำเนินการ',  desc: 'คำร้องถูกส่งแล้ว รอช่างเข้ารับงาน' },
            { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'กำลังซ่อม', desc: 'ช่างรับงานและกำลังดำเนินการ' },
            { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  label: 'เสร็จสิ้น', desc: 'Admin อนุมัติเรียบร้อยแล้ว' },
          ].map(({ color, dot, label, desc }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-gray-900">
              รายการแจ้งซ่อม
              <span className="ml-2 text-sm font-normal text-gray-400">({requests.length} รายการ)</span>
            </h2>
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(({ label, value }) => {
                const isActive = (value === '' && !activeStatus) || value === activeStatus
                return (
                  <Link
                    key={value}
                    href={value ? `/?status=${value}` : '/'}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {requests.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">ไม่มีรายการในสถานะนี้</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left text-xs">
                <tr>
                  <th className="px-5 py-3 font-medium">ชื่อ / สาขา</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">รายละเอียด</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">ผู้แจ้ง</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{r.location}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.branch.name}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell max-w-[200px]">
                      <p className="truncate">{r.description}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                      <p>{r.reporterName}</p>
                      <p className="text-xs text-gray-400">{fmtDate(r.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/requests/${r.id}`}
                        className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
