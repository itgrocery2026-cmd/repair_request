'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'

const pendingCountSchema = z.object({ count: z.number() })

export default function PendingCountAlert({
  endpoint,
  messageTemplate,
}: {
  endpoint: string
  /** Use "{count}" as a placeholder for the number, e.g. "มีงานใหม่ {count} งาน" */
  messageTemplate: string
}) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const result = pendingCountSchema.safeParse(json)
        if (result.success && result.data.count > 0) setCount(result.data.count)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [endpoint])

  if (!count) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-blue-700 font-medium">
        {messageTemplate.replace('{count}', String(count))}
      </p>
      <button
        onClick={() => setCount(null)}
        aria-label="ปิด"
        className="text-blue-400 hover:text-blue-700 shrink-0 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
