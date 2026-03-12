import { generateText, Output } from 'ai'
import { z } from 'zod'

const analysisSchema = z.object({
  bottleneckReasoning: z
    .string()
    .describe(
      'Detailed explanation of the primary bottleneck identified and how the proposed solution addresses it'
    ),
  impactScore: z
    .number()
    .min(1)
    .max(5)
    .describe(
      '1-5 score: 5 = Eliminates primary bottleneck, 1 = Minimal value'
    ),
  impactRationale: z
    .string()
    .describe('Brief explanation for the impact score'),
  feasibilityScore: z
    .number()
    .min(1)
    .max(5)
    .describe(
      '1-5 score: 5 = All assets ready (2-4 weeks), 1 = Not feasible'
    ),
  feasibilityRationale: z
    .string()
    .describe('Brief explanation for the feasibility score'),
  scalabilityScore: z
    .number()
    .min(1)
    .max(5)
    .describe(
      '1-5 score: 5 = Fully automated API (10k+ executions), 1 = Manual prompting'
    ),
  scalabilityRationale: z
    .string()
    .describe('Brief explanation for the scalability score'),
})

export async function POST(req: Request) {
  const { clientContext, userStory } = await req.json()

  const { output } = await generateText({
    model: 'openai/gpt-5-mini',
    output: Output.object({
      schema: analysisSchema,
    }),
    messages: [
      {
        role: 'system',
        content: `You are a Forward Deployed Engineer AI assistant that helps prioritize GenAI projects using the IFS (Impact, Feasibility, Scalability) framework.

Analyze the provided client context and user story/PRD to assess:

1. **Impact (I)**: How much value does this deliver?
   - 5 = Eliminates primary bottleneck
   - 4 = Significant improvement
   - 3 = Moderate improvement
   - 2 = Minor improvement
   - 1 = Minimal value

2. **Feasibility (F)**: Can this be built with available resources?
   - 5 = All assets ready, can ship in 2-4 weeks
   - 4 = Most assets available, minor gaps
   - 3 = Some assets available, moderate effort needed
   - 2 = Significant blockers exist
   - 1 = Not feasible with current resources

3. **Scalability (S)**: How well can this scale?
   - 5 = Fully automated API (10k+ executions/month)
   - 4 = Highly automated with minor manual oversight
   - 3 = Semi-automated, some manual intervention
   - 2 = Mostly manual with automation potential
   - 1 = Manual prompting only

Provide thoughtful, specific reasoning tied to the actual context provided.`,
      },
      {
        role: 'user',
        content: `## Client Context
${clientContext}

## User Story / PRD
${userStory}

Please analyze this GenAI project opportunity and provide your IFS assessment.`,
      },
    ],
  })

  return Response.json(output)
}
