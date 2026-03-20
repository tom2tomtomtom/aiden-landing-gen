import type { Metadata } from 'next'
import GenerateClient from './GenerateClient'

export const metadata: Metadata = {
  title: 'Interrogate your brief',
  description: 'Paste your creative brief and let AIDEN interrogate it. Get a full gap analysis and a sharper brief back in seconds.',
}

export default function GeneratePage() {
  return <GenerateClient />
}
