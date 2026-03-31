import { generateText, Output } from 'ai'
import { z } from 'zod'

// Schema for structured IFS analysis output
const ifsAnalysisSchema = z.object({
  impactScore: z.number().min(1).max(10).describe('Impact score from 1-10 based on business value, urgency, and strategic alignment'),
  feasibilityScore: z.number().min(1).max(10).describe('Feasibility score from 1-10 based on technical complexity, resource requirements, and implementation readiness'),
  scalabilityScore: z.number().min(1).max(10).describe('Scalability score from 1-10 based on reuse potential, automation capabilities, and enterprise-wide applicability'),
  workType: z.enum(['enablement', 'activation']).describe('enablement = foundational/infrastructure work, activation = direct value delivery'),
  organizationalFocus: z.string().describe('The primary organizational focus area detected from the context (e.g., "Revenue Growth", "Operational Efficiency", "Customer Experience", "Technical Debt", "AI/Automation", "Compliance", etc.)'),
  strategicAlignment: z.number().min(1).max(10).describe('How well this ticket aligns with the detected organizational focus (1-10)'),
  rationale: z.object({
    strategic: z.string().describe('2-3 sentence strategic assessment of this ticket relative to the organizational context'),
    impact: z.string().describe('Specific reasons for the impact score, citing evidence from the ticket'),
    feasibility: z.string().describe('Specific reasons for the feasibility score, citing technical factors'),
    scalability: z.string().describe('Specific reasons for the scalability score, citing reuse and scaling factors'),
    primaryBottleneck: z.string().describe('The single most critical bottleneck or blocker identified, or "No critical bottleneck" if none'),
  }),
})

export async function POST(req: Request) {
  try {
    const { ticketContent, organizationalContext, resourceCapacity, issueType, completedWorkSummary } = await req.json()

    if (!ticketContent) {
      return Response.json(
        { error: 'Ticket content is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert business analyst specializing in prioritization frameworks. Your task is to analyze JIRA tickets and provide IFS (Impact-Feasibility-Scalability) scores.

## Context Understanding:
The organizational context you receive includes:
1. **Executive Summaries** - Strategic priorities and organizational goals
2. **Completed Work** - Previously completed items at the same hierarchy level and parent levels

Use this context to:
- Understand what has already been built/completed
- Identify patterns in completed work that inform feasibility estimates
- Assess strategic alignment based on Executive Summary priorities
- Consider if this work builds on or relates to completed items

${completedWorkSummary ? `\n**Completed Work Summary**: ${completedWorkSummary}` : ''}

## Issue Type Context:
${issueType === 'Story' ? `This is a **Story** - a user-facing feature or capability. Focus on:
- User value and experience impact
- Feature completeness and acceptance criteria
- Integration with existing user workflows` : ''}
${issueType === 'Task' ? `This is a **Task** - a specific piece of work to be done. Focus on:
- Clear scope and deliverables
- Technical implementation approach
- Dependencies and blockers` : ''}
${issueType === 'Bug' ? `This is a **Bug** - a defect requiring fix. Consider:
- Severity and user impact (critical bugs = higher impact)
- Regression risk and test coverage
- Root cause complexity affects feasibility` : ''}
${issueType === 'Epic' ? `This is an **Epic** - a large body of work. Consider:
- Strategic scope and organizational impact
- Multiple team coordination needs
- Long-term value and dependencies` : ''}
${issueType === 'Sub-task' ? `This is a **Sub-task** - a smaller piece of work under a Story/Task. Consider:
- Specific implementation detail
- Contribution to parent Story/Task completion
- Dependencies on other sub-tasks` : ''}

## Scoring Guidelines:

IMPORTANT: Be CRITICAL and DISCRIMINATING. Most tickets should score in the 4-6 range (average). Only exceptional tickets deserve 7+ scores. Reserve 9-10 for truly extraordinary items with explicit evidence.

### Impact (1-10): Business value and strategic importance
- 9-10: RARE - Must have explicit evidence of: revenue >$1M impact, C-suite urgency, or company-wide blocker. Requires proof, not assumptions.
- 7-8: Clear quantified business value stated in ticket, documented ROI, explicit deadline with consequences
- 5-6: TYPICAL - Standard business value, stated importance without hard metrics, normal priority
- 3-4: Vague benefits, "nice-to-have" language, no urgency indicators, limited user scope
- 1-2: No stated business case, unclear purpose, purely technical debt with no user impact
${issueType === 'Bug' ? '\n**Bug Impact**: Only P0/P1 production-down bugs score 8+. Most bugs are 4-6 unless affecting revenue or large user base.' : ''}

### Feasibility (1-10): Implementation readiness and complexity  
- 9-10: RARE - Trivial change (<1 day), exact solution known, zero dependencies, no unknowns
- 7-8: Clear requirements, familiar technology, team has done similar work recently
- 5-6: TYPICAL - Standard complexity, some design needed, normal dependencies
- 3-4: Ambiguous requirements, unfamiliar systems, cross-team dependencies, learning curve
- 1-2: Major unknowns, requires research/POC, legacy systems, architectural changes needed
${issueType === 'Bug' ? '\n**Bug Feasibility**: Only obvious single-line fixes score 8+. Root cause investigation = lower scores.' : ''}

### Scalability (1-10): Reuse and automation potential
- 9-10: RARE - Explicitly designed as platform/framework, documented reuse plan, self-service by design
- 7-8: Component designed for reuse, API/service that multiple teams will consume
- 5-6: TYPICAL - Standard implementation, could be reused with modification
- 3-4: Specific to one use case, would need significant rework to reuse
- 1-2: One-off fix, hardcoded values, no abstraction, single customer/scenario
${issueType === 'Bug' ? '\n**Bug Scalability**: Bug fixes are typically 3-5 unless addressing systemic issues or adding preventive automation.' : ''}

DEFAULT ASSUMPTION: If the ticket lacks explicit evidence for a score, default to 5 (average). The burden of proof is on the ticket to justify higher scores.

### Work Type:
- "enablement": Infrastructure, platforms, APIs, data pipelines, foundational capabilities
- "activation": Direct feature delivery, customer-facing changes, immediate value
${issueType === 'Bug' ? '\nNote: Most bugs are "activation" (fixing existing features), unless they involve infrastructure improvements.' : ''}

${resourceCapacity === 'low' ? '\nNote: Resource capacity is LOW - factor this into feasibility assessment (reduce by 1-2 points if implementation is resource-intensive).' : ''}
${resourceCapacity === 'high' ? '\nNote: Resource capacity is HIGH - teams have bandwidth for complex implementations.' : ''}

Analyze the ticket content in the context of the organizational priorities provided. Be specific in your rationale, citing actual content from the ticket.`

    const userPrompt = `## Organizational Context:
${organizationalContext || 'No specific organizational context provided. Use general business prioritization principles.'}

## Ticket to Analyze:
${ticketContent}

Provide your IFS analysis with specific scores and detailed rationale.`

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4',
      output: Output.object({
        schema: ifsAnalysisSchema,
      }),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    return Response.json({
      success: true,
      analysis: output,
    })
  } catch (error) {
    console.error('[v0] Error in analyze-ticket:', error)
    return Response.json(
      { error: 'Failed to analyze ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
