import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 300 // 5 minutes

export interface StatsResponse {
  briefCount: number
  avgScore: number
  gapCount: number
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [countResult, scoreResult, gapResult] = await Promise.all([
      supabase.from('generations').select('*', { count: 'exact', head: true }),
      supabase.rpc('get_avg_brief_score'),
      supabase.rpc('get_total_gaps_found'),
    ])

    // Fallback: if RPCs don't exist, use JS-side aggregation from a limited sample
    let avgScore = 72
    let gapCount = 0

    if (scoreResult.error || gapResult.error) {
      // Fetch recent generations and aggregate client-side
      const { data: rows } = await supabase
        .from('generations')
        .select('output_copy')
        .not('output_copy', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500)

      if (rows && rows.length > 0) {
        const scores = rows
          .map((r) => {
            const score = r.output_copy?.score
            return typeof score === 'number' ? score : null
          })
          .filter((s): s is number => s !== null)

        if (scores.length > 0) {
          avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }

        gapCount = rows.reduce((sum, r) => {
          const gaps = r.output_copy?.gaps
          return sum + (Array.isArray(gaps) ? gaps.length : 0)
        }, 0)
      }
    } else {
      avgScore = Math.round(scoreResult.data ?? 72)
      gapCount = gapResult.data ?? 0
    }

    const briefCount = countResult.count ?? 0

    return NextResponse.json(
      { briefCount, avgScore, gapCount } satisfies StatsResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch {
    // Return sensible fallback rather than erroring the page
    return NextResponse.json(
      { briefCount: 0, avgScore: 72, gapCount: 0 } satisfies StatsResponse,
      { status: 200 }
    )
  }
}
