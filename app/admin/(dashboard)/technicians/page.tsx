import { verifyAdmin } from '@/app/lib/dal'
import { prisma } from '@/app/lib/prisma'
import AddTechnicianForm from '@/app/ui/AddTechnicianForm'
import TechnicianActions from '@/app/ui/TechnicianActions'

export default async function TechniciansPage() {
  await verifyAdmin()

  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      employeeId: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedRequests: true } },
    },
  })

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">เพิ่มช่างใหม่</h2>
        <AddTechnicianForm />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            รายชื่อช่างทั้งหมด
            <span className="ml-2 text-sm font-normal text-gray-500">({technicians.length} คน)</span>
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-6 py-3 font-medium">ชื่อ-สกุล</th>
              <th className="px-6 py-3 font-medium">รหัสพนักงาน</th>
              <th className="px-6 py-3 font-medium">สถานะ</th>
              <th className="px-6 py-3 font-medium">งานทั้งหมด</th>
              <th className="px-6 py-3 font-medium">เพิ่มเมื่อ</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {technicians.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  ยังไม่มีช่างในระบบ
                </td>
              </tr>
            )}
            {technicians.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-3 text-gray-600 font-mono">{t.employeeId}</td>
                <td className="px-6 py-3">
                  {t.isActive ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      ลงทะเบียนแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      ยังไม่ลงทะเบียน
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-gray-600">{t._count.assignedRequests} งาน</td>
                <td className="px-6 py-3 text-gray-400">
                  {t.createdAt.toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                </td>
                <td className="px-6 py-3">
                  <TechnicianActions id={t.id} name={t.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
