// JIRA API Client Library
// Server-side only - uses environment variables for authentication

export interface JiraProject {
  id: string
  key: string
  name: string
  projectTypeKey: string
  avatarUrls?: {
    '48x48': string
    '24x24': string
    '16x16': string
    '32x32': string
  }
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description: string | { content: Array<{ content: Array<{ text: string }> }> } | null
    issuetype: {
      name: string
      iconUrl: string
    }
    status: {
      name: string
      statusCategory: {
        key: string
        colorName: string
      }
    }
    priority?: {
      name: string
      iconUrl: string
    }
    labels?: string[]
    components?: Array<{ name: string }>
    created: string
    updated: string
    assignee?: {
      displayName: string
      emailAddress: string
    } | null
    reporter?: {
      displayName: string
      emailAddress: string
    } | null
    customfield_10016?: number // Story points (common field)
  }
}

export interface JiraSearchResponse {
  startAt: number
  maxResults: number
  total: number
  issues: JiraIssue[]
}

// Extract plain text from JIRA's Atlassian Document Format (ADF)
export function extractTextFromADF(description: JiraIssue['fields']['description']): string {
  if (!description) return ''
  if (typeof description === 'string') return description
  
  // Handle Atlassian Document Format (ADF)
  if (typeof description === 'object' && 'content' in description) {
    const extractText = (node: unknown): string => {
      if (!node || typeof node !== 'object') return ''
      
      const n = node as Record<string, unknown>
      
      if (n.type === 'text' && typeof n.text === 'string') {
        return n.text
      }
      
      if (Array.isArray(n.content)) {
        return n.content.map(extractText).join('')
      }
      
      return ''
    }
    
    if (Array.isArray(description.content)) {
      return description.content.map(extractText).join('\n')
    }
  }
  
  return ''
}

// Get JIRA API credentials from environment
function getJiraCredentials() {
  const instanceUrl = process.env.JIRA_INSTANCE_URL
  const email = process.env.JIRA_USER_EMAIL
  const apiToken = process.env.JIRA_API_TOKEN

  if (!instanceUrl || !email || !apiToken) {
    throw new Error('Missing JIRA credentials. Please set JIRA_INSTANCE_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN environment variables.')
  }

  // Normalize instance URL (remove trailing slash)
  const baseUrl = instanceUrl.replace(/\/$/, '')

  return {
    baseUrl,
    auth: Buffer.from(`${email}:${apiToken}`).toString('base64')
  }
}

// Make authenticated request to JIRA API
async function jiraFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { baseUrl, auth } = getJiraCredentials()
  
  const url = `${baseUrl}/rest/api/3${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`JIRA API Error: ${response.status} - ${errorText}`)
    throw new Error(`JIRA API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
}

// Get all accessible projects
export async function getProjects(): Promise<JiraProject[]> {
  const data = await jiraFetch<JiraProject[] | { values: JiraProject[] }>('/project')
  
  // API can return array directly or paginated response
  if (Array.isArray(data)) {
    return data
  }
  return data.values || []
}

// Get issues in a project (using new /search/jql endpoint)
export async function getProjectIssues(projectKey: string, maxResults = 100): Promise<JiraIssue[]> {
  const jql = `project = "${projectKey}" ORDER BY updated DESC`
  const fields = ['summary', 'description', 'issuetype', 'status', 'priority', 'labels', 'components', 'created', 'updated', 'assignee', 'reporter', 'customfield_10016']
  
  // Use POST method with the new /search/jql endpoint
  const data = await jiraFetch<JiraSearchResponse>(
    '/search/jql',
    {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields,
      }),
    }
  )
  
  return data.issues || []
}

// Get a single issue by key
export async function getIssue(issueKey: string): Promise<JiraIssue> {
  const fields = 'summary,description,issuetype,status,priority,labels,components,created,updated,assignee,reporter,customfield_10016'
  
  return jiraFetch<JiraIssue>(`/issue/${issueKey}?fields=${fields}`)
}

// Search issues with JQL (using new /search/jql endpoint)
export async function searchIssues(jql: string, maxResults = 50): Promise<JiraIssue[]> {
  const fields = ['summary', 'description', 'issuetype', 'status', 'priority', 'labels', 'components', 'created', 'updated', 'assignee', 'reporter', 'customfield_10016', 'parent']
  
  // Use POST method with the new /search/jql endpoint
  const data = await jiraFetch<JiraSearchResponse>(
    '/search/jql',
    {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields,
      }),
    }
  )
  
  return data.issues
}

// Get only Epics in a project
export async function getProjectEpics(projectKey: string, maxResults = 100): Promise<JiraIssue[]> {
  // Use quotes around "Epic" to handle both standard and custom issue type names
  const jql = `project = "${projectKey}" AND issuetype = "Epic" ORDER BY updated DESC`
  const fields = ['summary', 'description', 'issuetype', 'status', 'priority', 'labels', 'components', 'created', 'updated', 'assignee', 'reporter']
  
  console.log('[v0] getProjectEpics JQL:', jql)
  
  const data = await jiraFetch<JiraSearchResponse>(
    '/search/jql',
    {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields,
      }),
    }
  )
  
  console.log('[v0] getProjectEpics result:', data.issues?.length || 0, 'epics found')
  
  return data.issues || []
}

// Get child issues of an Epic (Stories, Tasks, Bugs - excluding Sub-tasks)
export async function getEpicChildren(epicKey: string, maxResults = 100): Promise<JiraIssue[]> {
  // "parent" field links issues to their Epic in next-gen projects
  // "Epic Link" custom field (customfield_10014) is used in classic projects
  const jql = `(parent = "${epicKey}" OR "Epic Link" = "${epicKey}") AND issuetype NOT IN (Sub-task, "Sub-task") ORDER BY updated DESC`
  const fields = ['summary', 'description', 'issuetype', 'status', 'priority', 'labels', 'components', 'created', 'updated', 'assignee', 'reporter', 'parent']
  
  const data = await jiraFetch<JiraSearchResponse>(
    '/search/jql',
    {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields,
      }),
    }
  )
  
  return data.issues || []
}

// Transform JIRA issue to our internal format for IFS scoring
export interface TransformedIssue {
  key: string
  title: string
  description: string
  issueType: string
  status: string
  statusColor: string
  priority: string
  labels: string[]
  components: string[]
  assignee: string | null
  reporter: string | null
  created: string
  updated: string
  storyPoints: number | null
}

export function transformIssue(issue: JiraIssue): TransformedIssue {
  return {
    key: issue.key,
    title: issue.fields.summary,
    description: extractTextFromADF(issue.fields.description),
    issueType: issue.fields.issuetype.name,
    status: issue.fields.status.name,
    statusColor: issue.fields.status.statusCategory.colorName,
    priority: issue.fields.priority?.name || 'None',
    labels: issue.fields.labels || [],
    components: issue.fields.components?.map(c => c.name) || [],
    assignee: issue.fields.assignee?.displayName || null,
    reporter: issue.fields.reporter?.displayName || null,
    created: issue.fields.created,
    updated: issue.fields.updated,
    storyPoints: issue.fields.customfield_10016 || null,
  }
}
