import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, adminSessionToken } from '@/lib/admin-session'

const ADMIN_SECRET = process.env.ADMIN_API_SECRET ?? ''

export async function POST(request: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { secret?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (body.secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionToken(ADMIN_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
