/**
 * IFS Scoring Engine - Red/Green TDD Test Suite
 * Self-contained test runner (no external dependencies)
 */

// ============================================================================
// INLINE IMPLEMENTATION (copied from lib/ifs-scoring.ts for standalone testing)
// ============================================================================

interface ArchetypeResult {
  name: string
  color: string
  bgColor: string
  action: string
  icon: string
}

interface ScoringInput {
  impact: number
  feasibility: number
  scalability: number
  workType: 'enablement' | 'activation'
  foundations: string[]
}

interface StrategicInferenceResult {
  impactScore: number
  feasibilityScore: number
  scalabilityScore: number
  detectedWorkType: 'enablement' | 'activation'
  rationale: {
    strategic: string
    impact: string
    feasibility: string
    scalability: string
    primaryBottleneck: string
  }
}

// Archetype Classification
function getArchetype(
  totalScore: number,
  impact: number,
  feasibility: number,
  scalability: number,
  frictionRatio: number
): ArchetypeResult {
  // Evaluation order matters - most specific conditions first
  
  // 1. Friction Trap: High impact but low feasibility creates friction
  if (impact >= 8 && feasibility <= 4 && frictionRatio > 2) {
    return {
      name: 'Friction Trap',
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      action: 'Reduce scope or increase readiness before proceeding',
      icon: 'AlertTriangle'
    }
  }
  
  // 2. Strategic Moonshot: High everything - rare and valuable
  if (impact >= 9 && feasibility >= 7 && scalability >= 8 && totalScore >= 85) {
    return {
      name: 'Strategic Moonshot',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      action: 'Fast-track with dedicated resources and executive sponsorship',
      icon: 'Rocket'
    }
  }
  
  // 3. Quick Win: Easy to implement with decent impact
  if (feasibility >= 8 && impact >= 6 && totalScore >= 60) {
    return {
      name: 'Quick Win',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      action: 'Execute immediately - low risk, high reward velocity',
      icon: 'Zap'
    }
  }
  
  // 4. Foundation Builder: Enablement work that unlocks future value
  if (scalability >= 8 && feasibility >= 6 && impact <= 6) {
    return {
      name: 'Foundation Builder',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      action: 'Invest now for compounding returns - track enablement metrics',
      icon: 'Layers'
    }
  }
  
  // 5. Scale Engine: High scalability with good feasibility
  if (scalability >= 8 && feasibility >= 7 && totalScore >= 70) {
    return {
      name: 'Scale Engine',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500/10',
      action: 'Prioritize for enterprise rollout - measure adoption velocity',
      icon: 'TrendingUp'
    }
  }
  
  // 6. Reassess: Low scores across the board
  if (totalScore < 40 || (impact <= 4 && feasibility <= 4)) {
    return {
      name: 'Reassess',
      color: 'text-gray-600',
      bgColor: 'bg-gray-500/10',
      action: 'Reconsider scope, timing, or strategic alignment',
      icon: 'RefreshCw'
    }
  }
  
  // 7. Default: Balanced Bet
  return {
    name: 'Balanced Bet',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    action: 'Proceed with standard governance and incremental validation',
    icon: 'Scale'
  }
}

// Calculate Enablement Bonus
function calculateEnablementBonus(workType: 'enablement' | 'activation', foundations: string[]): number {
  if (workType !== 'enablement') return 0
  let bonus = 1
  if (foundations.length >= 3) bonus += 1
  return Math.min(bonus, 2)
}

// Calculate Feasibility Penalty
function calculateFeasibilityPenalty(feasibility: number, foundations: string[]): number {
  if (feasibility <= 3 && foundations.length === 0) return 2
  if (feasibility <= 4 && foundations.length <= 1) return 1
  return 0
}

// Calculate Total Score
function calculateTotalScore(input: ScoringInput): {
  totalScore: number
  adjustedImpact: number
  adjustedFeasibility: number
  enablementBonus: number
  feasibilityPenalty: number
  frictionRatio: number
} {
  const { impact, feasibility, scalability, workType, foundations } = input
  
  const enablementBonus = calculateEnablementBonus(workType, foundations)
  const feasibilityPenalty = calculateFeasibilityPenalty(feasibility, foundations)
  
  const adjustedImpact = Math.min(10, impact + enablementBonus)
  const adjustedFeasibility = Math.max(1, feasibility - feasibilityPenalty)
  
  const rawScore = (adjustedImpact * 0.4 + adjustedFeasibility * 0.35 + scalability * 0.25) * 10
  const totalScore = Math.round(Math.min(100, Math.max(0, rawScore)))
  
  const frictionRatio = adjustedFeasibility > 0 ? adjustedImpact / adjustedFeasibility : 10
  
  return { totalScore, adjustedImpact, adjustedFeasibility, enablementBonus, feasibilityPenalty, frictionRatio }
}

// Validate Score Range
function validateScoreRange(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)))
}

// Strategic Value Inference Engine
function analyzeInitiativeStrategicValue(description: string, context: string): StrategicInferenceResult {
  const text = `${description} ${context}`.toLowerCase()
  
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
  
  let detectedWorkType: 'enablement' | 'activation' = 'activation'
  if (text.includes('foundation') || text.includes('infrastructure') || text.includes('platform') || text.includes('enablement')) {
    detectedWorkType = 'enablement'
  }
  
  const strategicRationale = impactSignals.length > 0 || feasibilitySignals.length > 0 || scalabilitySignals.length > 0
    ? `Strategic analysis identified ${impactSignals.length + feasibilitySignals.length + scalabilitySignals.length} key signals. ${impactScore >= 8 ? 'High business impact detected.' : ''} ${feasibilityScore <= 5 ? 'Implementation complexity noted.' : ''} ${scalabilityScore >= 8 ? 'Strong scaling potential.' : ''}`
    : 'Moderate strategic value detected.'
  
  const primaryBottleneck = impactSignals.length > 0 
    ? impactSignals[0].charAt(0).toUpperCase() + impactSignals[0].slice(1)
    : feasibilitySignals.length > 0 && feasibilityScore < 6
      ? `Implementation challenge: ${feasibilitySignals[0]}`
      : 'No critical bottleneck identified'
  
  return {
    impactScore, feasibilityScore, scalabilityScore, detectedWorkType,
    rationale: {
      strategic: strategicRationale,
      impact: impactSignals.length > 0 ? `High Impact identified via: ${impactSignals.join(', ')}.` : 'Moderate impact.',
      feasibility: feasibilitySignals.length > 0 ? `Feasibility assessment: ${feasibilitySignals.join(', ')}.` : 'Standard feasibility.',
      scalability: scalabilitySignals.length > 0 ? `Scalability factors: ${scalabilitySignals.join(', ')}.` : 'Moderate scalability.',
      primaryBottleneck,
    }
  }
}

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

interface TestResult { name: string; passed: boolean; error?: string }
const results: TestResult[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    results.push({ name, passed: true })
    console.log(`  [PASS] ${name}`)
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    results.push({ name, passed: false, error })
    console.log(`  [FAIL] ${name}`)
    console.log(`         Error: ${error}`)
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) { if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`) },
    toBeGreaterThanOrEqual(expected: number) { if (typeof actual !== 'number' || actual < expected) throw new Error(`Expected ${actual} >= ${expected}`) },
    toBeLessThanOrEqual(expected: number) { if (typeof actual !== 'number' || actual > expected) throw new Error(`Expected ${actual} <= ${expected}`) },
    toContain(expected: string) { if (typeof actual !== 'string' || !actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`) },
  }
}

function describe(suiteName: string, fn: () => void) { console.log(`\n${suiteName}`); fn() }

// ============================================================================
// TEST SUITES
// ============================================================================

console.log('='.repeat(70))
console.log('IFS SCORING ENGINE - RED/GREEN TDD TEST SUITE')
console.log('='.repeat(70))

describe('1. getArchetype() - Archetype Classification', () => {
  test('Friction Trap: I>=8, F<=4, friction>2', () => {
    const r = getArchetype(60, 9, 3, 6, 3.0)
    expect(r.name).toBe('Friction Trap')
  })
  test('Strategic Moonshot: I>=9, F>=7, S>=8, total>=85', () => {
    const r = getArchetype(88, 9, 8, 9, 1.1)
    expect(r.name).toBe('Strategic Moonshot')
  })
  test('Quick Win: F>=8, I>=6, total>=60', () => {
    const r = getArchetype(72, 7, 9, 6, 0.8)
    expect(r.name).toBe('Quick Win')
  })
  test('Foundation Builder: S>=8, F>=6, I<=6', () => {
    const r = getArchetype(65, 5, 7, 9, 0.7)
    expect(r.name).toBe('Foundation Builder')
  })
  test('Scale Engine: S>=8, F>=7, total>=70', () => {
    const r = getArchetype(75, 7, 8, 9, 0.9)
    expect(r.name).toBe('Scale Engine')
  })
  test('Reassess: total < 40', () => {
    const r = getArchetype(35, 3, 4, 3, 0.75)
    expect(r.name).toBe('Reassess')
  })
  test('Reassess: I<=4 AND F<=4', () => {
    const r = getArchetype(45, 4, 4, 5, 1.0)
    expect(r.name).toBe('Reassess')
  })
  test('Balanced Bet: default fallback', () => {
    const r = getArchetype(55, 6, 6, 6, 1.0)
    expect(r.name).toBe('Balanced Bet')
  })
})

describe('2. calculateEnablementBonus() - Enablement Bonus', () => {
  test('returns 0 for activation', () => { expect(calculateEnablementBonus('activation', ['A'])).toBe(0) })
  test('returns 1 for enablement with <3 foundations', () => { expect(calculateEnablementBonus('enablement', ['A'])).toBe(1) })
  test('returns 2 for enablement with >=3 foundations', () => { expect(calculateEnablementBonus('enablement', ['A','B','C'])).toBe(2) })
})

describe('3. calculateFeasibilityPenalty() - Feasibility Penalty', () => {
  test('returns 2 for F<=3 with no foundations', () => { expect(calculateFeasibilityPenalty(3, [])).toBe(2) })
  test('returns 1 for F<=4 with 1 foundation', () => { expect(calculateFeasibilityPenalty(4, ['A'])).toBe(1) })
  test('returns 0 for F>=5', () => { expect(calculateFeasibilityPenalty(5, [])).toBe(0) })
})

describe('4. calculateTotalScore() - Score Calculation', () => {
  test('max scores (10,10,10) = 100', () => {
    const r = calculateTotalScore({ impact: 10, feasibility: 10, scalability: 10, workType: 'activation', foundations: [] })
    expect(r.totalScore).toBe(100)
  })
  test('applies enablement bonus to impact', () => {
    const r = calculateTotalScore({ impact: 8, feasibility: 7, scalability: 6, workType: 'enablement', foundations: ['A','B','C'] })
    expect(r.enablementBonus).toBe(2)
    expect(r.adjustedImpact).toBe(10)
  })
  test('applies feasibility penalty', () => {
    const r = calculateTotalScore({ impact: 7, feasibility: 3, scalability: 5, workType: 'activation', foundations: [] })
    expect(r.feasibilityPenalty).toBe(2)
    expect(r.adjustedFeasibility).toBe(1)
  })
  test('caps adjusted impact at 10', () => {
    const r = calculateTotalScore({ impact: 9, feasibility: 7, scalability: 8, workType: 'enablement', foundations: ['A','B','C'] })
    expect(r.adjustedImpact).toBe(10)
  })
})

describe('5. validateScoreRange() - Input Validation', () => {
  test('clamps values above 10', () => { expect(validateScoreRange(15)).toBe(10) })
  test('clamps values below 1', () => { expect(validateScoreRange(0)).toBe(1) })
  test('rounds decimals', () => { expect(validateScoreRange(7.6)).toBe(8) })
})

describe('6. analyzeInitiativeStrategicValue() - Strategic Inference', () => {
  test('detects 14-day bottleneck => impact>=9', () => {
    const r = analyzeInitiativeStrategicValue('14-day turnaround', '')
    expect(r.impactScore).toBeGreaterThanOrEqual(9)
  })
  test('detects $4M => impact=10', () => {
    const r = analyzeInitiativeStrategicValue('$4M opportunity', '')
    expect(r.impactScore).toBe(10)
  })
  test('detects technical debt => feasibility<=4', () => {
    const r = analyzeInitiativeStrategicValue('technical debt issues', '')
    expect(r.feasibilityScore).toBeLessThanOrEqual(4)
  })
  test('detects autonomous => scalability>=9', () => {
    const r = analyzeInitiativeStrategicValue('autonomous processing', '')
    expect(r.scalabilityScore).toBeGreaterThanOrEqual(9)
  })
  test('detects 50,000 volume => scalability=10', () => {
    const r = analyzeInitiativeStrategicValue('50,000 transactions', '')
    expect(r.scalabilityScore).toBe(10)
  })
  test('detects one-off => scalability<=3', () => {
    const r = analyzeInitiativeStrategicValue('one-off analysis', '')
    expect(r.scalabilityScore).toBeLessThanOrEqual(3)
  })
  test('detects enablement work type', () => {
    const r = analyzeInitiativeStrategicValue('foundation infrastructure', '')
    expect(r.detectedWorkType).toBe('enablement')
  })
  test('defaults to activation work type', () => {
    const r = analyzeInitiativeStrategicValue('simple feature', '')
    expect(r.detectedWorkType).toBe('activation')
  })
  test('returns moderate scores for generic text', () => {
    const r = analyzeInitiativeStrategicValue('basic project', '')
    expect(r.impactScore).toBe(5)
    expect(r.feasibilityScore).toBe(5)
    expect(r.scalabilityScore).toBe(5)
  })
})

describe('7. Integration Tests - Full Pipeline', () => {
  test('Regional Variant Engine => Strategic Moonshot', () => {
    const inf = analyzeInitiativeStrategicValue('14-day production cycles, 336 hours, $4M opportunity', 'global deployment')
    const sc = calculateTotalScore({ impact: inf.impactScore, feasibility: 8, scalability: inf.scalabilityScore, workType: inf.detectedWorkType, foundations: ['A','B'] })
    const arch = getArchetype(sc.totalScore, sc.adjustedImpact, sc.adjustedFeasibility, inf.scalabilityScore, sc.frictionRatio)
    expect(arch.name).toBe('Strategic Moonshot')
  })
  test('Low readiness + high ambition => Friction Trap', () => {
    const sc = calculateTotalScore({ impact: 9, feasibility: 3, scalability: 7, workType: 'activation', foundations: [] })
    const arch = getArchetype(sc.totalScore, sc.adjustedImpact, sc.adjustedFeasibility, 7, sc.frictionRatio)
    expect(arch.name).toBe('Friction Trap')
  })
  test('High feasibility + moderate impact => Quick Win', () => {
    const sc = calculateTotalScore({ impact: 7, feasibility: 9, scalability: 6, workType: 'activation', foundations: [] })
    const arch = getArchetype(sc.totalScore, sc.adjustedImpact, sc.adjustedFeasibility, 6, sc.frictionRatio)
    expect(arch.name).toBe('Quick Win')
  })
})

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70))
console.log('TEST RESULTS SUMMARY')
console.log('='.repeat(70))

const passed = results.filter(r => r.passed).length
const failed = results.filter(r => !r.passed).length

console.log(`Total:  ${results.length} tests`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`\nStatus: ${failed === 0 ? 'ALL TESTS PASSED (GREEN)' : 'SOME TESTS FAILED (RED)'}`)

if (failed > 0) {
  console.log('\n--- FAILED TESTS ---')
  results.filter(r => !r.passed).forEach(r => console.log(`  [FAIL] ${r.name}: ${r.error}`))
}

console.log('='.repeat(70))
