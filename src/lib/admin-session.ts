import { createHmac, timingSafeEqual } from 'crypto'

export const ADMIN_SESSION_COOKIE = 'admin_session'

export function adminSessionToken(adminSecret: string): string {
  return createHmac('sha256', adminSecret).update('brief-sharpener-admin-v1').digest('hex')
}

export function verifyAdminSessionCookie(cookieValue: string | undefined, adminSecret: string): boolean {
  if (!cookieValue || !adminSecret) return false
  const expected = adminSessionToken(adminSecret)
  if (cookieValue.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(cookieValue, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}
