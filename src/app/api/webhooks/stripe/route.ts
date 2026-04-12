import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

class WebhookBadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookBadRequestError'
  }
}

function logWebhook(
  level: 'error' | 'warn' | 'info',
  payload: {
    message: string
    event_id?: string | null
    event_type?: string | null
    extra?: Record<string, unknown>
  }
) {
  const line = JSON.stringify({
    source: 'stripe_webhook',
    level,
    ...payload,
    timestamp: new Date().toISOString(),
  })
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    logWebhook('warn', {
      message: 'missing_stripe_signature_header',
      event_id: null,
      event_type: null,
    })
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    logWebhook('error', {
      message: 'webhook_signature_verification_failed',
      event_id: null,
      event_type: null,
      extra: { error: err instanceof Error ? err.message : String(err) },
    })
    Sentry.captureException(err, {
      tags: { stripe_event: 'signature_verification', event_id: 'n/a' },
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existingEvent, error: existingError } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existingError) {
    logWebhook('error', {
      message: 'idempotency_lookup_failed',
      event_id: event.id,
      event_type: event.type,
      extra: { error: existingError.message },
    })
    Sentry.captureException(new Error(existingError.message), {
      tags: { stripe_event: event.type, event_id: event.id },
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (existingEvent) {
    logWebhook('info', {
      message: 'duplicate_event_skipped',
      event_id: event.id,
      event_type: event.type,
    })
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        try {
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutCompleted(supabase, session, {
            event_id: event.id,
            event_type: event.type,
          })
        } catch (error) {
          if (!(error instanceof WebhookBadRequestError)) {
            Sentry.captureException(error, {
              tags: { stripe_event: event.type, event_id: event.id },
            })
          }
          throw error
        }
        break
      }

      case 'customer.subscription.updated': {
        try {
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionUpdated(supabase, subscription, {
            event_id: event.id,
            event_type: event.type,
          })
        } catch (error) {
          if (!(error instanceof WebhookBadRequestError)) {
            Sentry.captureException(error, {
              tags: { stripe_event: event.type, event_id: event.id },
            })
          }
          throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        try {
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionDeleted(supabase, subscription, {
            event_id: event.id,
            event_type: event.type,
          })
        } catch (error) {
          if (!(error instanceof WebhookBadRequestError)) {
            Sentry.captureException(error, {
              tags: { stripe_event: event.type, event_id: event.id },
            })
          }
          throw error
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }

    const { error: insertError } = await supabase.from('webhook_events').insert({
      id: event.id,
      event_type: event.type,
    })

    if (insertError) {
      // Concurrent delivery may insert first; treat duplicate as success.
      if (insertError.code !== '23505') {
        logWebhook('error', {
          message: 'webhook_event_insert_failed',
          event_id: event.id,
          event_type: event.type,
          extra: { code: insertError.code, message: insertError.message },
        })
        Sentry.captureException(new Error(insertError.message), {
          tags: { stripe_event: event.type, event_id: event.id },
        })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  } catch (err) {
    if (err instanceof WebhookBadRequestError) {
      logWebhook('warn', {
        message: err.message,
        event_id: event.id,
        event_type: event.type,
      })
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    logWebhook('error', {
      message: 'error_handling_stripe_event',
      event_id: event.id,
      event_type: event.type,
      extra: { error: err instanceof Error ? err.message : String(err) },
    })
    // Sentry is reported in per-case catch blocks for handler failures.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

type WebhookEventContext = { event_id: string; event_type: string }

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  ctx: WebhookEventContext
) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan as 'single' | 'pro' | 'agency' | undefined

  if (!userId || !plan) {
    logWebhook('warn', {
      message: 'missing_userId_or_plan_in_checkout_metadata',
      event_id: ctx.event_id,
      event_type: ctx.event_type,
      extra: { session_id: session.id },
    })
    throw new WebhookBadRequestError('Missing userId or plan in checkout session metadata')
  }

  const customerId = session.customer as string

  if (session.mode === 'payment') {
    // One-time payment (Single plan)
    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: 'single',
        stripe_customer_id: customerId,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      logWebhook('error', {
        message: 'checkout_completed_upsert_failed',
        event_id: ctx.event_id,
        event_type: ctx.event_type,
        extra: { session_id: session.id, db_message: error.message },
      })
      throw new Error(error.message)
    }
  } else if (session.mode === 'subscription') {
    // Subscription (Pro or Agency plan) — full details come via customer.subscription.updated
    const subscriptionId = session.subscription as string
    const subscription = (await stripe.subscriptions.retrieve(
      subscriptionId
    )) as Stripe.Subscription

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: subscription.items.data[0]?.price.id ?? null,
        status: subscription.status,
        current_period_end: (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      logWebhook('error', {
        message: 'checkout_completed_subscription_upsert_failed',
        event_id: ctx.event_id,
        event_type: ctx.event_type,
        extra: { session_id: session.id, db_message: error.message },
      })
      throw new Error(error.message)
    }
  }
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  ctx: WebhookEventContext
) {
  const customerId = subscription.customer as string

  if (!customerId) {
    logWebhook('warn', {
      message: 'missing_stripe_customer_on_subscription',
      event_id: ctx.event_id,
      event_type: ctx.event_type,
      extra: { subscription_id: subscription.id },
    })
    throw new WebhookBadRequestError('Missing customer on subscription')
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      current_period_end: (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    logWebhook('error', {
      message: 'subscription_updated_failed',
      event_id: ctx.event_id,
      event_type: ctx.event_type,
      extra: { subscription_id: subscription.id, db_message: error.message },
    })
    throw new Error(error.message)
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  ctx: WebhookEventContext
) {
  const customerId = subscription.customer as string

  if (!customerId) {
    logWebhook('warn', {
      message: 'missing_stripe_customer_on_subscription',
      event_id: ctx.event_id,
      event_type: ctx.event_type,
      extra: { subscription_id: subscription.id },
    })
    throw new WebhookBadRequestError('Missing customer on subscription')
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    logWebhook('error', {
      message: 'subscription_deleted_update_failed',
      event_id: ctx.event_id,
      event_type: ctx.event_type,
      extra: { subscription_id: subscription.id, db_message: error.message },
    })
    throw new Error(error.message)
  }
}
