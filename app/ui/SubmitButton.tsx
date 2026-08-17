'use client'

import { useFormStatus } from 'react-dom'
import type { ButtonHTMLAttributes } from 'react'

export default function SubmitButton({
  children,
  pendingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus()

  return (
    <button {...props} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (pendingText ?? children) : children}
    </button>
  )
}
