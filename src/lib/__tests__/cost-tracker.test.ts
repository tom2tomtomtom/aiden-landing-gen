import { describe, it, expect } from 'vitest'
import {
  estimateTokens,
  calculateCost,
  estimateCost,
} from '@/lib/cost-tracker'

const CHARS_PER_TOKEN = 4

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('approximates ceil(length / 4) for short text', () => {
    expect(estimateTokens('hi')).toBe(Math.ceil(2 / CHARS_PER_TOKEN))
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
  })

  it('scales with long text using chars/4', () => {
    const long = 'a'.repeat(4000)
    expect(estimateTokens(long)).toBe(Math.ceil(long.length / CHARS_PER_TOKEN))
    expect(estimateTokens(long)).toBe(1000)
  })
})

describe('calculateCost', () => {
  it('matches haiku PRICING (per million tokens)', () => {
    const inputTokens = 1_000
    const outputTokens = 2_000
    const expected =
      (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000
    expect(calculateCost(inputTokens, outputTokens, 'haiku')).toBeCloseTo(
      expected,
      10
    )
  })

  it('matches opus PRICING (per million tokens)', () => {
    const inputTokens = 100
    const outputTokens = 50
    const expected = (inputTokens * 15.0 + outputTokens * 75.0) / 1_000_000
    expect(calculateCost(inputTokens, outputTokens, 'opus')).toBeCloseTo(
      expected,
      10
    )
  })

  it('matches sonnet PRICING (per million tokens)', () => {
    const inputTokens = 500
    const outputTokens = 100
    const expected = (inputTokens * 3.0 + outputTokens * 15.0) / 1_000_000
    expect(calculateCost(inputTokens, outputTokens, 'sonnet')).toBeCloseTo(
      expected,
      10
    )
  })
})

describe('estimateCost', () => {
  it('returns CostEstimate shape with extract/chat costs and token counts', () => {
    const brief = 'brief text here'
    const prompt = 'system prompt'
    const extractResponse = 'extracted json'
    const chatResponse = 'assistant reply'

    const result = estimateCost(brief, prompt, extractResponse, chatResponse)

    expect(result).toMatchObject({
      extractCost: expect.any(Number),
      chatCost: expect.any(Number),
      totalCost: expect.any(Number),
      extractTokens: { input: expect.any(Number), output: expect.any(Number) },
      chatTokens: { input: expect.any(Number), output: expect.any(Number) },
    })

    expect(result.totalCost).toBeCloseTo(
      result.extractCost + result.chatCost,
      10
    )
  })

  it('derives costs from token estimates (haiku extract, opus chat)', () => {
    const brief = 'x'.repeat(40)
    const prompt = 'y'.repeat(80)
    const extractResponse = 'z'.repeat(20)
    const chatResponse = 'w'.repeat(60)

    const extIn = estimateTokens(brief)
    const extOut = estimateTokens(extractResponse)
    const chatIn = estimateTokens(prompt)
    const chatOut = estimateTokens(chatResponse)

    const result = estimateCost(brief, prompt, extractResponse, chatResponse)

    expect(result.extractTokens).toEqual({ input: extIn, output: extOut })
    expect(result.chatTokens).toEqual({ input: chatIn, output: chatOut })
    expect(result.extractCost).toBeCloseTo(
      calculateCost(extIn, extOut, 'haiku'),
      10
    )
    expect(result.chatCost).toBeCloseTo(
      calculateCost(chatIn, chatOut, 'opus'),
      10
    )
  })
})
