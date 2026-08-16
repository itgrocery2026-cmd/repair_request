import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { RequestStatus } from '@/app/generated/prisma/client'
import { fmtDate } from '@/app/lib/fmt'

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'รอช่างรับ',
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

export default async function PublicRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const request = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      branch: true,
      assignedTo: { select: { name: true } },
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          ← กลับหน้าแรก
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
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

        <div className="bg-white rounded-xl shadow-sm p-6">
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

            {request.assignedTo && (
              <>
                <dt className="text-gray-500">ช่างผู้รับงาน</dt>
                <dd className="text-gray-900">{request.assignedTo.name}</dd>
              </>
            )}

            {request.slaDeadline && (
              <>
                <dt className="text-gray-500">กำหนดเสร็จ</dt>
                <dd className={`font-medium ${slaExpired ? 'text-red-600' : slaNear ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {fmtDate(request.slaDeadline)}
                </dd>
              </>
            )}

            {request.completedAt && (
              <>
                <dt className="text-gray-500">เสร็จเมื่อ</dt>
                <dd className="text-gray-900">{fmtDate(request.completedAt)}</dd>
              </>
            )}
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
      </main>
    </div>
  )
}
