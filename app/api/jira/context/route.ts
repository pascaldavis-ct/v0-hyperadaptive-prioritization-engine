import { NextResponse } from 'next/server'
import { 
  getExecutiveSummaryTickets, 
  getAllCompletedWork,
  transformIssue 
} from '@/lib/jira'

// GET /api/jira/context?projectKey=XXX
// Returns Executive Summary tickets + All completed work for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey')

    if (!projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }

    // Fetch both in parallel
    const [executiveSummaryIssues, completedIssues] = await Promise.all([
      getExecutiveSummaryTickets(projectKey),
      getAllCompletedWork(projectKey),
    ])

    // Transform to our format
    const executiveSummaries = executiveSummaryIssues.map(transformIssue)
    const completedWork = completedIssues.map(transformIssue)

    // Group completed work by issue type for easier filtering
    const completedByType: Record<string, typeof completedWork> = {}
    for (const item of completedWork) {
      const type = item.issueType
      if (!completedByType[type]) {
        completedByType[type] = []
      }
      completedByType[type].push(item)
    }

    return NextResponse.json({
      executiveSummaries,
      completedWork,
      completedByType,
      summary: {
        executiveSummaryCount: executiveSummaries.length,
        completedWorkCount: completedWork.length,
        completedByTypeCount: Object.fromEntries(
          Object.entries(completedByType).map(([type, items]) => [type, items.length])
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching project context:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project context' },
      { status: 500 }
    )
  }
}
