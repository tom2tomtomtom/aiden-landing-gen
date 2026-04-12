'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'admin_api_secret'

const TIER_ORDER = ['guest', 'free', 'single', 'pro', 'agency'] as const

interface CostsByTier {
  count: number
  cost: number
}

interface Aggregate {
  totalCost: number
  count: number
  byTier: Record<string, CostsByTier>
}

interface RecentRow {
  userTier: string
  totalCost: number
  chatCost: number
  briefLength: number
  responseLength: number
  durationMs: number
  createdAt: string
  tokensIn: number
  tokensOut: number
}

interface CostsResponse {
  today: Aggregate
  week: Aggregate
  month: Aggregate
  lifetimeAnalysisCount: number
  budgets: {
    dailyLimit: number
    monthlyLimit: number
    dailyFreeLimit: number
  }
  recent: RecentRow[]
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n)
}

function formatCostTight(n: number): string {
  return n.toFixed(4)
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${ms}ms`
}

function usageBarTone(pct: number): string {
  if (pct < 50) return 'bg-green-500'
  if (pct <= 80) return 'bg-yellow-500'
  return 'bg-red-hot'
}

export default function AdminClient() {
  const [secretInput, setSecretInput] = useState('')
  const [storedSecret, setStoredSecret] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [data, setData] = useState<CostsResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const existing = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
    if (existing) {
      setStoredSecret(existing)
    }
  }, [])

  const fetchCosts = useCallback(async (token: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/admin/costs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY)
        setStoredSecret(null)
        setData(null)
        setLoadError('Session expired or invalid. Enter the admin secret again.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setLoadError(`Request failed (${res.status})`)
        setLoading(false)
        return
      }
      const json = (await res.json()) as CostsResponse
      setData(json)
      setLastUpdated(new Date())
    } catch {
      setLoadError('Network error while loading costs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!storedSecret) return
    void fetchCosts(storedSecret)
  }, [storedSecret, fetchCosts])

  useEffect(() => {
    if (!storedSecret) return
    const id = window.setInterval(() => {
      void fetchCosts(storedSecret)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [storedSecret, fetchCosts])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setUnlockError(null)
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretInput }),
      })
      if (!res.ok) {
        setUnlockError('Invalid secret.')
        return
      }
      sessionStorage.setItem(STORAGE_KEY, secretInput)
      setStoredSecret(secretInput)
      setSecretInput('')
    } catch {
      setUnlockError('Could not verify secret.')
    }
  }

  const manualRefresh = () => {
    if (storedSecret) void fetchCosts(storedSecret)
  }

  const tierRows = useMemo(() => {
    const byTier = data?.month.byTier ?? {}
    return TIER_ORDER.map(tier => {
      const row = byTier[tier] ?? { count: 0, cost: 0 }
      const avg = row.count > 0 ? row.cost / row.count : 0
      return { tier, analyses: row.count, totalCost: row.cost, avgCost: avg }
    })
  }, [data])

  const dailyPct = data
    ? Math.min(100, (data.today.totalCost / Math.max(data.budgets.dailyLimit, 0.0001)) * 100)
    : 0
  const monthlyPct = data
    ? Math.min(100, (data.month.totalCost / Math.max(data.budgets.monthlyLimit, 0.0001)) * 100)
    : 0

  if (!storedSecret) {
    return (
      <main id="main-content" className="min-h-screen bg-black-deep">
        <header className="border-b border-border-subtle bg-black-ink px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg font-bold tracking-tight text-red-hot uppercase hover:text-orange-accent transition-colors">
                AIDEN
              </Link>
              <span className="text-white-dim">·</span>
              <span className="text-sm font-semibold text-white uppercase tracking-wide">Admin</span>
            </div>
            <Link href="/" className="text-xs text-white-muted hover:text-orange-accent transition-colors">
              Home
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="border border-border-subtle bg-black-card p-8">
            <h1 className="text-xl font-semibold text-white uppercase tracking-wide">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-white-muted">Enter the admin API secret to view cost and usage data.</p>
            <form onSubmit={handleUnlock} className="mt-8 space-y-4 max-w-md">
              <label className="block">
                <span className="text-xs font-medium text-white-dim uppercase tracking-wide">Admin secret</span>
                <input
                  type="password"
                  value={secretInput}
                  onChange={e => setSecretInput(e.target.value)}
                  autoComplete="off"
                  className="mt-2 w-full border border-border-subtle bg-black-deep px-3 py-2 text-sm text-white placeholder:text-white-dim focus:border-orange-accent focus:outline-none"
                  placeholder="ADMIN_API_SECRET"
                />
              </label>
              {unlockError && <p className="text-sm text-red-hot">{unlockError}</p>}
              <button
                type="submit"
                className="bg-red-hot px-4 py-2 text-sm font-semibold text-white hover:bg-red-dim transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-black-deep">
      <header className="border-b border-border-subtle bg-black-ink px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-red-hot uppercase hover:text-orange-accent transition-colors">
              AIDEN
            </Link>
            <span className="text-white-dim">·</span>
            <h1 className="text-sm font-semibold text-white uppercase tracking-wide">Admin Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white-muted">
            {lastUpdated && (
              <span>
                Last updated{' '}
                <time dateTime={lastUpdated.toISOString()}>
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(lastUpdated)}
                </time>
              </span>
            )}
            <button
              type="button"
              onClick={manualRefresh}
              disabled={loading}
              className="border border-border-subtle px-3 py-1.5 font-medium text-white hover:border-white disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link href="/" className="hover:text-orange-accent transition-colors">
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        {loadError && (
          <div className="border border-red-hot/40 bg-black-card px-4 py-3 text-sm text-red-hot">{loadError}</div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border-subtle bg-black-card p-5">
                <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Today&apos;s spend</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatMoney(data.today.totalCost)}</p>
              </div>
              <div className="border border-border-subtle bg-black-card p-5">
                <p className="text-xs font-medium text-white-dim uppercase tracking-wide">This week</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatMoney(data.week.totalCost)}</p>
              </div>
              <div className="border border-border-subtle bg-black-card p-5">
                <p className="text-xs font-medium text-white-dim uppercase tracking-wide">This month</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatMoney(data.month.totalCost)}</p>
              </div>
              <div className="border border-border-subtle bg-black-card p-5">
                <p className="text-xs font-medium text-white-dim uppercase tracking-wide">Total analyses</p>
                <p className="mt-1 text-2xl font-bold text-white">{data.lifetimeAnalysisCount}</p>
              </div>
            </div>

            <section className="border border-border-subtle bg-black-card p-6 space-y-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Budget status</h2>
              <div>
                <div className="flex justify-between text-xs text-white-muted">
                  <span>Daily spend vs cap</span>
                  <span>
                    {formatMoney(data.today.totalCost)} / {formatMoney(data.budgets.dailyLimit)} ({dailyPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-black-deep border border-border-subtle">
                  <div
                    className={`h-full transition-all ${usageBarTone(dailyPct)}`}
                    style={{ width: `${dailyPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-white-muted">
                  <span>Monthly spend vs cap</span>
                  <span>
                    {formatMoney(data.month.totalCost)} / {formatMoney(data.budgets.monthlyLimit)} ({monthlyPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-black-deep border border-border-subtle">
                  <div
                    className={`h-full transition-all ${usageBarTone(monthlyPct)}`}
                    style={{ width: `${monthlyPct}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="border border-border-subtle bg-black-card overflow-hidden">
              <div className="border-b border-border-subtle px-6 py-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Usage by tier (this month)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-white-dim">
                      <th className="px-6 py-3 font-medium">Tier</th>
                      <th className="px-6 py-3 font-medium">Analyses</th>
                      <th className="px-6 py-3 font-medium">Total cost</th>
                      <th className="px-6 py-3 font-medium">Avg / analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierRows.map(row => (
                      <tr key={row.tier} className="border-b border-border-subtle/60 text-white-muted last:border-0">
                        <td className="px-6 py-3 font-medium text-white capitalize">{row.tier}</td>
                        <td className="px-6 py-3">{row.analyses}</td>
                        <td className="px-6 py-3">${formatCostTight(row.totalCost)}</td>
                        <td className="px-6 py-3">${formatCostTight(row.avgCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-border-subtle bg-black-card overflow-hidden">
              <div className="border-b border-border-subtle px-6 py-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Recent analyses</h2>
                <p className="mt-1 text-xs text-white-dim">Last {data.recent.length} API calls</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-white-dim">
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
                      <th className="px-4 py-3 font-medium">Tier</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Tokens (in / out)</th>
                      <th className="px-4 py-3 font-medium">Cost</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r, i) => (
                      <tr key={`${r.createdAt}-${i}`} className="border-b border-border-subtle/60 text-white-muted last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap text-white">{formatWhen(r.createdAt)}</td>
                        <td className="px-4 py-3 capitalize text-white">{r.userTier}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                          {r.tokensIn.toLocaleString()} / {r.tokensOut.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">${formatCostTight(Number(r.totalCost))}</td>
                        <td className="px-4 py-3">{formatDuration(r.durationMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!data && !loadError && storedSecret && (
          <p className="text-sm text-white-muted">{loading ? 'Loading cost data…' : 'No data yet.'}</p>
        )}
      </div>
    </main>
  )
}
