import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/gateway-tokens'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const balance = await getBalance(user.id)

  if (!balance) {
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    plan: balance.plan,
    balance: balance.balance,
    lifetimePurchased: balance.lifetime_purchased,
    lifetimeUsed: balance.lifetime_used,
  })
}
