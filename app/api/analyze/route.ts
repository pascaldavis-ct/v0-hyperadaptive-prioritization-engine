import { generateText, Output } from 'ai'
import { z } from 'zod'

const analysisSchema = z.object({
  // Overall strategic reasoning
  strategicRationale: z
    .string()
    .describe(
      '2-3 sentence executive summary explaining the strategic value of this initiative and how it addresses the identified bottleneck within the client context'
    ),
  
  // Impact Score (1-10)
  impactScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'Impact score 1-10 based on IFS rubric: 1-3 = Localized task speed-up, 4-7 = Reduces handoffs/rework in secondary bottleneck, 8-10 = Resolves primary constraint (10x faster step = 10x faster process)'
    ),
  impactRationale: z
    .string()
    .describe('1-2 sentence explanation for the impact score, referencing specific details from the initiative description'),
  
  // Feasibility Score (1-10)
  feasibilityScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'Feasibility score 1-10 based on IFS rubric: 1-3 = Requires significant enablement (data cleanup/infrastructure), 4-7 = Minor gaps in assets, 8-10 = All assets ready with high organizational pull to adopt'
    ),
  feasibilityRationale: z
    .string()
    .describe('1-2 sentence explanation for the feasibility score, referencing data readiness and organizational factors'),
  
  // Scalability Score (1-10)
  scalabilityScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'Scalability score 1-10 based on IFS rubric: 1-3 = Manual/one-off prompting, 4-7 = Hybrid with human-in-the-loop for >30% of outputs, 8-10 = Fully automated via API at machine speed'
    ),
  scalabilityRationale: z
    .string()
    .describe('1-2 sentence explanation for the scalability score, referencing automation potential and execution volume'),
  
  // Detected work type
  detectedWorkType: z
    .enum(['activation', 'enablement'])
    .describe('Whether this is an Activation use case (direct business value) or Enablement use case (foundational infrastructure that unlocks other initiatives)'),
  
  // Primary bottleneck identified
  primaryBottleneck: z
    .string()
    .describe('The main workflow constraint or bottleneck this initiative addresses'),
})

export async function POST(req: Request) {
  const { clientContext, initiativeTitle, useCaseDescription, organizationalFocus } = await req.json()

  const { output } = await generateText({
    model: 'openai/gpt-5-mini',
    output: Output.object({
      schema: analysisSchema,
    }),
    messages: [
      {
        role: 'system',
        content: `You are a Strategic Analyst AI that scores GenAI initiatives using the IFS (Impact, Feasibility, Scalability) framework.

## IFS SCORING RUBRIC

### IMPACT (Systemic Flow) - "Does this eliminate the primary Wait State blocking the end-to-end workflow?"
Principle: Focus on Flow, not just Tasks
- Score 1-3: Localized task speed-up; doesn't affect overall cycle time.
- Score 4-7: Reduces handoffs/rework in a secondary bottleneck.
- Score 8-10: Resolves a primary constraint; 10x faster step = 10x faster process.

### FEASIBILITY (Foundational Readiness) - "Are the data, APIs, and Human Systems ready to support this today?"
Principle: Readiness over Ambition
- Score 1-3: Requires significant "Enablement" (data cleanup/infrastructure).
- Score 4-7: Minor gaps; team is skilled but assets need refinement.
- Score 8-10: All assets ready (SSOT verified); high "Organizational Pull" to adopt.

### SCALABILITY (Autonomous Velocity) - "Can this execute 10,000+ times without a new human bottleneck?"
Principle: Machine Speed over Human Pace
- Score 1-3: Manual/one-off prompting; high variable cost per execution.
- Score 4-7: Hybrid; human-in-the-loop required for >30% of outputs.
- Score 8-10: Fully automated via API; runs at machine speed with sustainable economics.

## WORK TYPE DETECTION
- **Activation**: Direct business value delivery (e.g., automating a customer-facing process)
- **Enablement**: Foundational infrastructure that unlocks multiple downstream Activation use cases (e.g., building a data API, creating a brand asset repository)

## SCORING GUIDELINES
1. Be specific - reference actual details from the provided context
2. Consider the organizational focus when evaluating impact
3. Look for explicit mentions of data readiness, existing systems, and timelines
4. Identify automation potential based on the described workflow
5. Provide concrete, actionable rationale that the stakeholder can use to justify the scores`,
      },
      {
        role: 'user',
        content: `## CLIENT CONTEXT
${clientContext}

## ORGANIZATIONAL FOCUS
${organizationalFocus}

## INITIATIVE TITLE
${initiativeTitle}

## INITIATIVE DESCRIPTION
${useCaseDescription}

Please analyze this GenAI initiative and provide your IFS assessment with scores from 1-10 and strategic rationale.`,
      },
    ],
  })

  return Response.json(output)
}
