'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { BriefAnalysis } from '@/types/brief'
import { generateAnalysisPDF } from '@/lib/generate-pdf'

interface GenerationRecord {
  id: string
  input_data: {
    productName?: string
    productDescription?: string
    briefText?: string
    brandName?: string
  }
  /** Brief analysis payload or legacy landing-page shape. */
  output_copy: unknown
  created_at: string
}

function isStoredBriefAnalysis(o: unknown): o is BriefAnalysis {
  if (!o || typeof o !== 'object') return false
  const r = o as Record<string, unknown>
  return typeof r.score === 'number' && Array.isArray(r.gaps)
}

function DashboardHistoryRow({
  gen,
  brandName,
  briefSnippet,
  score,
  gapsCount,
  analysis,
  isPaidPlan,
}: {
  gen: GenerationRecord
  brandName?: string
  briefSnippet: string
  score: number | null
  gapsCount: number | null
  analysis: BriefAnalysis | null
  isPaidPlan: boolean
}) {
  const briefSource = gen.input_data?.briefText ?? ''
  const onPdf = useCallback(() => {
    if (!analysis) return
    generateAnalysisPDF(analysis, briefSource)
  }, [analysis, briefSource])

  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        {brandName && (
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-accent mb-0.5">{brandName}</p>
        )}
        <p className="text-sm font-medium text-white line-clamp-2">
          {briefSnippet}
          {briefSource.length > 100 ? '…' : ''}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-white-dim">
          {score !== null && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-orange-accent">Score:</span>
              {score}
            </span>
          )}
          {gapsCount !== null && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-amber-500">Gaps:</span>
              {gapsCount}
            </span>
          )}
          <span>
            {new Date(gen.created_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isPaidPlan && analysis && (
          <button
            type="button"
            onClick={onPdf}
            title="Download analysis as PDF"
            className="border border-border-subtle bg-black-card px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white-muted hover:bg-black-deep hover:text-white transition-colors"
          >
            PDF
          </button>
        )}
        <Link
          href={`/preview/${gen.id}`}
          className="border border-border-subtle px-3 py-1.5 text-xs font-medium text-white-muted hover:text-white hover:border-white transition-colors"
        >
          View
        </Link>
      </div>
    </li>
  )
}

export default function DashboardSearch({
  generations,
  isPaidPlan = false,
}: {
  generations: GenerationRecord[]
  /** Paid (non-free) plans can export stored analyses as PDF. */
  isPaidPlan?: boolean
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')

  const filtered = useMemo(() => {
    let result = generations
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(g => {
        const text = (g.input_data?.briefText ?? g.input_data?.productDescription ?? g.input_data?.brandName ?? '').toLowerCase()
        return text.includes(q)
      })
    }
    if (sortBy === 'score') {
      result = [...result].sort((a, b) => {
        const oc = (x: GenerationRecord) =>
          isStoredBriefAnalysis(x.output_copy) ? x.output_copy.score : (x.output_copy as { briefScore?: number; score?: number } | null)?.briefScore ?? (x.output_copy as { score?: number } | null)?.score ?? 0
        return oc(b) - oc(a)
      })
    }
    return result
  }, [generations, query, sortBy])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search briefs..."
            className="w-full border border-border-subtle bg-black-deep pl-9 pr-3 py-2 text-sm text-white placeholder-white-dim outline-none focus:border-red-hot"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'date' | 'score')}
          className="border border-border-subtle bg-black-deep px-3 py-2 text-xs text-white-muted outline-none focus:border-red-hot"
        >
          <option value="date">Newest first</option>
          <option value="score">Highest score</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-white-dim py-4">No matching briefs found.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {filtered.map((gen) => {
            const briefSnippet = (
              gen.input_data?.briefText ??
              gen.input_data?.productDescription ??
              gen.input_data?.productName ??
              'Untitled brief'
            ).slice(0, 100)
            const brandName = gen.input_data?.brandName
            const analysis = isStoredBriefAnalysis(gen.output_copy) ? gen.output_copy : null
            const legacy = gen.output_copy as { briefScore?: number; score?: number; gaps?: string[] } | null
            const score = analysis?.score ?? legacy?.briefScore ?? legacy?.score ?? null
            const gapsCount = analysis?.gaps?.length ?? legacy?.gaps?.length ?? null

            return (
              <DashboardHistoryRow
                key={gen.id}
                gen={gen}
                brandName={brandName}
                briefSnippet={briefSnippet}
                score={score}
                gapsCount={gapsCount}
                analysis={analysis}
                isPaidPlan={isPaidPlan}
              />
            )
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-white-dim">
        {filtered.length} of {generations.length} {generations.length === 1 ? 'analysis' : 'analyses'}
      </p>
    </div>
  )
}
