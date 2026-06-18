'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'
import { createSession, deleteSession } from '@/app/lib/session'
import { Role } from '@/app/generated/prisma/client'

type State = { error: string } | null

// ─── Admin ───────────────────────────────────────────────

export async function login(prevState: State, formData: FormData): Promise<State> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'กรุณากรอกข้อมูลให้ครบ' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, role: true },
  })

  if (!user || !user.password || user.role !== Role.ADMIN) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  if (!await bcrypt.compare(password, user.password)) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  await createSession(user.id, user.role)
  redirect('/admin')
}

export async function logout() {
  await deleteSession()
  redirect('/admin/login')
}

// ─── Technician ───────────────────────────────────────────

export async function techLogin(prevState: State, formData: FormData): Promise<State> {
  const employeeId = (formData.get('employeeId') as string).trim()
  const password = formData.get('password') as string

  if (!employeeId || !password) return { error: 'กรุณากรอกข้อมูลให้ครบ' }

  const user = await prisma.user.findUnique({
    where: { employeeId },
    select: { id: true, password: true, role: true, isActive: true },
  })

  if (!user || !user.password || user.role !== Role.TECHNICIAN || !user.isActive) {
    return { error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }
  }

  if (!await bcrypt.compare(password, user.password)) {
    return { error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง' }
  }

  await createSession(user.id, user.role)
  redirect('/technician')
}

export async function techLogout() {
  await deleteSession()
  redirect('/technician/login')
}

// ─── Register ─────────────────────────────────────────────

export async function register(prevState: State, formData: FormData): Promise<State> {
  const employeeId = (formData.get('employeeId') as string).trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!employeeId || !password || !confirmPassword) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ' }
  }

  if (password !== confirmPassword) {
    return { error: 'รหัสผ่านไม่ตรงกัน' }
  }

  if (password.length < 6) {
    return { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
  }

  const user = await prisma.user.findUnique({
    where: { employeeId },
    select: { id: true, isActive: true, role: true },
  })

  if (!user || user.role !== Role.TECHNICIAN) {
    return { error: 'ไม่พบรหัสพนักงานนี้ในระบบ' }
  }

  if (user.isActive) {
    return { error: 'รหัสพนักงานนี้ลงทะเบียนไปแล้ว' }
  }

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { employeeId },
    data: { password: hashed, isActive: true },
  })

  redirect('/technician/login')
}
