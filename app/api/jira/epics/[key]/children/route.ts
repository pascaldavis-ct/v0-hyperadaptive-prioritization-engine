import { NextResponse } from 'next/server'
import { getEpicChildren, transformIssue } from '@/lib/jira'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: epicKey } = await params
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '100')
    
    if (!epicKey) {
      return NextResponse.json(
        { error: 'Epic key is required' },
        { status: 400 }
      )
    }
    
    console.log('[v0] Epic children API called for:', epicKey)
    const children = await getEpicChildren(epicKey, maxResults)
    console.log('[v0] Got', children.length, 'children from JIRA')
    
    // Transform to our internal format
    const transformedChildren = children.map(transformIssue)
    console.log('[v0] Transformed', transformedChildren.length, 'children')
    
    return NextResponse.json({ 
      epicKey,
      children: transformedChildren,
      count: transformedChildren.length
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch epic children'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
