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
    const { ticketContent, organizationalContext, issueType, completedWorkSummary } = await req.json()

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

**CRITICAL INSTRUCTION**: You MUST be harsh and skeptical. Your default starting point is 4-5 for ALL dimensions. You must SUBTRACT points for missing information, vague language, or lack of evidence. Only ADD points when there is EXPLICIT, CONCRETE evidence in the ticket.

**CALIBRATION**: In any typical backlog:
- 70% of tickets should score 3-5 (below average to average)
- 25% of tickets should score 6-7 (above average)
- 5% of tickets should score 8+ (exceptional - RARE)

If you find yourself giving 7+ scores frequently, you are being too generous.

### Impact (1-10): Business value and strategic importance
START AT 4, then adjust:
- +3-4 points ONLY IF: Explicit revenue figures, named executive sponsor, hard deadline with documented consequences
- +1-2 points IF: Clear user benefit with scope defined, documented priority from PM
- -1-2 points IF: Vague "will improve" language, no metrics, no deadline
- -2-3 points IF: No business case stated, purely internal, unclear who benefits
${issueType === 'Bug' ? '\n**Bug Impact**: Start at 4. Only production-down P0 bugs affecting revenue get 7+. Most bugs stay 3-5.' : ''}

### Feasibility (1-10): Implementation readiness and complexity
START AT 5, then adjust:
- +2-3 points ONLY IF: Exact solution documented, <1 day effort, no dependencies, team did identical work before
- +1 point IF: Clear requirements, familiar tech stack
- -1-2 points IF: Requirements unclear, unfamiliar systems, multiple dependencies
- -2-3 points IF: Research needed, cross-team coordination, legacy systems, unknowns
${issueType === 'Bug' ? '\n**Bug Feasibility**: Start at 5. Only well-isolated, obvious fixes get 7+. Investigation needed = 4 or lower.' : ''}

### Scalability (1-10): Reuse and automation potential  
START AT 4, then adjust:
- +3-4 points ONLY IF: Explicitly designed as reusable platform with documented API/interface
- +1-2 points IF: Component could serve multiple use cases with minor changes
- -1-2 points IF: Specific to one team/customer, would need rework to reuse
- -2-3 points IF: One-off fix, hardcoded values, no abstraction possible
${issueType === 'Bug' ? '\n**Bug Scalability**: Bug fixes START at 3. Only systemic fixes with automation get 5+. Most bugs are 2-4.' : ''}

**FINAL CHECK**: Before submitting, ask yourself: "Am I being too generous?" If Impact × Feasibility × Scalability > 150, re-evaluate - this should be RARE.

### Work Type:
- "enablement": Infrastructure, platforms, APIs, data pipelines, foundational capabilities
- "activation": Direct feature delivery, customer-facing changes, immediate value
${issueType === 'Bug' ? '\nNote: Most bugs are "activation" (fixing existing features), unless they involve infrastructure improvements.' : ''}

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
