import { NextResponse } from 'next/server'
import { getIncompleteItems, transformIssue } from '@/lib/jira'

// GET /api/jira/incomplete?projectKey=XXX&issueType=Story
// Returns incomplete items of a specific type for prioritization
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey')
    const issueType = searchParams.get('issueType')

    if (!projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }

    if (!issueType) {
      return NextResponse.json(
        { error: 'Issue type is required' },
        { status: 400 }
      )
    }

    const issues = await getIncompleteItems(projectKey, issueType)
    const items = issues.map(transformIssue)

    return NextResponse.json({
      items,
      count: items.length,
      issueType,
    })
  } catch (error) {
    console.error('Error fetching incomplete items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch incomplete items' },
      { status: 500 }
    )
  }
}
