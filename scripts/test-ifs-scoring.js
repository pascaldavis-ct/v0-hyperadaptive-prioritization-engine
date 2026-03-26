/**
 * IFS Scoring Engine - Red/Green TDD Test Suite
 * Self-contained JavaScript test runner
 */

// ============================================================================
// IMPLEMENTATION FUNCTIONS
// ============================================================================

function getArchetype(totalScore, impact, feasibility, scalability, frictionRatio) {
  if (impact >= 8 && feasibility <= 4 && frictionRatio > 2) {
    return { name: 'Friction Trap', action: 'Reduce scope or increase readiness' }
  }
  if (impact >= 9 && feasibility >= 7 && scalability >= 8 && totalScore >= 85) {
    return { name: 'Strategic Moonshot', action: 'Fast-track with resources' }
  }
  if (feasibility >= 8 && impact >= 6 && totalScore >= 60) {
    return { name: 'Quick Win', action: 'Execute immediately' }
  }
  if (scalability >= 8 && feasibility >= 6 && impact <= 6) {
    return { name: 'Foundation Builder', action: 'Invest for compounding returns' }
  }
  if (scalability >= 8 && feasibility >= 7 && totalScore >= 70) {
    return { name: 'Scale Engine', action: 'Prioritize for enterprise rollout' }
  }
  if (totalScore < 40 || (impact <= 4 && feasibility <= 4)) {
    return { name: 'Reassess', action: 'Reconsider scope or timing' }
  }
  return { name: 'Balanced Bet', action: 'Proceed with standard governance' }
}

function calculateEnablementBonus(workType, foundations) {
  if (workType !== 'enablement') return 0
  let bonus = 1
  if (foundations.length >= 3) bonus += 1
  return Math.min(bonus, 2)
}

function calculateFeasibilityPenalty(feasibility, foundations) {
  if (feasibility <= 3 && foundations.length === 0) return 2
  if (feasibility <= 4 && foundations.length <= 1) return 1
  return 0
}

function calculateTotalScore(input) {
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

function validateScoreRange(score) {
  return Math.min(10, Math.max(1, Math.round(score)))
}

function analyzeInitiativeStrategicValue(description, context) {
  const text = `${description} ${context}`.toLowerCase()
  
  let impactScore = 5
  const impactSignals = []
  if (text.includes('14-day') || text.includes('14 day')) { impactScore = Math.max(impactScore, 9); impactSignals.push('14-day') }
  if (text.includes('336 hour') || text.includes('336-hour')) { impactScore = Math.max(impactScore, 10); impactSignals.push('336 hours') }
  if (text.includes('$4m') || text.includes('$4 million') || text.includes('4 million')) { impactScore = Math.max(impactScore, 10); impactSignals.push('$4M+') }
  if (text.includes('bottleneck') || text.includes('blocker')) { impactScore = Math.max(impactScore, 8); impactSignals.push('bottleneck') }
  if (text.includes('revenue') || text.includes('cost saving') || text.includes('efficiency')) { impactScore = Math.max(impactScore, 7); impactSignals.push('business value') }
  if (text.includes('manual') || text.includes('repetitive')) { impactScore = Math.max(impactScore, 7); impactSignals.push('manual process') }
  
  let feasibilityScore = 5
  const feasibilitySignals = []
  if (text.includes('technical debt') || text.includes('legacy system')) { feasibilityScore = Math.min(feasibilityScore, 4); feasibilitySignals.push('technical debt') }
  if (text.includes('complex integration')) { feasibilityScore = Math.min(feasibilityScore, 5); feasibilitySignals.push('complex integration') }
  if (text.includes('ready to deploy') || text.includes('plug and play')) { feasibilityScore = Math.max(feasibilityScore, 9); feasibilitySignals.push('deployment ready') }
  if (text.includes('api available') || text.includes('existing data') || text.includes('structured data')) { feasibilityScore = Math.max(feasibilityScore, 8); feasibilitySignals.push('data ready') }
  if (text.includes('poc') || text.includes('proof of concept')) { feasibilityScore = Math.max(feasibilityScore, 7); feasibilitySignals.push('prior validation') }
  
  let scalabilityScore = 5
  const scalabilitySignals = []
  if (text.includes('autonomous') || text.includes('self-service') || text.includes('automated')) { scalabilityScore = Math.max(scalabilityScore, 9); scalabilitySignals.push('autonomous') }
  if (text.includes('50,000') || text.includes('50000') || text.includes('high volume')) { scalabilityScore = Math.max(scalabilityScore, 10); scalabilitySignals.push('high volume') }
  if (text.includes('global') || text.includes('multi-region') || text.includes('enterprise-wide')) { scalabilityScore = Math.max(scalabilityScore, 9); scalabilitySignals.push('global scope') }
  if (text.includes('reusable') || text.includes('template') || text.includes('modular')) { scalabilityScore = Math.max(scalabilityScore, 8); scalabilitySignals.push('reusable') }
  if (text.includes('one-off') || text.includes('single use') || text.includes('pilot only')) { scalabilityScore = Math.min(scalabilityScore, 3); scalabilitySignals.push('one-off') }
  
  let detectedWorkType = 'activation'
  if (text.includes('foundation') || text.includes('infrastructure') || text.includes('platform') || text.includes('enablement')) {
    detectedWorkType = 'enablement'
  }
  
  const primaryBottleneck = impactSignals.length > 0 ? impactSignals[0] : 'No critical bottleneck'
  
  return {
    impactScore, feasibilityScore, scalabilityScore, detectedWorkType,
    rationale: {
      impact: impactSignals.length > 0 ? `Impact: ${impactSignals.join(', ')}` : 'Moderate impact',
      feasibility: feasibilitySignals.length > 0 ? `Feasibility: ${feasibilitySignals.join(', ')}` : 'Standard feasibility',
      scalability: scalabilitySignals.length > 0 ? `Scalability: ${scalabilitySignals.join(', ')}` : 'Moderate scalability',
      primaryBottleneck
    }
  }
}

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

const results = []

function test(name, fn) {
  try {
    fn()
    results.push({ name, passed: true })
    console.log(`  [PASS] ${name}`)
  } catch (e) {
    results.push({ name, passed: false, error: e.message })
    console.log(`  [FAIL] ${name}`)
    console.log(`         Error: ${e.message}`)
  }
}

function expect(actual) {
  return {
    toBe(expected) { if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`) },
    toBeGreaterThanOrEqual(expected) { if (actual < expected) throw new Error(`Expected ${actual} >= ${expected}`) },
    toBeLessThanOrEqual(expected) { if (actual > expected) throw new Error(`Expected ${actual} <= ${expected}`) },
  }
}

function describe(name, fn) { console.log(`\n${name}`); fn() }

// ============================================================================
// TEST SUITES
// ============================================================================

console.log('======================================================================')
console.log('IFS SCORING ENGINE - RED/GREEN TDD TEST SUITE')
console.log('======================================================================')

describe('1. getArchetype() - Archetype Classification', () => {
  test('Friction Trap: I>=8, F<=4, friction>2', () => {
    expect(getArchetype(60, 9, 3, 6, 3.0).name).toBe('Friction Trap')
  })
  test('Strategic Moonshot: I>=9, F>=7, S>=8, total>=85', () => {
    expect(getArchetype(88, 9, 8, 9, 1.1).name).toBe('Strategic Moonshot')
  })
  test('Quick Win: F>=8, I>=6, total>=60', () => {
    expect(getArchetype(72, 7, 9, 6, 0.8).name).toBe('Quick Win')
  })
  test('Foundation Builder: S>=8, F>=6, I<=6', () => {
    expect(getArchetype(65, 5, 7, 9, 0.7).name).toBe('Foundation Builder')
  })
  test('Scale Engine: S>=8, F>=7, total>=70', () => {
    expect(getArchetype(75, 7, 8, 9, 0.9).name).toBe('Scale Engine')
  })
  test('Reassess: total < 40', () => {
    expect(getArchetype(35, 3, 4, 3, 0.75).name).toBe('Reassess')
  })
  test('Reassess: I<=4 AND F<=4', () => {
    expect(getArchetype(45, 4, 4, 5, 1.0).name).toBe('Reassess')
  })
  test('Balanced Bet: default fallback', () => {
    expect(getArchetype(55, 6, 6, 6, 1.0).name).toBe('Balanced Bet')
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
  test('detects 14-day => impact>=9', () => {
    expect(analyzeInitiativeStrategicValue('14-day turnaround', '').impactScore).toBeGreaterThanOrEqual(9)
  })
  test('detects $4M => impact=10', () => {
    expect(analyzeInitiativeStrategicValue('$4M opportunity', '').impactScore).toBe(10)
  })
  test('detects technical debt => feasibility<=4', () => {
    expect(analyzeInitiativeStrategicValue('technical debt issues', '').feasibilityScore).toBeLessThanOrEqual(4)
  })
  test('detects autonomous => scalability>=9', () => {
    expect(analyzeInitiativeStrategicValue('autonomous processing', '').scalabilityScore).toBeGreaterThanOrEqual(9)
  })
  test('detects 50,000 volume => scalability=10', () => {
    expect(analyzeInitiativeStrategicValue('50,000 transactions', '').scalabilityScore).toBe(10)
  })
  test('detects one-off => scalability<=3', () => {
    expect(analyzeInitiativeStrategicValue('one-off analysis', '').scalabilityScore).toBeLessThanOrEqual(3)
  })
  test('detects enablement work type', () => {
    expect(analyzeInitiativeStrategicValue('foundation infrastructure', '').detectedWorkType).toBe('enablement')
  })
  test('defaults to activation work type', () => {
    expect(analyzeInitiativeStrategicValue('simple feature', '').detectedWorkType).toBe('activation')
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
    const inf = analyzeInitiativeStrategicValue('14-day production, 336 hours, $4M opportunity', 'global')
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

console.log('\n======================================================================')
console.log('TEST RESULTS SUMMARY')
console.log('======================================================================')

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

console.log('======================================================================')
