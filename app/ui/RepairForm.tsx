'use client'

import { useActionState, useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createRepairRequest } from '@/app/actions/repair'
import type { Branch } from '@/app/generated/prisma/client'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

const MAX_WIDTH = 1280
const QUALITY = 0.75

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_WIDTH / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        QUALITY
      )
    }
    img.src = url
  })
}

export default function RepairForm({ branches }: { branches: Branch[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createRepairRequest, null)
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state && 'success' in state) router.refresh()
  }, [state, router])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const compressed = await Promise.all(Array.from(files).map(compressImage))

    const urls = compressed.map((f) => URL.createObjectURL(f))
    setPreviews(urls)

    const dt = new DataTransfer()
    compressed.forEach((f) => dt.items.add(f))
    if (fileInputRef.current) fileInputRef.current.files = dt.files
  }, [])

  if (state && 'success' in state) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-gray-900">ส่งคำขอเรียบร้อยแล้ว</p>
        <p className="text-gray-400 mt-2 text-sm">ทีมช่างจะดำเนินการโดยเร็วที่สุด</p>
        <button
          onClick={() => { setPreviews([]); window.location.reload() }}
          className="mt-6 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          แจ้งซ่อมอีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
      {state && 'error' in state && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          สาขา <span className="text-red-500">*</span>
        </label>
        <select name="branchId" required className={inputClass}>
          <option value="">-- เลือกสาขา --</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          จุดที่เสีย <span className="text-red-500">*</span>
        </label>
        <input
          name="location"
          required
          placeholder="เช่น ชั้น 2 ห้องน้ำหญิง"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          รายละเอียดปัญหา <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="อธิบายปัญหาที่พบ"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          ชื่อผู้แจ้ง <span className="text-red-500">*</span>
        </label>
        <input
          name="reporterName"
          required
          placeholder="ชื่อ-แผนก"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          รูปภาพประกอบ
        </label>
        <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-500">คลิกเพื่อเลือกรูป</span>
          <span className="text-xs text-gray-400 mt-1">JPG, PNG ได้สูงสุด 5 รูป (ไม่บังคับส่ง)</span>
          <input
            ref={fileInputRef}
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {pending ? 'กำลังส่ง...' : 'ส่งคำขอแจ้งซ่อม'}
      </button>
    </form>
  )
}
