import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from '@/lib/admin-session'
import AdminClient from './AdminClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'API cost and usage monitoring.',
}

export default function AdminPage() {
  const adminSecret = process.env.ADMIN_API_SECRET
  if (!adminSecret) {
    redirect('/')
  }

  const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)?.value
  if (sessionCookie !== undefined && !verifyAdminSessionCookie(sessionCookie, adminSecret)) {
    redirect('/')
  }

  return <AdminClient />
}
