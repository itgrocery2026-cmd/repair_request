import RegisterForm from '@/app/ui/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">ลงทะเบียนช่าง</h1>
          <p className="text-sm text-gray-500 mt-1">ใช้รหัสพนักงานที่ได้รับจากผู้ดูแลระบบ</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
