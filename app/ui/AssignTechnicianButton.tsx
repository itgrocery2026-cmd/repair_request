'use client'

import { useRef } from 'react'
import { assignTechnician } from '@/app/actions/admin'

type Technician = { id: string; name: string; employeeId: string | null }

export default function AssignTechnicianButton({
  requestId,
  technicians,
  alreadyAssignedIds,
}: {
  requestId: string
  technicians: Technician[]
  alreadyAssignedIds: string[]
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const available = technicians.filter((t) => !alreadyAssignedIds.includes(t.id))

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition-colors"
      >
        มอบหมาย
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-xl shadow-lg p-0 backdrop:bg-black/40 w-full max-w-sm"
      >
        <form
          action={assignTechnician}
          onSubmit={() => dialogRef.current?.close()}
          className="p-5 space-y-4"
        >
          <h3 className="font-semibold text-gray-900 text-sm">มอบหมายช่าง</h3>
          <input type="hidden" name="requestId" value={requestId} />

          {available.length === 0 ? (
            <p className="text-sm text-gray-400">ไม่มีช่างที่ลงทะเบียนแล้วให้เลือกเพิ่ม</p>
          ) : (
            <select
              name="userId"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- เลือกช่าง --</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.employeeId ? ` (${t.employeeId})` : ''}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              ยกเลิก
            </button>
            {available.length > 0 && (
              <button
                type="submit"
                className="text-xs text-white bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-full transition-colors"
              >
                ยืนยัน
              </button>
            )}
          </div>
        </form>
      </dialog>
    </>
  )
}
