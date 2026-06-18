'use client'

import { deleteRequest } from '@/app/actions/admin'

export default function DeleteRequestButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRequest}
      onSubmit={(e) => {
        if (!confirm('ลบใบแจ้งงานนี้?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-full transition-colors">
        ลบ
      </button>
    </form>
  )
}
