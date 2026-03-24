/**
 * IFS Scoring Engine - Pure Business Logic
 * 
 * This module contains the core scoring calculations for the AI Initiative
 * Prioritization Framework. All functions are pure and side-effect free.
 */

export type WorkType = 'enablement' | 'activation'

export interface Archetype {
  name: string
  action: string
  color: string
  description: string
}

export interface ScoreInputs {
  impact: number       // 1-10
  feasibility: number  // 1-10
  scalability: number  // 1-10
  workType: WorkType
}

export interface ScoringModifiers {
  linkedActivationCount?: number  // For enablement bonus
  hasBlocker?: boolean            // For feasibility penalty
  blockerStatus?: 'Stalled' | 'Missing'
  hasStrategicBonus?: boolean     // For organizational alignment
}

export interface CalculatedScores {
  adjustedImpact: number
  adjustedFeasibility: number
  totalScore: number
  enablementBonus: number
  feasibilityPenalty: number
}

export interface StrategicInferenceResult {
  impactScore: number
  feasibilityScore: number
  scalabilityScore: number
  detectedWorkType: WorkType
  rationale: {
    strategic: string
    impact: string
    feasibility: string
    scalability: string
    primaryBottleneck: string
  }
}

/**
 * Determines the archetype classification based on IFS scores
 * 
 * @param totalScore - The calculated total score (I * F * S)
 * @param impact - Adjusted impact score (1-10)
 * @param scalability - Scalability score (1-10)
 * @param feasibility - Adjusted feasibility score (1-10)
 * @param workType - 'enablement' or 'activation'
 * @returns Archetype classification with name, action, and description
 */
export function getArchetype(
  totalScore: number,
  impact: number,
  scalability: number,
  feasibility: number,
  workType: WorkType
): Archetype {
  // Transformer: Very high total score (>100)
  if (totalScore > 100) {
    return {
      name: 'Transformer',
      action: 'Immediate Delivery',
      color: 'bg-blue-500',
      description: 'High impact, feasibility, and scalability. Ship immediately.',
    }
  }

  // The Foundation: High I/S, low F, enablement work
  if (impact >= 7 && scalability >= 7 && feasibility <= 4 && workType === 'enablement') {
    return {
      name: 'The Foundation',
      action: 'Fund Infrastructure (Enablement)',
      color: 'bg-purple-500',
      description: 'Critical enablement work. Invest in infrastructure first.',
    }
  }

  // Quick Win: High F, moderate I
  if (feasibility >= 7 && impact >= 4 && impact <= 7) {
    return {
      name: 'Quick Win',
      action: 'Build Momentum',
      color: 'bg-green-500',
      description: 'High feasibility with moderate impact. Build momentum.',
    }
  }

  // The Experiment: Moderate total score (40-74)
  if (totalScore >= 40 && totalScore <= 74) {
    return {
      name: 'The Experiment',
      action: 'Time-box Prompting Party',
      color: 'bg-yellow-500',
      description: 'Moderate potential. Time-box exploration to validate.',
    }
  }

  // Money Pit: Low S, high F
  if (scalability <= 3 && feasibility >= 7) {
    return {
      name: 'Money Pit',
      action: 'Defer - Manual/Non-Scalable',
      color: 'bg-orange-500',
      description: "Easy to build but won't scale. Defer or redesign.",
    }
  }

  // The Noise: Very low total score (<20)
  if (totalScore < 20) {
    return {
      name: 'The Noise',
      action: 'Discard',
      color: 'bg-gray-500',
      description: 'Low value across all dimensions. Discard.',
    }
  }

  // Default: Under Review
  return {
    name: 'Under Review',
    action: 'Further Analysis Needed',
    color: 'bg-slate-500',
    description: 'Requires additional discovery to classify.',
  }
}

/**
 * Calculates the enablement bonus for initiatives that unlock multiple activations
 * 
 * @param workType - 'enablement' or 'activation'
 * @param linkedActivationCount - Number of downstream activations this enables
 * @returns Bonus points to add to impact (0 or 2)
 */
export function calculateEnablementBonus(
  workType: WorkType,
  linkedActivationCount: number
): number {
  if (workType === 'enablement' && linkedActivationCount >= 3) {
    return 2
  }
  return 0
}

/**
 * Calculates the feasibility penalty for blockers
 * 
 * @param hasBlocker - Whether a blocker exists
 * @param blockerStatus - 'Stalled' or 'Missing'
 * @returns Penalty points to subtract from feasibility (0, 2, or 3)
 */
export function calculateFeasibilityPenalty(
  hasBlocker: boolean,
  blockerStatus?: 'Stalled' | 'Missing'
): number {
  if (!hasBlocker) return 0
  return blockerStatus === 'Stalled' ? 2 : 3
}

/**
 * Calculates all derived scores from base inputs and modifiers
 * 
 * @param inputs - Base score inputs (impact, feasibility, scalability, workType)
 * @param modifiers - Optional modifiers (blockers, strategic alignment, etc.)
 * @returns Calculated scores including adjustments and total
 */
export function calculateScores(
  inputs: ScoreInputs,
  modifiers: ScoringModifiers = {}
): CalculatedScores {
  const { impact, feasibility, scalability, workType } = inputs
  const { linkedActivationCount = 0, hasBlocker = false, blockerStatus, hasStrategicBonus = false } = modifiers

  // Calculate bonuses and penalties
  const enablementBonus = calculateEnablementBonus(workType, linkedActivationCount)
  const feasibilityPenalty = calculateFeasibilityPenalty(hasBlocker, blockerStatus)

  // Calculate adjusted scores
  let adjustedImpact = Math.min(10, impact + enablementBonus)
  if (hasStrategicBonus) {
    adjustedImpact = Math.min(10, adjustedImpact + 1)
  }

  const adjustedFeasibility = Math.max(1, feasibility - feasibilityPenalty)

  // Calculate total score (I * F * S)
  const totalScore = adjustedImpact * scalability * adjustedFeasibility

  return {
    adjustedImpact,
    adjustedFeasibility,
    totalScore,
    enablementBonus,
    feasibilityPenalty,
  }
}

/**
 * Client-side Strategic Inference Engine
 * Analyzes initiative description for strategic signals and calculates IFS scores
 * 
 * @param description - The initiative description text
 * @param context - The client/organizational context text
 * @returns Inferred scores and rationale
 */
export function analyzeInitiativeStrategicValue(
  description: string,
  context: string
): StrategicInferenceResult {
  const text = `${description} ${context}`.toLowerCase()

  // Impact Signals Detection
  let impactScore = 5
  const impactSignals: string[] = []

  if (text.includes('14-day') || text.includes('14 day') || text.includes('two week')) {
    impactScore = Math.max(impactScore, 9)
    impactSignals.push('critical timeline bottleneck (14-day)')
  }
  if (text.includes('336 hour') || text.includes('336-hour')) {
    impactScore = Math.max(impactScore, 10)
    impactSignals.push('severe time sink (336 hours)')
  }
  if (text.includes('$4m') || text.includes('$4 million') || text.includes('4 million')) {
    impactScore = Math.max(impactScore, 10)
    impactSignals.push('high-value opportunity ($4M+)')
  }
  if (text.includes('bottleneck') || text.includes('blocker')) {
    impactScore = Math.max(impactScore, 8)
    impactSignals.push('workflow bottleneck identified')
  }
  if (text.includes('revenue') || text.includes('cost saving') || text.includes('efficiency')) {
    impactScore = Math.max(impactScore, 7)
    impactSignals.push('direct business value')
  }
  if (text.includes('manual') || text.includes('repetitive')) {
    impactScore = Math.max(impactScore, 7)
    impactSignals.push('manual process automation potential')
  }

  // Feasibility Signals Detection
  let feasibilityScore = 5
  const feasibilitySignals: string[] = []

  if (text.includes('technical debt') || text.includes('legacy system')) {
    feasibilityScore = Math.min(feasibilityScore, 4)
    feasibilitySignals.push('technical debt concerns')
  }
  if (text.includes('complex integration') || text.includes('enterprise system')) {
    feasibilityScore = Math.min(feasibilityScore, 5)
    feasibilitySignals.push('complex integration required')
  }
  if (text.includes('ready to deploy') || text.includes('plug and play') || text.includes('simple')) {
    feasibilityScore = Math.max(feasibilityScore, 9)
    feasibilitySignals.push('high deployment readiness')
  }
  if (text.includes('api available') || text.includes('existing data') || text.includes('structured data')) {
    feasibilityScore = Math.max(feasibilityScore, 8)
    feasibilitySignals.push('data infrastructure ready')
  }
  if (text.includes('poc') || text.includes('proof of concept') || text.includes('prototype')) {
    feasibilityScore = Math.max(feasibilityScore, 7)
    feasibilitySignals.push('prior validation exists')
  }

  // Scalability Signals Detection
  let scalabilityScore = 5
  const scalabilitySignals: string[] = []

  if (text.includes('autonomous') || text.includes('self-service') || text.includes('automated')) {
    scalabilityScore = Math.max(scalabilityScore, 9)
    scalabilitySignals.push('autonomous operation potential')
  }
  if (text.includes('50,000') || text.includes('50000') || text.includes('high volume')) {
    scalabilityScore = Math.max(scalabilityScore, 10)
    scalabilitySignals.push('high-volume processing (50,000+)')
  }
  if (text.includes('global') || text.includes('multi-region') || text.includes('enterprise-wide')) {
    scalabilityScore = Math.max(scalabilityScore, 9)
    scalabilitySignals.push('global deployment scope')
  }
  if (text.includes('reusable') || text.includes('template') || text.includes('modular')) {
    scalabilityScore = Math.max(scalabilityScore, 8)
    scalabilitySignals.push('reusable component architecture')
  }
  if (text.includes('one-off') || text.includes('single use') || text.includes('pilot only')) {
    scalabilityScore = Math.min(scalabilityScore, 3)
    scalabilitySignals.push('limited reuse potential')
  }

  // Detect work type
  let detectedWorkType: WorkType = 'activation'
  if (text.includes('foundation') || text.includes('infrastructure') || text.includes('platform') || text.includes('enablement')) {
    detectedWorkType = 'enablement'
  }

  // Build rationale strings
  const totalSignals = impactSignals.length + feasibilitySignals.length + scalabilitySignals.length
  const strategicRationale = totalSignals > 0
    ? `Strategic analysis identified ${totalSignals} key signals. ${impactScore >= 8 ? 'High business impact detected.' : ''} ${feasibilityScore <= 5 ? 'Implementation complexity noted.' : ''} ${scalabilityScore >= 8 ? 'Strong scaling potential.' : ''}`
    : 'Moderate strategic value detected. Consider adding more specific details about bottlenecks, timelines, or scale to improve scoring precision.'

  const primaryBottleneck = impactSignals.length > 0
    ? impactSignals[0].charAt(0).toUpperCase() + impactSignals[0].slice(1)
    : feasibilitySignals.length > 0 && feasibilityScore < 6
      ? `Implementation challenge: ${feasibilitySignals[0]}`
      : 'No critical bottleneck identified'

  return {
    impactScore,
    feasibilityScore,
    scalabilityScore,
    detectedWorkType,
    rationale: {
      strategic: strategicRationale,
      impact: impactSignals.length > 0
        ? `High Impact identified via: ${impactSignals.join(', ')}.`
        : 'Moderate impact - no high-value signals detected in description.',
      feasibility: feasibilitySignals.length > 0
        ? `Feasibility assessment: ${feasibilitySignals.join(', ')}.`
        : 'Standard feasibility - no major blockers or accelerators detected.',
      scalability: scalabilitySignals.length > 0
        ? `Scalability factors: ${scalabilitySignals.join(', ')}.`
        : 'Moderate scalability - consider adding automation or reuse patterns.',
      primaryBottleneck,
    },
  }
}

/**
 * Validates that a score is within valid range (1-10)
 * 
 * @param score - Score to validate
 * @returns Clamped score between 1 and 10
 */
export function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * Calculates friction ratio from wait states
 * 
 * @param activeWaitHours - Hours spent in active waiting
 * @param totalHours - Total cycle time hours
 * @returns Friction ratio (0-1)
 */
export function calculateFrictionRatio(activeWaitHours: number, totalHours: number): number {
  if (totalHours <= 0) return 0
  return Math.min(1, activeWaitHours / totalHours)
}
