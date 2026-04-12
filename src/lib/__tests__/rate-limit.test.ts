import { describe, it, expect } from 'vitest'
import {
  checkRateLimit,
  checkIpDailyLimit,
  incrementIpDailyUsage,
  checkGuestMonthlyLimit,
  incrementGuestMonthlyUsage,
  FREE_GUEST_MONTHLY_LIMIT,
} from '@/lib/rate-limit'

describe('rate-limit exports', () => {
  it('exports the expected async functions', () => {
    expect(typeof checkRateLimit).toBe('function')
    expect(typeof checkIpDailyLimit).toBe('function')
    expect(typeof incrementIpDailyUsage).toBe('function')
    expect(typeof checkGuestMonthlyLimit).toBe('function')
    expect(typeof incrementGuestMonthlyUsage).toBe('function')
  })

  it('exports FREE_GUEST_MONTHLY_LIMIT as 1', () => {
    expect(FREE_GUEST_MONTHLY_LIMIT).toBe(1)
  })
})
