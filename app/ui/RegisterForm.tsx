'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสพนักงาน</label>
        <input
          name="employeeId"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
        <input
          name="password"
          type="password"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
        <input
          name="confirmPassword"
          type="password"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
      </button>

      <p className="text-center text-sm text-gray-500">
        มีบัญชีแล้ว?{' '}
        <Link href="/technician/login" className="text-blue-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  )
}
