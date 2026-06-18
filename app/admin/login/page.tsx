import Link from 'next/link'
import LoginForm from '@/app/ui/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          ← กลับหน้าแรก
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-500 mt-1">สำหรับเจ้าหน้าที่และช่างเท่านั้น</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <LoginForm />
        </div>
      </div>
      </div>
    </main>
  )
}
