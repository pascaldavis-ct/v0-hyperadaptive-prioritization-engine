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
    const { ticketContent, organizationalContext, resourceCapacity, issueType, parentEpic } = await req.json()

    if (!ticketContent) {
      return Response.json(
        { error: 'Ticket content is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert business analyst specializing in prioritization frameworks. Your task is to analyze JIRA tickets and provide IFS (Impact-Feasibility-Scalability) scores.

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
${parentEpic ? `\nParent Epic: ${parentEpic} - Consider how this ticket contributes to the Epic's overall goals.` : ''}

## Scoring Guidelines:

### Impact (1-10): Business value and strategic importance
- 9-10: Critical business blocker, high revenue impact, urgent timeline (weeks), affects many users/teams
- 7-8: Significant business value, clear ROI, moderate urgency, affects key workflows
- 5-6: Standard business value, indirect benefits, normal priority
- 3-4: Low business impact, nice-to-have, minimal user impact
- 1-2: Negligible impact, no clear business case
${issueType === 'Bug' ? '\n**Bug Impact Modifier**: Critical/blocker bugs should score 8-10, major bugs 6-8, minor bugs 3-5.' : ''}

### Feasibility (1-10): Implementation readiness and complexity
- 9-10: Simple implementation, clear requirements, existing patterns/tools, minimal dependencies
- 7-8: Moderate complexity, well-understood domain, some dependencies
- 5-6: Standard complexity, requires design work, multiple dependencies
- 3-4: Complex implementation, legacy systems, unclear requirements, many dependencies
- 1-2: Very complex, requires significant research, high technical risk
${issueType === 'Bug' ? '\n**Bug Feasibility Modifier**: Well-isolated bugs with clear reproduction = higher feasibility. Intermittent or cross-cutting bugs = lower.' : ''}

### Scalability (1-10): Reuse and automation potential
- 9-10: Fully automated, reusable across organization, self-service capable
- 7-8: Partially automated, reusable across multiple teams/projects
- 5-6: Some reuse potential, manual intervention required
- 3-4: Limited reuse, mostly one-off solution
- 1-2: Single-use, no reuse potential
${issueType === 'Bug' ? '\n**Bug Scalability Modifier**: Fixing root causes that prevent future bugs = higher scalability. One-off fixes = lower.' : ''}

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
