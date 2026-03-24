/**
 * IFS Scoring Engine Test Suite
 * 
 * Red/Green TDD approach:
 * 1. RED: Tests are written to specify expected behavior
 * 2. GREEN: Implementation makes tests pass
 * 3. REFACTOR: Clean up while keeping tests green
 */

import { describe, it, expect } from 'vitest'
import {
  getArchetype,
  calculateEnablementBonus,
  calculateFeasibilityPenalty,
  calculateScores,
  analyzeInitiativeStrategicValue,
  clampScore,
  calculateFrictionRatio,
} from '@/lib/ifs-scoring'

// ============================================================================
// ARCHETYPE CLASSIFICATION TESTS
// ============================================================================

describe('getArchetype', () => {
  describe('Transformer archetype', () => {
    it('should classify as Transformer when totalScore > 100', () => {
      // I=8, S=8, F=8 = 512 (well over 100)
      const archetype = getArchetype(512, 8, 8, 8, 'activation')
      expect(archetype.name).toBe('Transformer')
      expect(archetype.action).toBe('Immediate Delivery')
    })

    it('should classify as Transformer at boundary (totalScore = 101)', () => {
      const archetype = getArchetype(101, 7, 7, 7, 'activation')
      expect(archetype.name).toBe('Transformer')
    })

    it('should NOT classify as Transformer when totalScore = 100', () => {
      const archetype = getArchetype(100, 7, 7, 7, 'activation')
      expect(archetype.name).not.toBe('Transformer')
    })
  })

  describe('The Foundation archetype', () => {
    it('should classify as Foundation for high I/S, low F, enablement work', () => {
      // Impact >= 7, Scalability >= 7, Feasibility <= 4, workType = enablement
      const archetype = getArchetype(50, 8, 8, 3, 'enablement')
      expect(archetype.name).toBe('The Foundation')
      expect(archetype.action).toBe('Fund Infrastructure (Enablement)')
    })

    it('should NOT classify as Foundation for activation work', () => {
      const archetype = getArchetype(50, 8, 8, 3, 'activation')
      expect(archetype.name).not.toBe('The Foundation')
    })

    it('should NOT classify as Foundation when feasibility > 4', () => {
      const archetype = getArchetype(50, 8, 8, 5, 'enablement')
      expect(archetype.name).not.toBe('The Foundation')
    })

    it('should NOT classify as Foundation when impact < 7', () => {
      const archetype = getArchetype(50, 6, 8, 3, 'enablement')
      expect(archetype.name).not.toBe('The Foundation')
    })
  })

  describe('Quick Win archetype', () => {
    it('should classify as Quick Win for high F, moderate I', () => {
      // Feasibility >= 7, Impact 4-7
      const archetype = getArchetype(50, 5, 5, 8, 'activation')
      expect(archetype.name).toBe('Quick Win')
      expect(archetype.action).toBe('Build Momentum')
    })

    it('should classify as Quick Win at impact boundary (impact = 4)', () => {
      const archetype = getArchetype(50, 4, 5, 8, 'activation')
      expect(archetype.name).toBe('Quick Win')
    })

    it('should classify as Quick Win at impact boundary (impact = 7)', () => {
      const archetype = getArchetype(50, 7, 5, 8, 'activation')
      expect(archetype.name).toBe('Quick Win')
    })

    it('should NOT classify as Quick Win when impact > 7', () => {
      const archetype = getArchetype(50, 8, 5, 8, 'activation')
      expect(archetype.name).not.toBe('Quick Win')
    })

    it('should NOT classify as Quick Win when feasibility < 7', () => {
      const archetype = getArchetype(50, 5, 5, 6, 'activation')
      expect(archetype.name).not.toBe('Quick Win')
    })
  })

  describe('The Experiment archetype', () => {
    it('should classify as Experiment when totalScore 40-74', () => {
      const archetype = getArchetype(50, 5, 5, 5, 'activation')
      expect(archetype.name).toBe('The Experiment')
      expect(archetype.action).toBe('Time-box Prompting Party')
    })

    it('should classify as Experiment at lower boundary (totalScore = 40)', () => {
      const archetype = getArchetype(40, 4, 4, 4, 'activation')
      expect(archetype.name).toBe('The Experiment')
    })

    it('should classify as Experiment at upper boundary (totalScore = 74)', () => {
      const archetype = getArchetype(74, 5, 5, 5, 'activation')
      expect(archetype.name).toBe('The Experiment')
    })

    it('should NOT classify as Experiment when totalScore = 39', () => {
      const archetype = getArchetype(39, 4, 4, 4, 'activation')
      expect(archetype.name).not.toBe('The Experiment')
    })

    it('should NOT classify as Experiment when totalScore = 75 (under review)', () => {
      // Note: 75 falls through to Under Review
      const archetype = getArchetype(75, 5, 5, 5, 'activation')
      // Should be Under Review since no other conditions match
      expect(archetype.name).toBe('Under Review')
    })
  })

  describe('Money Pit archetype', () => {
    it('should classify as Money Pit for low S, high F', () => {
      // Scalability <= 3, Feasibility >= 7
      const archetype = getArchetype(30, 5, 2, 8, 'activation')
      expect(archetype.name).toBe('Money Pit')
      expect(archetype.action).toBe('Defer - Manual/Non-Scalable')
    })

    it('should NOT classify as Money Pit when scalability > 3', () => {
      const archetype = getArchetype(30, 5, 4, 8, 'activation')
      expect(archetype.name).not.toBe('Money Pit')
    })

    it('should NOT classify as Money Pit when feasibility < 7', () => {
      const archetype = getArchetype(30, 5, 2, 6, 'activation')
      expect(archetype.name).not.toBe('Money Pit')
    })
  })

  describe('The Noise archetype', () => {
    it('should classify as Noise when totalScore < 20', () => {
      const archetype = getArchetype(15, 2, 2, 2, 'activation')
      expect(archetype.name).toBe('The Noise')
      expect(archetype.action).toBe('Discard')
    })

    it('should classify as Noise at boundary (totalScore = 19)', () => {
      const archetype = getArchetype(19, 2, 2, 2, 'activation')
      expect(archetype.name).toBe('The Noise')
    })

    it('should NOT classify as Noise when totalScore = 20', () => {
      const archetype = getArchetype(20, 3, 3, 3, 'activation')
      expect(archetype.name).not.toBe('The Noise')
    })
  })

  describe('Under Review archetype (default)', () => {
    it('should classify as Under Review when no other conditions match', () => {
      // Score between 75-100, no special conditions
      const archetype = getArchetype(80, 5, 5, 5, 'activation')
      expect(archetype.name).toBe('Under Review')
      expect(archetype.action).toBe('Further Analysis Needed')
    })
  })

  describe('Archetype precedence', () => {
    it('should prioritize Transformer over all others', () => {
      // Even with high I/S and low F for Foundation, Transformer wins
      const archetype = getArchetype(200, 10, 10, 2, 'enablement')
      expect(archetype.name).toBe('Transformer')
    })

    it('should prioritize Foundation over Quick Win for enablement', () => {
      // Both could match, but Foundation should win
      const archetype = getArchetype(50, 7, 7, 4, 'enablement')
      expect(archetype.name).toBe('The Foundation')
    })
  })
})

// ============================================================================
// ENABLEMENT BONUS TESTS
// ============================================================================

describe('calculateEnablementBonus', () => {
  it('should return 2 for enablement with 3+ linked activations', () => {
    expect(calculateEnablementBonus('enablement', 3)).toBe(2)
    expect(calculateEnablementBonus('enablement', 5)).toBe(2)
    expect(calculateEnablementBonus('enablement', 10)).toBe(2)
  })

  it('should return 0 for enablement with < 3 linked activations', () => {
    expect(calculateEnablementBonus('enablement', 0)).toBe(0)
    expect(calculateEnablementBonus('enablement', 1)).toBe(0)
    expect(calculateEnablementBonus('enablement', 2)).toBe(0)
  })

  it('should return 0 for activation work regardless of links', () => {
    expect(calculateEnablementBonus('activation', 0)).toBe(0)
    expect(calculateEnablementBonus('activation', 5)).toBe(0)
    expect(calculateEnablementBonus('activation', 10)).toBe(0)
  })
})

// ============================================================================
// FEASIBILITY PENALTY TESTS
// ============================================================================

describe('calculateFeasibilityPenalty', () => {
  it('should return 0 when no blocker', () => {
    expect(calculateFeasibilityPenalty(false)).toBe(0)
    expect(calculateFeasibilityPenalty(false, 'Stalled')).toBe(0)
  })

  it('should return 2 for Stalled blocker', () => {
    expect(calculateFeasibilityPenalty(true, 'Stalled')).toBe(2)
  })

  it('should return 3 for Missing blocker', () => {
    expect(calculateFeasibilityPenalty(true, 'Missing')).toBe(3)
  })

  it('should return 3 for blocker with undefined status (default to Missing)', () => {
    expect(calculateFeasibilityPenalty(true, undefined)).toBe(3)
  })
})

// ============================================================================
// COMPREHENSIVE SCORE CALCULATION TESTS
// ============================================================================

describe('calculateScores', () => {
  describe('basic calculations', () => {
    it('should calculate totalScore as I * F * S', () => {
      const result = calculateScores({
        impact: 5,
        feasibility: 5,
        scalability: 5,
        workType: 'activation',
      })
      expect(result.totalScore).toBe(125) // 5 * 5 * 5
    })

    it('should pass through scores with no modifiers', () => {
      const result = calculateScores({
        impact: 7,
        feasibility: 8,
        scalability: 6,
        workType: 'activation',
      })
      expect(result.adjustedImpact).toBe(7)
      expect(result.adjustedFeasibility).toBe(8)
      expect(result.totalScore).toBe(336) // 7 * 8 * 6
    })
  })

  describe('enablement bonus', () => {
    it('should add enablement bonus to impact', () => {
      const result = calculateScores(
        { impact: 6, feasibility: 5, scalability: 5, workType: 'enablement' },
        { linkedActivationCount: 4 }
      )
      expect(result.enablementBonus).toBe(2)
      expect(result.adjustedImpact).toBe(8) // 6 + 2
      expect(result.totalScore).toBe(200) // 8 * 5 * 5
    })

    it('should cap adjusted impact at 10', () => {
      const result = calculateScores(
        { impact: 9, feasibility: 5, scalability: 5, workType: 'enablement' },
        { linkedActivationCount: 5 }
      )
      expect(result.enablementBonus).toBe(2)
      expect(result.adjustedImpact).toBe(10) // capped at 10, not 11
    })
  })

  describe('strategic bonus', () => {
    it('should add +1 impact for strategic alignment', () => {
      const result = calculateScores(
        { impact: 5, feasibility: 5, scalability: 5, workType: 'activation' },
        { hasStrategicBonus: true }
      )
      expect(result.adjustedImpact).toBe(6) // 5 + 1
    })

    it('should stack with enablement bonus', () => {
      const result = calculateScores(
        { impact: 5, feasibility: 5, scalability: 5, workType: 'enablement' },
        { linkedActivationCount: 3, hasStrategicBonus: true }
      )
      expect(result.enablementBonus).toBe(2)
      expect(result.adjustedImpact).toBe(8) // 5 + 2 + 1
    })

    it('should cap combined bonuses at 10', () => {
      const result = calculateScores(
        { impact: 9, feasibility: 5, scalability: 5, workType: 'enablement' },
        { linkedActivationCount: 3, hasStrategicBonus: true }
      )
      expect(result.adjustedImpact).toBe(10) // capped
    })
  })

  describe('feasibility penalty', () => {
    it('should subtract penalty from feasibility', () => {
      const result = calculateScores(
        { impact: 5, feasibility: 6, scalability: 5, workType: 'activation' },
        { hasBlocker: true, blockerStatus: 'Stalled' }
      )
      expect(result.feasibilityPenalty).toBe(2)
      expect(result.adjustedFeasibility).toBe(4) // 6 - 2
    })

    it('should floor adjusted feasibility at 1', () => {
      const result = calculateScores(
        { impact: 5, feasibility: 2, scalability: 5, workType: 'activation' },
        { hasBlocker: true, blockerStatus: 'Missing' }
      )
      expect(result.feasibilityPenalty).toBe(3)
      expect(result.adjustedFeasibility).toBe(1) // floored, not -1
    })
  })

  describe('combined modifiers', () => {
    it('should apply all modifiers correctly', () => {
      const result = calculateScores(
        { impact: 6, feasibility: 7, scalability: 5, workType: 'enablement' },
        {
          linkedActivationCount: 4,
          hasStrategicBonus: true,
          hasBlocker: true,
          blockerStatus: 'Stalled',
        }
      )
      expect(result.enablementBonus).toBe(2)
      expect(result.feasibilityPenalty).toBe(2)
      expect(result.adjustedImpact).toBe(9)       // 6 + 2 + 1
      expect(result.adjustedFeasibility).toBe(5)  // 7 - 2
      expect(result.totalScore).toBe(225)         // 9 * 5 * 5
    })
  })
})

// ============================================================================
// STRATEGIC INFERENCE ENGINE TESTS
// ============================================================================

describe('analyzeInitiativeStrategicValue', () => {
  describe('impact signal detection', () => {
    it('should detect 14-day bottleneck signal (score 9)', () => {
      const result = analyzeInitiativeStrategicValue(
        'This process takes 14-day turnaround time',
        'Insurance company'
      )
      expect(result.impactScore).toBe(9)
      expect(result.rationale.impact).toContain('14-day')
    })

    it('should detect 336-hour signal (score 10)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Currently spending 336 hours on manual processing',
        'Enterprise'
      )
      expect(result.impactScore).toBe(10)
      expect(result.rationale.impact).toContain('336 hours')
    })

    it('should detect $4M value signal (score 10)', () => {
      const result = analyzeInitiativeStrategicValue(
        'This represents a $4 million opportunity',
        'Fortune 500'
      )
      expect(result.impactScore).toBe(10)
      expect(result.rationale.impact).toContain('$4M')
    })

    it('should detect bottleneck keyword (score 8)', () => {
      const result = analyzeInitiativeStrategicValue(
        'This is a major bottleneck in our workflow',
        'Tech company'
      )
      expect(result.impactScore).toBe(8)
      expect(result.rationale.impact).toContain('bottleneck')
    })

    it('should detect revenue/efficiency signals (score 7)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Will drive significant revenue growth',
        'Startup'
      )
      expect(result.impactScore).toBe(7)
    })

    it('should return 5 when no signals detected', () => {
      const result = analyzeInitiativeStrategicValue(
        'Generic initiative description',
        'Some company'
      )
      expect(result.impactScore).toBe(5)
    })
  })

  describe('feasibility signal detection', () => {
    it('should penalize for technical debt (score 4)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Requires addressing significant technical debt',
        'Legacy systems'
      )
      expect(result.feasibilityScore).toBe(4)
    })

    it('should boost for ready to deploy (score 9)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Solution is ready to deploy immediately',
        'Modern stack'
      )
      expect(result.feasibilityScore).toBe(9)
    })

    it('should boost for existing data infrastructure (score 8)', () => {
      const result = analyzeInitiativeStrategicValue(
        'We have structured data and API available',
        'Data company'
      )
      expect(result.feasibilityScore).toBe(8)
    })

    it('should boost for prior validation (score 7)', () => {
      const result = analyzeInitiativeStrategicValue(
        'We completed a successful POC last quarter',
        'Innovation team'
      )
      expect(result.feasibilityScore).toBe(7)
    })
  })

  describe('scalability signal detection', () => {
    it('should boost for autonomous operation (score 9)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Enables fully autonomous processing',
        'Automation focused'
      )
      expect(result.scalabilityScore).toBe(9)
    })

    it('should boost for high volume (score 10)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Needs to handle 50,000 requests per day',
        'High-scale platform'
      )
      expect(result.scalabilityScore).toBe(10)
    })

    it('should boost for global scope (score 9)', () => {
      const result = analyzeInitiativeStrategicValue(
        'Will be deployed enterprise-wide globally',
        'Multinational'
      )
      expect(result.scalabilityScore).toBe(9)
    })

    it('should penalize for one-off work (score 3)', () => {
      const result = analyzeInitiativeStrategicValue(
        'This is a one-off project for a specific client',
        'Agency'
      )
      expect(result.scalabilityScore).toBe(3)
    })
  })

  describe('work type detection', () => {
    it('should detect enablement from foundation keyword', () => {
      const result = analyzeInitiativeStrategicValue(
        'Building the foundation for AI capabilities',
        'Enterprise'
      )
      expect(result.detectedWorkType).toBe('enablement')
    })

    it('should detect enablement from infrastructure keyword', () => {
      const result = analyzeInitiativeStrategicValue(
        'Data infrastructure modernization',
        'Tech company'
      )
      expect(result.detectedWorkType).toBe('enablement')
    })

    it('should detect enablement from platform keyword', () => {
      const result = analyzeInitiativeStrategicValue(
        'Building an AI platform for the organization',
        'Enterprise'
      )
      expect(result.detectedWorkType).toBe('enablement')
    })

    it('should default to activation when no enablement signals', () => {
      const result = analyzeInitiativeStrategicValue(
        'Automate customer email responses',
        'Customer service'
      )
      expect(result.detectedWorkType).toBe('activation')
    })
  })

  describe('rationale generation', () => {
    it('should generate meaningful strategic rationale', () => {
      const result = analyzeInitiativeStrategicValue(
        '14-day bottleneck causing revenue loss',
        'Insurance company'
      )
      expect(result.rationale.strategic).toContain('key signals')
      expect(result.rationale.strategic).toContain('High business impact')
    })

    it('should identify primary bottleneck', () => {
      const result = analyzeInitiativeStrategicValue(
        'This is a critical blocker in our pipeline',
        'Tech company'
      )
      expect(result.rationale.primaryBottleneck).not.toBe('No critical bottleneck identified')
    })

    it('should provide fallback rationale when no signals', () => {
      const result = analyzeInitiativeStrategicValue(
        'Some project',
        'Some company'
      )
      expect(result.rationale.strategic).toContain('Moderate strategic value')
      expect(result.rationale.primaryBottleneck).toBe('No critical bottleneck identified')
    })
  })

  describe('case insensitivity', () => {
    it('should detect signals regardless of case', () => {
      const result = analyzeInitiativeStrategicValue(
        'BOTTLENECK in the WORKFLOW',
        'ENTERPRISE company'
      )
      expect(result.impactScore).toBe(8)
    })
  })
})

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('clampScore', () => {
  it('should return value when in range', () => {
    expect(clampScore(5)).toBe(5)
    expect(clampScore(1)).toBe(1)
    expect(clampScore(10)).toBe(10)
  })

  it('should clamp values below 1 to 1', () => {
    expect(clampScore(0)).toBe(1)
    expect(clampScore(-5)).toBe(1)
  })

  it('should clamp values above 10 to 10', () => {
    expect(clampScore(11)).toBe(10)
    expect(clampScore(100)).toBe(10)
  })

  it('should round decimal values', () => {
    expect(clampScore(5.4)).toBe(5)
    expect(clampScore(5.6)).toBe(6)
    expect(clampScore(10.9)).toBe(10) // rounded then clamped
  })
})

describe('calculateFrictionRatio', () => {
  it('should calculate correct ratio', () => {
    expect(calculateFrictionRatio(50, 100)).toBe(0.5)
    expect(calculateFrictionRatio(25, 100)).toBe(0.25)
    expect(calculateFrictionRatio(75, 100)).toBe(0.75)
  })

  it('should return 0 when totalHours is 0', () => {
    expect(calculateFrictionRatio(50, 0)).toBe(0)
  })

  it('should cap ratio at 1', () => {
    expect(calculateFrictionRatio(150, 100)).toBe(1)
  })

  it('should handle edge case of 0 wait hours', () => {
    expect(calculateFrictionRatio(0, 100)).toBe(0)
  })
})

// ============================================================================
// INTEGRATION / SCENARIO TESTS
// ============================================================================

describe('IFS Scoring Integration', () => {
  describe('Regional Variant Engine scenario', () => {
    it('should score high for 14-day bottleneck with 50,000 volume', () => {
      const inference = analyzeInitiativeStrategicValue(
        'Regional variant engine to automate 14-day manual adaptation process. Currently processing 50,000 assets manually. Critical bottleneck.',
        'Fortune 500 insurance company with $4 million marketing budget'
      )

      // Should detect multiple high-value signals
      expect(inference.impactScore).toBeGreaterThanOrEqual(9)
      expect(inference.scalabilityScore).toBe(10) // 50,000 volume
      expect(inference.detectedWorkType).toBe('activation')

      // Calculate final scores
      const scores = calculateScores({
        impact: inference.impactScore,
        feasibility: inference.feasibilityScore,
        scalability: inference.scalabilityScore,
        workType: inference.detectedWorkType,
      })

      // Should result in high total score
      expect(scores.totalScore).toBeGreaterThan(100)

      // Should classify as Transformer
      const archetype = getArchetype(
        scores.totalScore,
        scores.adjustedImpact,
        inference.scalabilityScore,
        scores.adjustedFeasibility,
        inference.detectedWorkType
      )
      expect(archetype.name).toBe('Transformer')
    })
  })

  describe('Enablement with dependencies scenario', () => {
    it('should boost impact for enablement unlocking multiple activations', () => {
      const scores = calculateScores(
        { impact: 6, feasibility: 4, scalability: 8, workType: 'enablement' },
        { linkedActivationCount: 5 }
      )

      expect(scores.enablementBonus).toBe(2)
      expect(scores.adjustedImpact).toBe(8)

      const archetype = getArchetype(
        scores.totalScore,
        scores.adjustedImpact,
        8, // scalability
        scores.adjustedFeasibility,
        'enablement'
      )

      // Low feasibility but high I/S should trigger Foundation
      expect(archetype.name).toBe('The Foundation')
    })
  })

  describe('Blocked initiative scenario', () => {
    it('should penalize feasibility for stalled dependency', () => {
      const scores = calculateScores(
        { impact: 7, feasibility: 5, scalability: 6, workType: 'activation' },
        { hasBlocker: true, blockerStatus: 'Stalled' }
      )

      expect(scores.feasibilityPenalty).toBe(2)
      expect(scores.adjustedFeasibility).toBe(3)
      expect(scores.totalScore).toBe(126) // 7 * 3 * 6
    })
  })

  describe('Low value initiative scenario', () => {
    it('should classify as Noise for low scores across all dimensions', () => {
      const inference = analyzeInitiativeStrategicValue(
        'Small internal tool',
        'Small team'
      )

      // Should get default scores
      expect(inference.impactScore).toBe(5)
      expect(inference.feasibilityScore).toBe(5)
      expect(inference.scalabilityScore).toBe(5)

      // Now simulate a truly low-value scenario
      const scores = calculateScores({
        impact: 2,
        feasibility: 2,
        scalability: 2,
        workType: 'activation',
      })

      expect(scores.totalScore).toBe(8) // 2 * 2 * 2

      const archetype = getArchetype(
        scores.totalScore,
        scores.adjustedImpact,
        2,
        scores.adjustedFeasibility,
        'activation'
      )
      expect(archetype.name).toBe('The Noise')
    })
  })
})
