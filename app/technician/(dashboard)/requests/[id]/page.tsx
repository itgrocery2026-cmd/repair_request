import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifyTechnician } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import { claimJob, markDone, extendSla } from '@/app/actions/technician'
import { RequestStatus } from '@/app/generated/prisma/client'
import { fmtDate } from '@/app/lib/fmt'
import ImageCarousel from '@/app/ui/ImageCarousel'
import SubmitButton from '@/app/ui/SubmitButton'

export default async function TechRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifyTechnician()
  const { id } = await params

  const request = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      branch: true,
      slaLogs: { orderBy: { createdAt: 'desc' } },
      assignedTo: { select: { name: true } },
      images: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!request) notFound()

  const isPending = request.status === RequestStatus.PENDING
  const isMyJob = request.assignedToId === session.userId
  const isInProgress = request.status === RequestStatus.IN_PROGRESS && isMyJob
  const isDone = request.status === RequestStatus.DONE

  const slaExpired = request.slaDeadline && !isDone && request.slaDeadline < new Date()
  const slaNear =
    request.slaDeadline &&
    !isDone &&
    !slaExpired &&
    request.slaDeadline.getTime() - Date.now() < 24 * 60 * 60 * 1000


  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/technician" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-700 font-medium">รายละเอียดงาน</span>
      </div>

      <div className="flex gap-2">
        {slaExpired && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-red-100 text-red-600">เกิน SLA</span>
        )}
        {slaNear && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-600">ใกล้หมด SLA</span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลงาน</h2>
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
              <dt className="text-gray-500">ช่างรับงาน</dt>
              <dd className="text-gray-900">{request.assignedTo.name}</dd>
            </>
          )}
        </dl>

        {request.images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">รูปภาพประกอบ</p>
            <ImageCarousel images={request.images} />
          </div>
        )}
      </div>

      {isPending && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">รับงานนี้</h2>
          <form action={claimJob} className="space-y-4">
            <input type="hidden" name="requestId" value={id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                กำหนดวันเสร็จ <span className="text-red-500">*</span>
              </label>
              <input
                name="slaDeadline"
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (เช่น รอหาอะไหล่)</label>
              <input
                name="slaNote"
                placeholder="ไม่บังคับ"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">แนบรูปภาพ (ไม่บังคับ)</label>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
            </div>
            <SubmitButton
              pendingText="กำลังบันทึก..."
              className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              รับงานนี้
            </SubmitButton>
          </form>
        </div>
      )}

      {isInProgress && (
        <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">สถานะงาน</h2>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-gray-500">รับงานเมื่อ</dt>
            <dd className="text-gray-900">{fmtDate(request.assignedAt)}</dd>
          </dl>

          {request.slaLogs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">ประวัติ SLA</p>
              <ol className="space-y-3">
                {request.slaLogs.map((log, i) => {
                  const isLatest = i === 0
                  return (
                    <li key={log.id} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {request.slaLogs.length - i}
                      </span>
                      <div className="flex-1 min-w-0">
                        {isLatest ? (
                          <details>
                            <summary className="flex items-center justify-between gap-2 list-none cursor-pointer">
                              <p className={`font-medium ${slaExpired ? 'text-red-600' : slaNear ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {fmtDate(log.deadline)}
                              </p>
                              <span className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-full shrink-0 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                แก้ไข SLA
                              </span>
                            </summary>
                            <form action={extendSla} className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                              <input type="hidden" name="requestId" value={id} />
                              <input
                                name="slaDeadline"
                                type="datetime-local"
                                required
className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                name="slaNote"
                                required
                                placeholder="เหตุผล (เช่น รออะไหล่)"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                name="images"
                                type="file"
                                accept="image/*"
                                multiple
                                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                              />
                              <SubmitButton
                                pendingText="กำลังบันทึก..."
                                className="w-full bg-yellow-500 text-white py-2 rounded-md text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                บันทึก
                              </SubmitButton>
                            </form>
                          </details>
                        ) : (
                          <p className="font-medium text-gray-900">{fmtDate(log.deadline)}</p>
                        )}
                        {log.note && <p className="text-gray-500 mt-0.5">{log.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">บันทึกเมื่อ {fmtDate(log.createdAt)}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          <form action={markDone} className="space-y-3">
            <input type="hidden" name="requestId" value={id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">แนบรูปภาพหน้างานเสร็จ (ไม่บังคับ)</label>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-600 hover:file:bg-green-100"
              />
            </div>
            <SubmitButton
              pendingText="กำลังส่ง..."
              className="w-full bg-green-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ส่งงาน
            </SubmitButton>
          </form>
        </div>
      )}

      {!isPending && !isMyJob && (
        <p className="text-sm text-center text-gray-400 py-4">งานนี้ถูกรับโดยช่างท่านอื่นแล้ว</p>
      )}

      {isDone && isMyJob && (
        <div className="bg-green-50 rounded-lg p-5 text-center">
          <p className="text-green-700 font-medium">งานเสร็จเรียบร้อย</p>
          <p className="text-sm text-green-600 mt-1">เสร็จเมื่อ {fmtDate(request.completedAt)}</p>
        </div>
      )}
    </main>
  )
}
