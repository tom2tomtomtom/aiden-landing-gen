import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanLimits } from '@/lib/usage'
import { redirect } from 'next/navigation'

interface GenerationRecord {
  id: string
  input_data: {
    productName?: string
    productDescription?: string
    template?: string
    targetAudience?: string
    tone?: string
  }
  output_copy: {
    headline?: string
    subheadline?: string
  }
  template_id: string | null
  created_at: string
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()
  const [{ data: generations }, planLimits] = await Promise.all([
    adminSupabase
      .from('generations')
      .select('id, input_data, output_copy, template_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    getPlanLimits(adminSupabase, user.id),
  ])

  const planLabel = planLimits.plan.charAt(0).toUpperCase() + planLimits.plan.slice(1)
  const isLimitReached = planLimits.limit !== null && planLimits.used >= planLimits.limit
  const isNearingLimit =
    !isLimitReached &&
    planLimits.plan === 'free' &&
    planLimits.limit !== null &&
    planLimits.used >= 2

  async function signOut() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            AIDEN Dashboard
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Limit reached banner */}
        {isLimitReached && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-red-800">
              You have reached your free limit this month. Upgrade to keep generating.
            </p>
            <a
              href="/pricing"
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Upgrade now
            </a>
          </div>
        )}

        {/* User card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <span className="text-lg font-semibold text-indigo-700">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {planLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500">Authenticated via magic link</p>
            </div>
          </div>

          {/* Usage counter */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Generations this month
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {planLimits.limit === null
                ? 'Unlimited'
                : `${planLimits.used} of ${planLimits.limit}`}
            </p>
            {planLimits.limit !== null && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isLimitReached ? 'bg-red-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min((planLimits.used / planLimits.limit) * 100, 100)}%` }}
                />
              </div>
            )}
            {isNearingLimit && (
              <p className="mt-3 text-sm text-amber-700">
                Running low?{' '}
                <a href="/pricing" className="font-medium underline hover:text-amber-800">
                  Upgrade for unlimited generations
                </a>
              </p>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="Landing Page Generator"
              description="Create AI-powered landing page copy for your product."
              href="/generate"
            />
          </div>
        </div>

        {/* Past generations */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Past Generations</h2>

          {!generations || generations.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No generations yet.{' '}
              <a href="/generate" className="text-indigo-600 hover:underline">
                Create your first landing page
              </a>

              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {(generations as GenerationRecord[]).map((gen) => (
                <li key={gen.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {gen.input_data?.productName ?? 'Untitled'}
                    </p>
                    {gen.output_copy?.headline && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {gen.output_copy.headline}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(gen.created_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      {gen.template_id && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">
                          {gen.template_id}
                        </span>
                      )}
                    </p>
                  </div>
                  <a
                    href="/generate"
                    className="shrink-0 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    Regenerate
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-gray-200 p-5 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
        {title}
      </h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </a>
  )
}
