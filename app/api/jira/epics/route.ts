import { NextResponse } from 'next/server'
import { getProjectEpics, transformIssue } from '@/lib/jira'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey')
    const maxResults = parseInt(searchParams.get('maxResults') || '100')
    
    if (!projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }
    
    console.log('[v0] Epics API: Fetching epics for project:', projectKey)
    const epics = await getProjectEpics(projectKey, maxResults)
    console.log('[v0] Epics API: Found', epics.length, 'epics')
    
    // Transform to our internal format
    const transformedEpics = epics.map(transformIssue)
    
    return NextResponse.json({ epics: transformedEpics })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch epics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
