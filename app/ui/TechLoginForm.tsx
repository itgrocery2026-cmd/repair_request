'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { techLogin } from '@/app/actions/auth'

export default function TechLoginForm() {
  const [state, action, pending] = useActionState(techLogin, null)

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
          autoComplete="username"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      <p className="text-center text-sm text-gray-500">
        ยังไม่มีบัญชี?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          ลงทะเบียน
        </Link>
      </p>
    </form>
  )
}
