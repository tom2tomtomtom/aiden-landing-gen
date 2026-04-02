import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free with 3 analyses per month. Upgrade to Starter ($30 for 50 analyses) or Pro ($99/mo unlimited) for full strategic output and no branding.',
}

export default function PricingPage() {
  return <PricingClient />
}
