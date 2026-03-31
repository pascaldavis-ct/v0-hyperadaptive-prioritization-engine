import { NextRequest, NextResponse } from 'next/server'
import { getIssue, transformIssue } from '@/lib/jira'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    
    if (!key) {
      return NextResponse.json(
        { error: 'Issue key is required' },
        { status: 400 }
      )
    }
    
    const issue = await getIssue(key)
    const transformedIssue = transformIssue(issue)
    
    return NextResponse.json({ issue: transformedIssue })
  } catch (error) {
    console.error('Failed to fetch JIRA issue:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to fetch issue'
    
    if (message.includes('Missing JIRA credentials')) {
      return NextResponse.json(
        { error: 'JIRA credentials not configured. Please set environment variables.' },
        { status: 503 }
      )
    }
    
    // Handle 404 specifically
    if (message.includes('404')) {
      return NextResponse.json(
        { error: `Issue ${key} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
