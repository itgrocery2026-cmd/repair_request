import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifyAdmin } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import { fmtDate } from '@/app/lib/fmt'
import { approveJob } from '@/app/actions/admin'

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'รอช่างรับงาน',
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

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifyAdmin()
  const { id } = await params

  const request = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      branch: true,
      assignedTo: { select: { name: true, employeeId: true } },
      slaLogs: { orderBy: { createdAt: 'desc' } },
      images: true,
    },
  })

  if (!request) notFound()

  const slaExpired =
    request.slaDeadline &&
    request.status !== RequestStatus.DONE &&
    request.slaDeadline < new Date()

  const slaNear =
    request.slaDeadline &&
    request.status !== RequestStatus.DONE &&
    !slaExpired &&
    request.slaDeadline.getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700 font-medium">รายละเอียดใบแจ้งงาน</span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLOR[request.status]}`}>
          {STATUS_LABEL[request.status]}
        </span>
        {slaExpired && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-red-100 text-red-600">เกิน SLA</span>
        )}
        {slaNear && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-600">ใกล้หมด SLA</span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลการแจ้ง</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-gray-500">สาขา</dt>
          <dd className="text-gray-900">{request.branch.name}</dd>

          <dt className="text-gray-500">จุดที่เสีย</dt>
          <dd className="text-gray-900">{request.location}</dd>

          <dt className="text-gray-500">รายละเอียด</dt>
          <dd className="text-gray-900">{request.description}</dd>

          <dt className="text-gray-500">ผู้แจ้ง</dt>
          <dd className="text-gray-900">{request.reporterName}</dd>

          {request.reporterPhone && (
            <>
              <dt className="text-gray-500">เบอร์โทร</dt>
              <dd className="text-gray-900">{request.reporterPhone}</dd>
            </>
          )}

          <dt className="text-gray-500">วันที่แจ้ง</dt>
          <dd className="text-gray-900">{fmtDate(request.createdAt)}</dd>
        </dl>

        {request.images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">รูปภาพประกอบ</p>
            <div className="grid grid-cols-3 gap-2">
              {request.images.map((img, i) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`รูปที่ ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลช่าง</h2>
        {request.assignedTo ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-gray-500">ช่าง</dt>
            <dd className="text-gray-900">{request.assignedTo.name}</dd>

            <dt className="text-gray-500">รหัสพนักงาน</dt>
            <dd className="text-gray-900">{request.assignedTo.employeeId}</dd>

            {request.assignedAt && (
              <>
                <dt className="text-gray-500">รับงานเมื่อ</dt>
                <dd className="text-gray-900">{fmtDate(request.assignedAt)}</dd>
              </>
            )}

            {request.slaDeadline && (
              <>
                <dt className="text-gray-500">กำหนดเสร็จ (SLA)</dt>
                <dd className={`font-medium ${slaExpired ? 'text-red-600' : slaNear ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {fmtDate(request.slaDeadline)}
                </dd>
              </>
            )}

            {request.slaNote && (
              <>
                <dt className="text-gray-500">หมายเหตุ SLA</dt>
                <dd className="text-gray-900">{request.slaNote}</dd>
              </>
            )}

            {request.completedAt && (
              <>
                <dt className="text-gray-500">เสร็จเมื่อ</dt>
                <dd className="text-gray-900">{fmtDate(request.completedAt)}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-400">ยังไม่มีช่างรับงาน</p>
        )}
      </div>

      {request.slaLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">ประวัติ SLA</h2>
          <ol className="space-y-3">
            {request.slaLogs.map((log, i) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {request.slaLogs.length - i}
                </span>
                <div>
                  <p className="text-gray-900 font-medium">{fmtDate(log.deadline)}</p>
                  {log.note && <p className="text-gray-500">{log.note}</p>}
                  <p className="text-xs text-gray-400">บันทึกเมื่อ {fmtDate(log.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {request.status === RequestStatus.DONE && (
        <form action={approveJob}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            อนุมัติส่งงาน
          </button>
        </form>
      )}

      {request.status === RequestStatus.COMPLETED && (
        <div className="bg-green-50 rounded-lg p-5 text-center">
          <p className="text-green-700 font-medium">เสร็จสิ้น</p>
          {request.completedAt && (
            <p className="text-sm text-green-600 mt-1">อนุมัติเมื่อ {fmtDate(request.completedAt)}</p>
          )}
        </div>
      )}
    </main>
  )
}
