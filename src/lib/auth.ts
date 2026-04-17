import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { verifyGatewayJWT, GW_COOKIE_NAME } from '@/lib/gateway-jwt'
import type { User } from '@supabase/supabase-js'

export type AuthResult =
  | { success: true; user: User }
  | { success: false; response: NextResponse }

async function getUserFromGatewayJWT(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const gwToken = cookieStore.get(GW_COOKIE_NAME)?.value
    if (!gwToken) return null
    const payload = await verifyGatewayJWT(gwToken)
    if (!payload) return null
    return { id: payload.sub, email: payload.email } as unknown as User
  } catch {
    return null
  }
}

export async function getUser(): Promise<User | null> {
  const gwUser = await getUserFromGatewayJWT()
  if (gwUser) return gwUser

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth(): Promise<AuthResult> {
  const user = await getUser()
  if (user) return { success: true, user }
  return {
    success: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  }
}
