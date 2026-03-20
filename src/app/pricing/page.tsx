import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free with 3 brief analyses per month. Upgrade to Single (£49) or Pro (£99/mo) for unlimited deep analysis, full strategic output, and no branding.',
}

export default function PricingPage() {
  return <PricingClient />
}
