import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('email without RESEND_API_KEY', () => {
  const originalKey = process.env.RESEND_API_KEY

  beforeEach(() => {
    vi.resetModules()
    delete process.env.RESEND_API_KEY
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = originalKey
    }
    vi.resetModules()
  })

  it('sendWelcomeEmail resolves without throwing', async () => {
    const { sendWelcomeEmail } = await import('@/lib/email')
    await expect(sendWelcomeEmail('user@example.com')).resolves.toBeUndefined()
  })

  it('sendChecklistEmail resolves without throwing', async () => {
    const { sendChecklistEmail } = await import('@/lib/email')
    await expect(sendChecklistEmail('user@example.com')).resolves.toBeUndefined()
  })
})
