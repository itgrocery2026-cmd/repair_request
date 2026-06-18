import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/app/lib/session'

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const token = req.cookies.get('session')?.value
  const session = await decrypt(token)

  const isAdmin = session?.role === 'ADMIN'
  const isTech = session?.role === 'TECHNICIAN'

  // ─── /admin/* ───────────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (path === '/admin/login') {
      if (isAdmin) return NextResponse.redirect(new URL('/admin', req.nextUrl))
      return NextResponse.next()
    }
    if (!isAdmin) return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
    return NextResponse.next()
  }

  // ─── /technician/* ──────────────────────────────────────
  if (path.startsWith('/technician')) {
    if (path === '/technician/login') {
      if (isTech) return NextResponse.redirect(new URL('/technician', req.nextUrl))
      return NextResponse.next()
    }
    if (!isTech) return NextResponse.redirect(new URL('/technician/login', req.nextUrl))
    return NextResponse.next()
  }

  // ─── /register ──────────────────────────────────────────
  if (path === '/register') {
    if (isTech) return NextResponse.redirect(new URL('/technician', req.nextUrl))
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'],
}
