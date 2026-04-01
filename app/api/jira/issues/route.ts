import { NextRequest, NextResponse } from 'next/server'
import { getProjectIssues, transformIssue } from '@/lib/jira'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey') || searchParams.get('project')
    const maxResults = parseInt(searchParams.get('maxResults') || '100', 10)
    
    if (!projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }
    
    const issues = await getProjectIssues(projectKey, maxResults)
    
    // Transform issues to our internal format
    const transformedIssues = issues.map(transformIssue)
    
    return NextResponse.json({ 
      issues: transformedIssues,
      total: transformedIssues.length,
      projectKey 
    })
  } catch (error) {
    console.error('Failed to fetch JIRA issues:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to fetch issues'
    
    if (message.includes('Missing JIRA credentials')) {
      return NextResponse.json(
        { error: 'JIRA credentials not configured. Please set environment variables.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
