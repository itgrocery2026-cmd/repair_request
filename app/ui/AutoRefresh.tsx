'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const INTERVAL_MS = 30_000

export default function AutoRefresh() {
  const router = useRouter()
  const prevCount = useRef<number | null>(null)
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/tech/pending-count')
        if (!res.ok) return
        const { count } = await res.json()
        if (prevCount.current !== null && count > prevCount.current) {
          setHasNew(true)
          router.refresh()
        }
        prevCount.current = count
      } catch {}
    }

    check()
    const id = setInterval(check, INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  if (!hasNew) return null

  return (
    <button
      onClick={() => setHasNew(false)}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      มีงานใหม่เข้ามา — แตะเพื่อปิด
    </button>
  )
}
