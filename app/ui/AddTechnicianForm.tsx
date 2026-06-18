'use client'

import { useActionState } from 'react'
import { addTechnician } from '@/app/actions/admin'

export default function AddTechnicianForm() {
  const [state, action, pending] = useActionState(addTechnician, null)

  return (
    <form action={action} className="space-y-4">
      {state && 'error' in state && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">เพิ่มช่างเรียบร้อยแล้ว</p>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อ-สกุล <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="เช่น สมชาย ใจดี"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสพนักงาน <span className="text-red-500">*</span>
          </label>
          <input
            name="employeeId"
            required
            placeholder="เช่น T001"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'กำลังเพิ่ม...' : 'เพิ่มช่าง'}
          </button>
        </div>
      </div>
    </form>
  )
}
