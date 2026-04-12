/** Shared types for brief analysis (API response + DB `output_copy`). */

export interface PhantomPerspective {
  role: string
  shorthand: string
  verdict: number
  critique: string
  suggestion: string
}

export interface DimensionScore {
  dimension: string
  score: number
  maxScore: number
  status: 'missing' | 'thin' | 'adequate' | 'strong'
  evidence: string
}

export interface ScoreBreakdown {
  total: number
  dimensions: DimensionScore[]
  structureScore: number
  completenessScore: number
}

export interface ClassicStandardScore {
  standard: string
  master: string
  score: number
  maxScore: number
  verdict: string
  advice: string
}

export interface ClassicBriefRef {
  id: string
  campaign: string
  brand: string
  year: string
  agency: string
  singleMindedProposition: string
  humanTruth: string
  whyItWorked: string
  briefStrength: string
  industry: string
}

export interface MarketInsightData {
  category: 'audience' | 'competitive' | 'channel' | 'benchmark' | 'trend'
  insight: string
  source: string
  relevance: 'high' | 'medium'
}

/** Full analysis payload returned by `/api/analyze-brief` and stored in `generations.output_copy`. */
export interface BriefAnalysis {
  extractedBrief: Record<string, unknown>
  strategicAnalysis: Record<string, unknown>
  gaps: string[]
  score: number
  scoreBreakdown?: ScoreBreakdown
  briefText?: string
  rewrittenBrief?: string | null
  phantomAnalysis?: PhantomPerspective[] | null
  clarifyingQuestions?: string[]
  classicScores?: ClassicStandardScore[]
  classicBenchmarks?: ClassicBriefRef[]
  marketInsights?: MarketInsightData[]
}

/** Alias used across UI components. */
export type BriefAnalysisData = BriefAnalysis
