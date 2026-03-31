import { NextResponse } from 'next/server'
import { getProjects } from '@/lib/jira'

export async function GET() {
  try {
    const projects = await getProjects()
    
    // Return simplified project list
    const simplifiedProjects = projects.map(p => ({
      id: p.id,
      key: p.key,
      name: p.name,
      type: p.projectTypeKey,
      avatar: p.avatarUrls?.['32x32'] || null,
    }))
    
    return NextResponse.json({ projects: simplifiedProjects })
  } catch (error) {
    console.error('Failed to fetch JIRA projects:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to fetch projects'
    
    // Check for credential errors
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
