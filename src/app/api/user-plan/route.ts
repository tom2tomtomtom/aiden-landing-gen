import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits } from '@/lib/usage'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const planLimits = await getPlanLimits(adminSupabase, user.id)

  return NextResponse.json({
    plan: planLimits.plan,
    used: planLimits.used,
    limit: planLimits.limit,
    resetType: planLimits.resetType,
  })
}
