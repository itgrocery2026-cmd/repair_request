'use client'

import { resetTechnicianPassword, deleteTechnician } from '@/app/actions/admin'

export default function TechnicianActions({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <form
        action={resetTechnicianPassword}
        onSubmit={(e) => {
          if (!confirm(`รีเซตช่าง "${name}" ให้สมัครใหม่?`)) e.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-xs text-blue-600 hover:underline">
          รีเซต
        </button>
      </form>

      <form
        action={deleteTechnician}
        onSubmit={(e) => {
          if (!confirm(`ลบช่าง "${name}" ออกจากระบบ?`)) e.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-xs text-red-500 hover:underline">
          ลบ
        </button>
      </form>
    </div>
  )
}
