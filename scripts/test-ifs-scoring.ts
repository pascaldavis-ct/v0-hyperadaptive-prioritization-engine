/**
 * IFS Scoring Engine - Red/Green TDD Test Suite
 * 
 * This script tests all core business logic functions directly
 * without requiring Vitest infrastructure.
 */

// Import the functions to test
import {
  getArchetype,
  calculateEnablementBonus,
  calculateFeasibilityPenalty,
  calculateAdjustedImpact,
  calculateAdjustedFeasibility,
  calculateTotalScore,
  calculateFrictionRatio,
  analyzeInitiativeStrategicValue,
  type ArchetypeResult,
  type StrategicAnalysisResult,
} from '../lib/ifs-scoring'

// Simple test framework
let passed = 0
let failed = 0
const failures: string[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`✓ ${name}`)
  } catch (error) {
    failed++
    const message = error instanceof Error ? error.message : String(error)
    failures.push(`✗ ${name}: ${message}`)
    console.log(`✗ ${name}`)
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} >= ${expected}`)
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} <= ${expected}`)
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`)
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`)
      }
    },
  }
}

function describe(name: string, fn: () => void) {
  console.log(`\n${name}`)
  console.log('='.repeat(name.length))
  fn()
}

// ============================================================
// TEST SUITE: getArchetype()
// ============================================================

describe('getArchetype() - Archetype Classification Logic', () => {
  test('returns "star" for high impact, high feasibility, high scalability', () => {
    const result = getArchetype(9, 9, 9)
    expect(result.archetype).toBe('star')
    expect(result.action).toContain('Prioritize')
  })

  test('returns "strategic-bet" for high impact, low feasibility', () => {
    const result = getArchetype(9, 4, 7)
    expect(result.archetype).toBe('strategic-bet')
    expect(result.action).toContain('investment')
  })

  test('returns "quick-win" for moderate impact, high feasibility', () => {
    const result = getArchetype(6, 9, 6)
    expect(result.archetype).toBe('quick-win')
    expect(result.action).toContain('Execute')
  })

  test('returns "scale-candidate" for high scalability, moderate impact', () => {
    const result = getArchetype(6, 7, 9)
    expect(result.archetype).toBe('scale-candidate')
    expect(result.action).toContain('automation')
  })

  test('returns "resource-drain" for low scalability, low impact', () => {
    const result = getArchetype(3, 5, 3)
    expect(result.archetype).toBe('resource-drain')
    expect(result.action).toContain('Deprioritize')
  })

  test('returns "foundational" for enablement work type', () => {
    const result = getArchetype(6, 6, 6, 'enablement')
    expect(result.archetype).toBe('foundational')
  })

  test('returns "incremental" as default fallback', () => {
    const result = getArchetype(5, 5, 5)
    expect(result.archetype).toBe('incremental')
  })
})

// ============================================================
// TEST SUITE: calculateEnablementBonus()
// ============================================================

describe('calculateEnablementBonus() - Enablement Work Type Bonus', () => {
  test('returns 0 for activation work type', () => {
    expect(calculateEnablementBonus('activation')).toBe(0)
  })

  test('returns 1 for enablement work type', () => {
    expect(calculateEnablementBonus('enablement')).toBe(1)
  })
})

// ============================================================
// TEST SUITE: calculateFeasibilityPenalty()
// ============================================================

describe('calculateFeasibilityPenalty() - Resource Capacity Penalties', () => {
  test('returns 0 for high capacity', () => {
    expect(calculateFeasibilityPenalty('high')).toBe(0)
  })

  test('returns -1 for medium capacity', () => {
    expect(calculateFeasibilityPenalty('medium')).toBe(-1)
  })

  test('returns -2 for low capacity', () => {
    expect(calculateFeasibilityPenalty('low')).toBe(-2)
  })
})

// ============================================================
// TEST SUITE: calculateAdjustedImpact()
// ============================================================

describe('calculateAdjustedImpact() - Impact Score Adjustments', () => {
  test('adds enablement bonus to impact', () => {
    const result = calculateAdjustedImpact(7, 1, true)
    expect(result).toBe(9) // 7 + 1 + 1 (strategic bonus)
  })

  test('caps adjusted impact at 10', () => {
    const result = calculateAdjustedImpact(10, 1, true)
    expect(result).toBe(10)
  })

  test('does not add strategic bonus when false', () => {
    const result = calculateAdjustedImpact(7, 1, false)
    expect(result).toBe(8) // 7 + 1
  })
})

// ============================================================
// TEST SUITE: calculateAdjustedFeasibility()
// ============================================================

describe('calculateAdjustedFeasibility() - Feasibility Score Adjustments', () => {
  test('subtracts penalty from feasibility', () => {
    const result = calculateAdjustedFeasibility(7, -2)
    expect(result).toBe(5)
  })

  test('floors adjusted feasibility at 1', () => {
    const result = calculateAdjustedFeasibility(1, -2)
    expect(result).toBe(1)
  })

  test('no penalty for high capacity', () => {
    const result = calculateAdjustedFeasibility(7, 0)
    expect(result).toBe(7)
  })
})

// ============================================================
// TEST SUITE: calculateTotalScore()
// ============================================================

describe('calculateTotalScore() - IFS Total Score Formula', () => {
  test('calculates weighted average (40% I, 30% F, 30% S)', () => {
    const result = calculateTotalScore(10, 10, 10)
    expect(result).toBe(10)
  })

  test('calculates correct weighted score for varied inputs', () => {
    // (8 * 0.4) + (6 * 0.3) + (4 * 0.3) = 3.2 + 1.8 + 1.2 = 6.2
    const result = calculateTotalScore(8, 6, 4)
    expect(result).toBe(6.2)
  })

  test('rounds to one decimal place', () => {
    // (7 * 0.4) + (5 * 0.3) + (3 * 0.3) = 2.8 + 1.5 + 0.9 = 5.2
    const result = calculateTotalScore(7, 5, 3)
    expect(result).toBe(5.2)
  })
})

// ============================================================
// TEST SUITE: calculateFrictionRatio()
// ============================================================

describe('calculateFrictionRatio() - Impact/Feasibility Ratio', () => {
  test('returns ratio of impact to feasibility', () => {
    const result = calculateFrictionRatio(8, 4)
    expect(result).toBe(2)
  })

  test('returns impact when feasibility is 0', () => {
    const result = calculateFrictionRatio(8, 0)
    expect(result).toBe(8)
  })

  test('rounds to two decimal places', () => {
    const result = calculateFrictionRatio(7, 3)
    // 7 / 3 = 2.333...
    expect(result).toBe(2.33)
  })
})

// ============================================================
// TEST SUITE: analyzeInitiativeStrategicValue()
// ============================================================

describe('analyzeInitiativeStrategicValue() - Client-Side Inference Engine', () => {
  test('detects 14-day bottleneck signal for high impact', () => {
    const result = analyzeInitiativeStrategicValue(
      'This process has a 14-day bottleneck that blocks deployment',
      'Enterprise client'
    )
    expect(result.impactScore).toBeGreaterThanOrEqual(9)
    expect(result.rationale.impact).toContain('14-day')
  })

  test('detects $4M value signal for maximum impact', () => {
    const result = analyzeInitiativeStrategicValue(
      'This initiative could unlock $4 million in annual savings',
      'Fortune 500 company'
    )
    expect(result.impactScore).toBe(10)
    expect(result.rationale.impact).toContain('$4M')
  })

  test('detects technical debt for lower feasibility', () => {
    const result = analyzeInitiativeStrategicValue(
      'Must integrate with legacy system that has significant technical debt',
      'Financial services'
    )
    expect(result.feasibilityScore).toBeLessThanOrEqual(4)
    expect(result.rationale.feasibility).toContain('technical debt')
  })

  test('detects autonomous operation for high scalability', () => {
    const result = analyzeInitiativeStrategicValue(
      'Build an autonomous self-service portal for customers',
      'SaaS platform'
    )
    expect(result.scalabilityScore).toBeGreaterThanOrEqual(9)
    expect(result.rationale.scalability).toContain('autonomous')
  })

  test('detects high volume (50,000+) for maximum scalability', () => {
    const result = analyzeInitiativeStrategicValue(
      'Process will handle 50,000 transactions daily',
      'E-commerce platform'
    )
    expect(result.scalabilityScore).toBe(10)
  })

  test('detects enablement work type from keywords', () => {
    const result = analyzeInitiativeStrategicValue(
      'Build a foundation platform infrastructure for future AI initiatives',
      'Tech company'
    )
    expect(result.detectedWorkType).toBe('enablement')
  })

  test('defaults to activation work type', () => {
    const result = analyzeInitiativeStrategicValue(
      'Create a customer dashboard for reporting',
      'Retail company'
    )
    expect(result.detectedWorkType).toBe('activation')
  })

  test('returns moderate scores for generic descriptions', () => {
    const result = analyzeInitiativeStrategicValue(
      'A new feature for our application',
      'Small business'
    )
    expect(result.impactScore).toBe(5)
    expect(result.feasibilityScore).toBe(5)
    expect(result.scalabilityScore).toBe(5)
  })

  test('identifies primary bottleneck from impact signals', () => {
    const result = analyzeInitiativeStrategicValue(
      'Current workflow bottleneck causes 336-hour delays',
      'Manufacturing'
    )
    expect(result.rationale.primaryBottleneck).toBeTruthy()
    expect(result.rationale.primaryBottleneck).toContain('336 hours')
  })

  test('combines multiple signals correctly', () => {
    const result = analyzeInitiativeStrategicValue(
      'Automated self-service portal with existing API, replacing manual repetitive tasks, ready to deploy globally across enterprise',
      'Global enterprise with high volume needs'
    )
    expect(result.impactScore).toBeGreaterThanOrEqual(7)
    expect(result.feasibilityScore).toBeGreaterThanOrEqual(8)
    expect(result.scalabilityScore).toBeGreaterThanOrEqual(9)
  })
})

// ============================================================
// TEST SUITE: Edge Cases and Boundary Conditions
// ============================================================

describe('Edge Cases and Boundary Conditions', () => {
  test('getArchetype handles minimum scores (1,1,1)', () => {
    const result = getArchetype(1, 1, 1)
    expect(result.archetype).toBeTruthy()
  })

  test('getArchetype handles maximum scores (10,10,10)', () => {
    const result = getArchetype(10, 10, 10)
    expect(result.archetype).toBe('star')
  })

  test('calculateTotalScore handles boundary values', () => {
    expect(calculateTotalScore(1, 1, 1)).toBe(1)
    expect(calculateTotalScore(10, 10, 10)).toBe(10)
  })

  test('analyzeInitiativeStrategicValue handles empty strings', () => {
    const result = analyzeInitiativeStrategicValue('', '')
    expect(result.impactScore).toBe(5)
    expect(result.feasibilityScore).toBe(5)
    expect(result.scalabilityScore).toBe(5)
  })

  test('analyzeInitiativeStrategicValue is case-insensitive', () => {
    const lower = analyzeInitiativeStrategicValue('14-day bottleneck', '')
    const upper = analyzeInitiativeStrategicValue('14-DAY BOTTLENECK', '')
    expect(lower.impactScore).toBe(upper.impactScore)
  })
})

// ============================================================
// TEST SUITE: Integration Tests - Full Scoring Pipeline
// ============================================================

describe('Integration Tests - Full Scoring Pipeline', () => {
  test('Regional Variant Engine scenario matches expected archetype', () => {
    // Simulate the demo scenario
    const impact = 9
    const feasibility = 7
    const scalability = 10
    const workType = 'activation' as const
    const resourceCapacity = 'high' as const
    
    const enablementBonus = calculateEnablementBonus(workType)
    const feasibilityPenalty = calculateFeasibilityPenalty(resourceCapacity)
    const adjustedImpact = calculateAdjustedImpact(impact, enablementBonus, true)
    const adjustedFeasibility = calculateAdjustedFeasibility(feasibility, feasibilityPenalty)
    const totalScore = calculateTotalScore(adjustedImpact, adjustedFeasibility, scalability)
    const archetype = getArchetype(adjustedImpact, adjustedFeasibility, scalability, workType)
    
    expect(archetype.archetype).toBe('star')
    expect(totalScore).toBeGreaterThanOrEqual(8)
  })

  test('Low-value pilot scenario matches resource-drain archetype', () => {
    const impact = 3
    const feasibility = 4
    const scalability = 2
    const workType = 'activation' as const
    const resourceCapacity = 'low' as const
    
    const enablementBonus = calculateEnablementBonus(workType)
    const feasibilityPenalty = calculateFeasibilityPenalty(resourceCapacity)
    const adjustedImpact = calculateAdjustedImpact(impact, enablementBonus, false)
    const adjustedFeasibility = calculateAdjustedFeasibility(feasibility, feasibilityPenalty)
    const archetype = getArchetype(adjustedImpact, adjustedFeasibility, scalability, workType)
    
    expect(archetype.archetype).toBe('resource-drain')
  })

  test('Enablement foundation work gets foundational archetype', () => {
    const impact = 6
    const feasibility = 6
    const scalability = 7
    const workType = 'enablement' as const
    
    const archetype = getArchetype(impact, feasibility, scalability, workType)
    expect(archetype.archetype).toBe('foundational')
  })
})

// ============================================================
// SUMMARY
// ============================================================

console.log('\n' + '='.repeat(50))
console.log('TEST SUMMARY')
console.log('='.repeat(50))
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log(`Total:  ${passed + failed}`)

if (failures.length > 0) {
  console.log('\nFailures:')
  failures.forEach(f => console.log(f))
}

console.log('\n' + (failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed'))
