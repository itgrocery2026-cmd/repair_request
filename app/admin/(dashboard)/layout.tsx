import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors">
            ← หน้าแรก
          </Link>
          <span className="text-gray-200">|</span>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold text-gray-900 hover:text-blue-600">
              ใบแจ้งงาน
            </Link>
            <Link href="/admin/review" className="text-gray-500 hover:text-gray-700">
              ตรวจงาน
            </Link>
            <Link href="/admin/technicians" className="text-gray-500 hover:text-gray-700">
              จัดการช่าง
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            ออกจากระบบ
          </button>
        </form>
      </header>
      {children}
    </div>
  )
}
