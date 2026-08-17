'use client'

import { useRef, useState } from 'react'

type Img = { id: string; url: string; label: string | null }

export default function ImageCarousel({ images }: { images: Img[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  if (images.length === 0) return null

  const scrollToIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, i))
    const el = scrollerRef.current?.children[clamped] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const children = Array.from(scroller.children) as HTMLElement[]
    const center = scroller.scrollLeft + scroller.clientWidth / 2
    let closest = 0
    let closestDist = Infinity
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft + child.clientWidth / 2 - center)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setIndex(closest)
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-lg"
        >
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.label ?? ''} className="w-full aspect-square object-cover" />
            </a>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(index - 1)}
              aria-label="รูปก่อนหน้า"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(index + 1)}
              aria-label="รูปถัดไป"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-gray-700 font-medium">{images[index].label ?? 'รูปภาพ'}</span>
        {images.length > 1 && (
          <span className="text-gray-400 text-xs shrink-0">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  )
}
