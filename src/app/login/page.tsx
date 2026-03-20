import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to AIDEN Brief Intelligence with a magic link. No password needed.',
}

export default function LoginPage() {
  return <LoginClient />
}
