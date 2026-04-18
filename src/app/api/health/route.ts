import { NextResponse } from 'next/server'

// Minimal public health endpoint. Consumed by Railway healthcheck + any
// uptime monitor. Intentionally does NOT probe Supabase / AIDEN API /
// Gateway and does NOT return git SHA, version, service name, timestamp,
// or dependency state. Those enable fingerprinting with no operational
// benefit (Railway + monitors only care about the 200). Detailed service
// state lives in Railway logs and Sentry.
export async function GET() {
  return NextResponse.json({ ok: true })
}
