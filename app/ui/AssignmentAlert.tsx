'use client'

import { useEffect, useRef } from 'react'
import { acknowledgeAssignment } from '@/app/actions/technician'

type PendingAssignment = {
  requestId: string
  branchName: string
  location: string
}

export default function AssignmentAlert({ assignments }: { assignments: PendingAssignment[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (assignments.length > 0) dialogRef.current?.showModal()
  }, [assignments.length])

  if (assignments.length === 0) return null

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-lg p-0 backdrop:bg-black/40 w-full max-w-sm"
    >
      <div className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">คุณได้รับมอบหมายงานใหม่</h3>
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li key={a.requestId} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.location}</p>
                <p className="text-xs text-gray-400">{a.branchName}</p>
              </div>
              <form action={acknowledgeAssignment} className="shrink-0">
                <input type="hidden" name="requestId" value={a.requestId} />
                <button
                  type="submit"
                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full transition-colors"
                >
                  ตกลง
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
