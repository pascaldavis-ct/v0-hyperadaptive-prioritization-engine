import { generateText, Output } from 'ai'
import { z } from 'zod'

// Schema for structured IFS analysis output (same as single ticket)
const ifsAnalysisSchema = z.object({
  impactScore: z.number().min(1).max(10),
  feasibilityScore: z.number().min(1).max(10),
  scalabilityScore: z.number().min(1).max(10),
  workType: z.enum(['enablement', 'activation']),
  rationale: z.object({
    impact: z.string(),
    feasibility: z.string(),
    scalability: z.string(),
  }),
})

// Input ticket type
interface TicketInput {
  key: string
  title: string
  description: string
  issueType: string
  status: string
}

// Result type for each analyzed ticket
interface BatchResult {
  key: string
  title: string
  status: string
  impactScore: number
  feasibilityScore: number
  scalabilityScore: number
  totalScore: number
  workType: 'enablement' | 'activation'
  rationale: {
    impact: string
    feasibility: string
    scalability: string
  }
  error?: string
}

// System prompt for batch analysis (same strict scoring as single)
function getSystemPrompt(issueType: string, completedWorkSummary: string) {
  return `You are an expert business analyst. Analyze this JIRA ticket and provide IFS scores.

${completedWorkSummary ? `**Context**: ${completedWorkSummary}` : ''}

**CRITICAL**: Be HARSH. Default scores are 4-5. Only add points with EXPLICIT evidence.
- 70% of tickets: 3-5 scores
- 25% of tickets: 6-7 scores  
- 5% of tickets: 8+ (RARE)

### Impact (1-10): START AT 4
+3-4 IF: Revenue figures, executive sponsor, hard deadline
-2-3 IF: No business case, vague benefits

### Feasibility (1-10): START AT 5
+2-3 IF: Trivial change, exact solution known
-2-3 IF: Research needed, unknowns, dependencies

### Scalability (1-10): START AT 4
+3-4 IF: Designed as platform/API
-2-3 IF: One-off, no reuse

${issueType === 'Bug' ? 'Bugs: Impact 3-5, Feasibility 4-6, Scalability 2-4 typical.' : ''}
${issueType === 'Sub-task' ? 'Sub-tasks: Usually lower scalability (2-4), focused scope.' : ''}

Work Type: "enablement" = infrastructure/platform, "activation" = direct delivery`
}

export async function POST(req: Request) {
  try {
    const { tickets, organizationalContext, issueType, completedWorkSummary } = await req.json()

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return Response.json(
        { error: 'Tickets array is required' },
        { status: 400 }
      )
    }

    const results: BatchResult[] = []
    const systemPrompt = getSystemPrompt(issueType, completedWorkSummary)

    // Process tickets sequentially to avoid rate limits
    for (const ticket of tickets as TicketInput[]) {
      try {
        const ticketContent = `[${ticket.key}] ${ticket.title}\n\nStatus: ${ticket.status}\n\n${ticket.description || 'No description provided.'}`

        const userPrompt = `## Context:
${organizationalContext || 'No organizational context.'}

## Ticket:
${ticketContent}

Provide IFS scores with brief rationale.`

        const { output } = await generateText({
          model: 'anthropic/claude-sonnet-4',
          output: Output.object({
            schema: ifsAnalysisSchema,
          }),
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })

        if (output) {
          const totalScore = output.impactScore * output.feasibilityScore * output.scalabilityScore
          results.push({
            key: ticket.key,
            title: ticket.title,
            status: ticket.status,
            impactScore: output.impactScore,
            feasibilityScore: output.feasibilityScore,
            scalabilityScore: output.scalabilityScore,
            totalScore,
            workType: output.workType,
            rationale: output.rationale,
          })
        }
      } catch (ticketError) {
        // Add failed ticket with error
        results.push({
          key: ticket.key,
          title: ticket.title,
          status: ticket.status,
          impactScore: 0,
          feasibilityScore: 0,
          scalabilityScore: 0,
          totalScore: 0,
          workType: 'activation',
          rationale: {
            impact: 'Analysis failed',
            feasibility: 'Analysis failed',
            scalability: 'Analysis failed',
          },
          error: ticketError instanceof Error ? ticketError.message : 'Unknown error',
        })
      }
    }

    // Sort by total score descending
    results.sort((a, b) => b.totalScore - a.totalScore)

    return Response.json({
      success: true,
      results,
      summary: {
        total: results.length,
        analyzed: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
      },
    })
  } catch (error) {
    console.error('[v0] Batch analysis error:', error)
    return Response.json(
      { error: 'Batch analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
