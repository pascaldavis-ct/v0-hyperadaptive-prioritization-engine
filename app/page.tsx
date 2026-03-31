'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import {
  Brain,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
  Info,
  ChevronDown,
  ChevronsUpDown,
  Check,
  CheckSquare,
  Database,
  
  Search,
  Gauge,
  Target,
  Rocket,
  Lightbulb,
  FlaskConical,
  Trash2,
  Volume2,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  History,
  X,
  Settings2,
  Lock,
  Unlock,
  Plus,
  AlertCircle,
  
  FileText,
  FolderOpen,
} from 'lucide-react'
import type { TransformedIssue } from '@/lib/jira'

// Types
interface JiraProject {
  id: string
  key: string
  name: string
  type: string
  avatar: string | null
}

interface Archetype {
  name: string
  action: string
  color: string
  icon: React.ReactNode
  description: string
}

interface OverrideHistoryEntry {
  field: string
  previousValue: number
  newValue: number
  reason: string
  timestamp: Date
}

// Archetype thresholds calibrated for realistic scoring (most scores 3-6 range)
// Total Score = I × F × S
// Typical range: 3×4×3=36 to 6×6×6=216
// Expected distribution: Most tickets 40-100, exceptional >150
function getArchetype(
  totalScore: number,
  impact: number,
  scalability: number,
  feasibility: number,
  workType: 'enablement' | 'activation'
): Archetype {
  // Transformer: Exceptional across all dimensions (top 5%)
  // Requires high scores in ALL dimensions: 6+ average = 216+, or 7×6×5=210
  if (totalScore > 150) {
    return {
      name: 'Transformer',
      action: 'Immediate Delivery',
      color: 'bg-blue-500',
      icon: <Rocket className="h-5 w-5" />,
      description: 'High impact, feasibility, and scalability. Ship immediately.',
    }
  }

  // Foundation: High strategic value but complex implementation
  if (impact >= 6 && scalability >= 6 && feasibility <= 4 && workType === 'enablement') {
    return {
      name: 'The Foundation',
      action: 'Fund Infrastructure (Enablement)',
      color: 'bg-purple-500',
      icon: <Layers className="h-5 w-5" />,
      description: 'Critical enablement work. Invest in infrastructure first.',
    }
  }

  // Quick Win: Easy to do with decent payoff (25% of tickets)
  if (feasibility >= 6 && impact >= 4 && impact <= 6 && totalScore >= 60) {
    return {
      name: 'Quick Win',
      action: 'Build Momentum',
      color: 'bg-green-500',
      icon: <Zap className="h-5 w-5" />,
      description: 'High feasibility with moderate impact. Build momentum.',
    }
  }

  // Experiment: Moderate potential, needs validation (30% of tickets)
  // 4×4×4=64 to 5×5×5=125 range
  if (totalScore >= 50 && totalScore <= 125) {
    return {
      name: 'The Experiment',
      action: 'Time-box Prompting Party',
      color: 'bg-yellow-500',
      icon: <FlaskConical className="h-5 w-5" />,
      description: 'Moderate potential. Time-box exploration to validate.',
    }
  }

  // Money Pit: Easy but won't scale
  if (scalability <= 3 && feasibility >= 6) {
    return {
      name: 'Money Pit',
      action: 'Defer - Manual/Non-Scalable',
      color: 'bg-orange-500',
      icon: <Trash2 className="h-5 w-5" />,
      description: "Easy to build but won't scale. Defer or redesign.",
    }
  }

  // Noise: Low value across dimensions (20% of tickets)
  // Below 3×4×3=36 or 4×3×3=36
  if (totalScore < 40) {
    return {
      name: 'The Noise',
      action: 'Discard',
      color: 'bg-gray-500',
      icon: <Volume2 className="h-5 w-5" />,
      description: 'Low value across all dimensions. Discard.',
    }
  }

  // Under Review: Doesn't fit other categories
  return {
    name: 'Under Review',
    action: 'Further Analysis Needed',
    color: 'bg-slate-500',
    icon: <Target className="h-5 w-5" />,
    description: 'Requires additional discovery to classify.',
  }
}

function generateReasoning(
  impact: number,
  feasibility: number,
  scalability: number,
  totalScore: number,
  archetype: Archetype,
  impactHint?: string,
  hasStrategicBonus?: boolean
): string {
  let reasoning = ''
  
  if (hasStrategicBonus) {
    reasoning += 'STRATEGIC ALIGNMENT: Initiative aligns with organizational focus. '
  }

  if (impactHint) {
    const velocityAnalysis = scalability >= 7
      ? 'High Autonomous Velocity: Can execute at machine speed without human bottlenecks.'
      : scalability >= 4
      ? 'Moderate Velocity: Hybrid execution with human-in-the-loop for some outputs.'
      : 'Low Velocity: Manual prompting required; high variable cost per execution.'
    
    return reasoning + `${impactHint} ${velocityAnalysis}`
  }

  const flowAnalysis = impact >= 7
    ? 'Systemic Flow: Resolves primary Wait State constraint.'
    : impact >= 4
    ? 'Partial Flow: Reduces handoffs in secondary bottleneck.'
    : 'Localized: Task speed-up without systemic flow impact.'

  const velocityAnalysis = scalability >= 7
    ? 'High Autonomous Velocity.'
    : scalability >= 4
    ? 'Moderate Velocity with human oversight.'
    : 'Low Velocity; manual execution required.'

  return reasoning + `${flowAnalysis} ${velocityAnalysis}`
}

export default function HyperadaptivePrioritizationEngine() {
  const { toast } = useToast()
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Project Selection
  const [projects, setProjects] = useState<JiraProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  const [projectComboboxOpen, setProjectComboboxOpen] = useState(false)
  
  // Step 1: Context Input
  const [contextMethod, setContextMethod] = useState<'manual' | 'pdf' | 'ticket'>('manual')
  const [clientContext, setClientContext] = useState('')
  
  // AI-detected organizational focus (derived from context analysis)
  const [detectedOrganizationalFocus, setDetectedOrganizationalFocus] = useState<string>('')
  const [strategicAlignmentScore, setStrategicAlignmentScore] = useState<number>(0)
  
  // Step 2: Context & Ticket Selection (Hierarchical)
  // Auto-loaded context data
  const [executiveSummaries, setExecutiveSummaries] = useState<TransformedIssue[]>([])
  const [completedWork, setCompletedWork] = useState<TransformedIssue[]>([])
  const [completedByType, setCompletedByType] = useState<Record<string, TransformedIssue[]>>({})
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  
  // Issue type selection for prioritization
  const [selectedIssueType, setSelectedIssueType] = useState<'Epic' | 'Story' | 'Sub-task'>('Story')
  const [incompleteItems, setIncompleteItems] = useState<TransformedIssue[]>([])
  const [isLoadingIncomplete, setIsLoadingIncomplete] = useState(false)
  
  // Batch scoring results
  type BatchResult = {
    key: string
    title: string
    status: string
    impactScore: number
    feasibilityScore: number
    scalabilityScore: number
    totalScore: number
    workType: 'enablement' | 'activation'
    rationale: {
      impact: string
      feasibility: string
      scalability: string
    }
    error?: string
  }
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [sortColumn, setSortColumn] = useState<'totalScore' | 'impactScore' | 'feasibilityScore' | 'scalabilityScore' | 'key'>('totalScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Selected result for detailed view
  const [selectedResult, setSelectedResult] = useState<BatchResult | null>(null)
  
  // Step 3: Scoring & Analysis (legacy - kept for single ticket mode if needed)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiRationale, setAiRationale] = useState<{
    strategic: string
    impact: string
    feasibility: string
    scalability: string
    primaryBottleneck: string
  } | null>(null)
  const [aiOriginalScores, setAiOriginalScores] = useState<{
    impact: number
    feasibility: number
    scalability: number
  } | null>(null)
  
  // Human Override Mode
  const [isHumanOverrideActive, setIsHumanOverrideActive] = useState(false)
  const [humanOverrideDisclaimer, setHumanOverrideDisclaimer] = useState('')
  
  // Input state
  const [workType, setWorkType] = useState<'enablement' | 'activation'>('activation')
  const [makes10xFaster, setMakes10xFaster] = useState(false)

  // IFS Scores (1-10 scale)
  const [impact, setImpact] = useState(5)
  const [feasibility, setFeasibility] = useState(5)
  const [scalability, setScalability] = useState(5)

  // Override History
  const [overrideHistory, setOverrideHistory] = useState<OverrideHistoryEntry[]>([])

  // Framework visibility
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(true)

  // Filter and sort projects alphabetically
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        if (!projectSearchQuery.trim()) return true
        const query = projectSearchQuery.toLowerCase()
        return p.name.toLowerCase().includes(query) || p.key.toLowerCase().includes(query)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [projects, projectSearchQuery])

  // Filter incomplete items by search query
  const filteredIncompleteItems = useMemo(() => {
    return incompleteItems
      .filter(t => {
        if (!ticketSearchQuery.trim()) return true
        const query = ticketSearchQuery.toLowerCase()
        return t.title.toLowerCase().includes(query) || t.key.toLowerCase().includes(query)
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [incompleteItems, ticketSearchQuery])

  // Build hierarchical context based on selected issue type
  const hierarchicalContext = useMemo(() => {
    // Get the types needed for context based on what we're scoring
    const getContextTypes = (issueType: 'Epic' | 'Story' | 'Sub-task'): string[] => {
      switch (issueType) {
        case 'Epic':
          return ['Epic']
        case 'Story':
          return ['Story', 'Task', 'Epic']
        case 'Sub-task':
          return ['Sub-task', 'Story', 'Task', 'Epic']
      }
    }
    
    const contextTypes = getContextTypes(selectedIssueType)
    const relevantCompleted = completedWork.filter(item => 
      contextTypes.includes(item.issueType)
    )
    
    return {
      executiveSummaries,
      completedWork: relevantCompleted,
      contextTypes,
    }
  }, [selectedIssueType, executiveSummaries, completedWork])

  // Load JIRA projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoadingProjects(true)
    setProjectError(null)
    
    try {
      const response = await fetch('/api/jira/projects')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects')
      }
      
      setProjects(data.projects)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects'
      setProjectError(message)
      toast({
        title: 'Error Loading Projects',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // Load project context (Executive Summaries + Completed Work) when project is selected
  const loadProjectContext = async (projectKey: string) => {
    setIsLoadingContext(true)
    setExecutiveSummaries([])
    setCompletedWork([])
    setCompletedByType({})
    setSelectedTicket(null)
    // Clear previous additional notes when switching projects
    setClientContext('')
    
    try {
      const response = await fetch(`/api/jira/context?projectKey=${projectKey}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project context')
      }
      
      setExecutiveSummaries(data.executiveSummaries || [])
      setCompletedWork(data.completedWork || [])
      setCompletedByType(data.completedByType || {})
      
      // Context is auto-loaded - no need to populate clientContext
      // clientContext is now reserved for optional additional notes only
      
      toast({
        title: 'Project Context Loaded',
        description: `${data.executiveSummaries?.length || 0} Executive Summaries, ${data.completedWork?.length || 0} completed items`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load context'
      toast({
        title: 'Error Loading Context',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingContext(false)
    }
  }

  // Load incomplete items when issue type is selected
  const loadIncompleteItems = async (projectKey: string, issueType: string) => {
    setIsLoadingIncomplete(true)
    setIncompleteItems([])
    setSelectedTicket(null)
    
    try {
      const response = await fetch(`/api/jira/incomplete?projectKey=${projectKey}&issueType=${issueType}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load incomplete items')
      }
      
      setIncompleteItems(data.items || [])
      
      if ((data.items || []).length === 0) {
        toast({
          title: `No Incomplete ${issueType}s`,
          description: `All ${issueType}s in this project are completed.`,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load items'
      toast({
        title: 'Error Loading Items',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingIncomplete(false)
    }
  }

  // Handle project selection - auto-load context
  const handleProjectSelect = (projectKey: string) => {
    const project = projects.find(p => p.key === projectKey)
    if (project) {
      setSelectedProject(project)
      setBatchResults([])
      setSelectedResult(null)
      loadProjectContext(projectKey)
      loadIncompleteItems(projectKey, selectedIssueType)
    }
  }

  // Handle issue type change - reload incomplete items and clear previous results
  const handleIssueTypeChange = (issueType: 'Epic' | 'Story' | 'Sub-task') => {
    setSelectedIssueType(issueType)
    setBatchResults([])
    setSelectedResult(null)
    if (selectedProject) {
      loadIncompleteItems(selectedProject.key, issueType)
    }
  }

  // Confirm context and proceed to Step 2
  const handleConfirmContext = () => {
    if (!selectedProject) {
      toast({
        title: 'Project Required',
        description: 'Please select a JIRA project.',
        variant: 'destructive',
      })
      return
    }
    
    setCurrentStep(2)
    toast({
      title: 'Context Confirmed',
      description: 'Now select a ticket to prioritize.',
    })
  }

  // Handle ticket selection (from incomplete items)
  const handleTicketSelect = (ticketKey: string) => {
    const ticket = incompleteItems.find(t => t.key === ticketKey)
    if (ticket) {
      setSelectedTicket(ticket)
    }
  }

  // Strategic Alignment is now determined by LLM (strategicAlignmentScore >= 7 = bonus)
  const hasStrategicBonus = strategicAlignmentScore >= 7

  // Run AI Analysis (LLM-based)
  const runAnalysis = useCallback(async () => {
    if (!selectedTicket) return
    
    setIsAnalyzing(true)
    
    // Build ticket content for LLM analysis (excluding JIRA priority to allow user override)
    const ticketContent = [
      `Title: ${selectedTicket.title}`,
      `Key: ${selectedTicket.key}`,
      selectedTicket.description ? `Description: ${selectedTicket.description}` : '',
      `Issue Type: ${selectedTicket.issueType}`,
      `Status: ${selectedTicket.status}`,
      selectedTicket.labels.length > 0 ? `Labels: ${selectedTicket.labels.join(', ')}` : '',
      selectedTicket.components.length > 0 ? `Components: ${selectedTicket.components.join(', ')}` : '',
    ].filter(Boolean).join('\n')
    
    try {
      // Build hierarchical context for LLM
      // Include Executive Summaries + completed work of same type and parent types
      const contextParts: string[] = []
      
      // Add Executive Summary context
      if (hierarchicalContext.executiveSummaries.length > 0) {
        contextParts.push('=== EXECUTIVE SUMMARIES (Strategic Priorities) ===')
        hierarchicalContext.executiveSummaries.forEach(es => {
          contextParts.push(`[${es.key}] ${es.title}\n${es.description || 'No description'}`)
        })
      }
      
      // Add completed work context (hierarchical based on issue type)
      if (hierarchicalContext.completedWork.length > 0) {
        contextParts.push(`\n=== COMPLETED WORK (${hierarchicalContext.contextTypes.join(', ')}) ===`)
        contextParts.push(`(${hierarchicalContext.completedWork.length} items completed - showing first 20)`)
        hierarchicalContext.completedWork.slice(0, 20).forEach(item => {
          contextParts.push(`[${item.key}] [${item.issueType}] ${item.title}`)
        })
      }
      
      const fullContext = contextParts.join('\n')
      
      // Call LLM-based analysis API with type-aware scoring and hierarchical context
      const response = await fetch('/api/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketContent,
          organizationalContext: fullContext,
          issueType: selectedTicket.issueType,
          completedWorkSummary: `${hierarchicalContext.completedWork.length} completed ${hierarchicalContext.contextTypes.join('/')} items`,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }
      
      const data = await response.json()
      
      if (!data.analysis) {
        throw new Error('No analysis returned from API')
      }
      
      const { analysis } = data
      
      // Store AI rationale
      setAiRationale({
        strategic: analysis.rationale.strategic,
        impact: analysis.rationale.impact,
        feasibility: analysis.rationale.feasibility,
        scalability: analysis.rationale.scalability,
        primaryBottleneck: analysis.rationale.primaryBottleneck,
      })
      
      // Store original AI scores for override detection
      setAiOriginalScores({
        impact: analysis.impactScore,
        feasibility: analysis.feasibilityScore,
        scalability: analysis.scalabilityScore,
      })
      
      // Set sliders to AI-recommended positions
      setImpact(analysis.impactScore)
      setFeasibility(analysis.feasibilityScore)
      setScalability(analysis.scalabilityScore)
      
      // Set work type based on detection
      setWorkType(analysis.workType)
      
      // Set AI-detected organizational focus and strategic alignment
      setDetectedOrganizationalFocus(analysis.organizationalFocus)
      setStrategicAlignmentScore(analysis.strategicAlignment)
      
      // Transition to Step 3
      setCurrentStep(3)
      setIsAnalyzing(false)
      
      toast({
        title: 'AI Analysis Complete',
        description: `IFS Scores: Impact=${analysis.impactScore}, Feasibility=${analysis.feasibilityScore}, Scalability=${analysis.scalabilityScore}`,
      })
    } catch (error) {
      setIsAnalyzing(false)
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze ticket',
        variant: 'destructive',
      })
    }
  }, [selectedTicket, hierarchicalContext, toast])

  // Run Batch Analysis for ALL incomplete items
  const runBatchAnalysis = useCallback(async () => {
    if (incompleteItems.length === 0) {
      toast({
        title: 'No Items to Analyze',
        description: `No incomplete ${selectedIssueType}s found.`,
        variant: 'destructive',
      })
      return
    }
    
    setIsBatchAnalyzing(true)
    setBatchResults([])
    setBatchProgress({ current: 0, total: incompleteItems.length })
    
    // Build context for batch analysis
    const contextParts: string[] = []
    
    if (hierarchicalContext.executiveSummaries.length > 0) {
      contextParts.push('=== EXECUTIVE SUMMARIES ===')
      hierarchicalContext.executiveSummaries.slice(0, 5).forEach(es => {
        contextParts.push(`[${es.key}] ${es.title}`)
      })
    }
    
    if (hierarchicalContext.completedWork.length > 0) {
      contextParts.push(`\n=== COMPLETED (${hierarchicalContext.completedWork.length} items) ===`)
      hierarchicalContext.completedWork.slice(0, 10).forEach(item => {
        contextParts.push(`[${item.key}] ${item.title}`)
      })
    }
    
    const organizationalContext = contextParts.join('\n')
    
    // Prepare tickets for batch API
    const ticketsToAnalyze = incompleteItems.map(item => ({
      key: item.key,
      title: item.title,
      description: item.description || '',
      issueType: item.issueType,
      status: item.status,
    }))
    
    try {
      const response = await fetch('/api/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickets: ticketsToAnalyze,
          organizationalContext,
          issueType: selectedIssueType,
          completedWorkSummary: `${hierarchicalContext.completedWork.length} completed items`,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Batch analysis failed')
      }
      
      const data = await response.json()
      setBatchResults(data.results || [])
      setBatchProgress({ current: data.results?.length || 0, total: incompleteItems.length })
      
      toast({
        title: 'Batch Analysis Complete',
        description: `Analyzed ${data.summary?.analyzed || 0} of ${data.summary?.total || 0} ${selectedIssueType}s`,
      })
    } catch (error) {
      toast({
        title: 'Batch Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze tickets',
        variant: 'destructive',
      })
    } finally {
      setIsBatchAnalyzing(false)
    }
  }, [incompleteItems, selectedIssueType, hierarchicalContext, toast])

  // Sort batch results
  const sortedBatchResults = useMemo(() => {
    return [...batchResults].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [batchResults, sortColumn, sortDirection])

  // Handle column sort
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Handle score changes
  const handleSliderChange = useCallback((field: 'impact' | 'feasibility' | 'scalability', newValue: number) => {
    if (isHumanOverrideActive) {
      setHumanOverrideDisclaimer('Score adjusted by human reviewer. Recalculating Systemic Impact...')
    }
    
    if (field === 'impact') setImpact(newValue)
    else if (field === 'feasibility') setFeasibility(newValue)
    else setScalability(newValue)
  }, [isHumanOverrideActive])

  // Calculate adjusted scores
  const adjustedImpact = useMemo(() => {
    let adjusted = impact
    if (hasStrategicBonus) adjusted = Math.min(10, adjusted + 1)
    return adjusted
  }, [impact, hasStrategicBonus])

  // Calculate Total Score
  const totalScore = useMemo(() => {
    return adjustedImpact * scalability * feasibility
  }, [adjustedImpact, scalability, feasibility])

  // Get archetype
  const archetype = useMemo(() => {
    return getArchetype(totalScore, adjustedImpact, scalability, feasibility, workType)
  }, [totalScore, adjustedImpact, scalability, feasibility, workType])

  // Generate reasoning
  const reasoning = useMemo(() => {
    return generateReasoning(
      adjustedImpact, 
      feasibility, 
      scalability, 
      totalScore, 
      archetype, 
      aiRationale?.primaryBottleneck,
      hasStrategicBonus
    )
  }, [adjustedImpact, feasibility, scalability, totalScore, archetype, aiRationale?.primaryBottleneck, hasStrategicBonus])

  // Reset to Step 1
  const resetToStep1 = () => {
    setCurrentStep(1)
    setSelectedTicket(null)
    setAiRationale(null)
    setAiOriginalScores(null)
    setImpact(5)
    setFeasibility(5)
    setScalability(5)
    setIsHumanOverrideActive(false)
    setHumanOverrideDisclaimer('')
    setOverrideHistory([])
  }

  // Reset to Step 2
  const resetToStep2 = () => {
    setCurrentStep(2)
    setSelectedTicket(null)
    setAiRationale(null)
    setAiOriginalScores(null)
    setImpact(5)
    setFeasibility(5)
    setScalability(5)
    setIsHumanOverrideActive(false)
    setHumanOverrideDisclaimer('')
    setOverrideHistory([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Hyperadaptive Prioritization Engine</h1>
              <p className="text-xs text-muted-foreground">JIRA Integration</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentStep === step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
            ))}
          </div>

          {/* IFS Framework Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFrameworkOpen(!isFrameworkOpen)}
            className="gap-2"
          >
            <Gauge className="h-4 w-4" />
            IFS Framework
            <ChevronDown className={`h-4 w-4 transition-transform ${isFrameworkOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* IFS Framework Panel */}
        {isFrameworkOpen && (
          <div className="border-t bg-muted/50 px-4 py-4">
            <div className="container">
              {/* Scoring Formula */}
              <div className="mb-4 p-3 rounded-lg bg-background/80 border">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">IFS Scoring Formula</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground">
                  Total Score = I × F × S + Bonuses
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bonuses: Strategic Alignment (+1 to Impact), Bottleneck (+0.5), 10x Velocity (+0.5)
                </p>
              </div>
              
              {/* Dimension Descriptions */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Impact (I) - Systemic Flow</p>
                    <p className="text-xs text-muted-foreground">
                      Does this eliminate the primary Wait State blocking the workflow? Measures business value, urgency, and strategic importance.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Feasibility (F) - Readiness</p>
                    <p className="text-xs text-muted-foreground">
                      Are data, APIs, and Human Systems ready to support this today? Measures implementation complexity and resource availability.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Scalability (S) - Velocity</p>
                    <p className="text-xs text-muted-foreground">
                      Can this execute 10,000+ times without new human bottlenecks? Measures reuse potential and automation capabilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container py-8">
        {/* Step 1: Project Selection & Context */}
        {currentStep === 1 && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Step 1: Set Strategic Context</h2>
              <p className="text-muted-foreground mt-2">Select a JIRA project and define the prioritization context</p>
            </div>

            {/* Project Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Select JIRA Project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectError ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Connection Error</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{projectError}</p>
                    <Button onClick={loadProjects} variant="outline" size="sm" className="mt-3">
                      Retry
                    </Button>
                  </div>
                ) : isLoadingProjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2 text-muted-foreground">Loading JIRA projects...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Searchable Project Combobox */}
                    <Popover open={projectComboboxOpen} onOpenChange={setProjectComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={projectComboboxOpen}
                          className="w-full h-12 justify-between"
                        >
                          {selectedProject ? (
                            <div className="flex items-center gap-2">
                              {selectedProject.avatar && (
                                <img src={selectedProject.avatar} alt="" className="h-5 w-5 rounded" />
                              )}
                              <span className="font-mono text-sm">{selectedProject.key}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="truncate">{selectedProject.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Search and select a project...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search projects by name or key..." 
                            value={projectSearchQuery}
                            onValueChange={setProjectSearchQuery}
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No projects found.</CommandEmpty>
                            <CommandGroup>
                              {filteredProjects.map((project) => (
                                <CommandItem
                                  key={project.key}
                                  value={`${project.key} ${project.name}`}
                                  onSelect={() => {
                                    handleProjectSelect(project.key)
                                    setProjectComboboxOpen(false)
                                    setProjectSearchQuery('')
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedProject?.key === project.key ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {project.avatar && (
                                      <img src={project.avatar} alt="" className="h-5 w-5 rounded shrink-0" />
                                    )}
                                    <span className="font-mono text-sm shrink-0">{project.key}</span>
                                    <span className="text-muted-foreground shrink-0">-</span>
                                    <span className="truncate">{project.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-muted-foreground">
                      {projects.length} projects available (sorted A-Z) - Type to search
                    </p>
                  </div>
                )}

                {selectedProject && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="font-medium">{selectedProject.name}</span>
                      <Badge variant="outline" className="font-mono">{selectedProject.key}</Badge>
                    </div>
                    {isLoadingContext ? (
                      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Spinner className="h-3 w-3" />
                        Loading project context...
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {executiveSummaries.length} Executive Summaries, {completedWork.length} completed items loaded
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes (Optional - Collapsible) */}
            <Card className={!selectedProject ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader className="pb-3">
                <button
                  onClick={() => setContextMethod(contextMethod === 'manual' ? 'ticket' : 'manual')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Additional Notes
                    <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </CardTitle>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardHeader>
              {contextMethod === 'manual' && (
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Add extra context not captured in JIRA (e.g., meeting notes, verbal decisions).
                  </p>
                  <Textarea
                    placeholder="Add any additional context that may help with prioritization..."
                    value={clientContext}
                    onChange={(e) => setClientContext(e.target.value)}
                    className="min-h-20 resize-none text-sm"
                  />
                </CardContent>
              )}
              <CardContent className={contextMethod === 'manual' ? 'pt-0' : ''}>
                <Button 
                  onClick={handleConfirmContext} 
                  className="w-full h-12"
                  disabled={!selectedProject}
                >
                  Continue to Ticket Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Ticket Selection */}
        {currentStep === 2 && (
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Context Banner */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="font-medium text-foreground">Context Active:</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedProject?.name} | {executiveSummaries.length} Exec Summaries + {completedWork.length} Completed
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetToStep1}>
                  Change
                </Button>
              </div>
              {clientContext && (
                <p className="text-sm text-muted-foreground mt-2 pl-8">+ Additional notes provided</p>
              )}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Step 2: Batch Prioritization</h2>
              <p className="text-muted-foreground mt-2">Select an issue type and score all incomplete items at once</p>
            </div>

            {/* Context Summary */}
            {isLoadingContext ? (
              <Card className="mb-6">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2 text-muted-foreground">Loading project context...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Loaded Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Executive Summaries:</span>
                      <span className="ml-2 font-medium">{executiveSummaries.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed Work:</span>
                      <span className="ml-2 font-medium">{completedWork.length}</span>
                    </div>
                  </div>
                  {Object.keys(completedByType).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(completedByType).map(([type, items]) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}: {items.length} done
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Issue Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Select Issue Type to Prioritize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedIssueType === 'Epic' ? 'default' : 'outline'}
                    onClick={() => handleIssueTypeChange('Epic')}
                    className="h-16 flex-col"
                  >
                    <Layers className="h-5 w-5 mb-1" />
                    <span>Epic</span>
                    <span className="text-xs opacity-70">Strategic</span>
                  </Button>
                  <Button
                    variant={selectedIssueType === 'Story' ? 'default' : 'outline'}
                    onClick={() => handleIssueTypeChange('Story')}
                    className="h-16 flex-col"
                  >
                    <FileText className="h-5 w-5 mb-1" />
                    <span>Story</span>
                    <span className="text-xs opacity-70">Feature</span>
                  </Button>
                  <Button
                    variant={selectedIssueType === 'Sub-task' ? 'default' : 'outline'}
                    onClick={() => handleIssueTypeChange('Sub-task')}
                    className="h-16 flex-col"
                  >
                    <CheckSquare className="h-5 w-5 mb-1" />
                    <span>Sub-task</span>
                    <span className="text-xs opacity-70">Detail</span>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Context will include: Executive Summaries + Completed {
                    selectedIssueType === 'Epic' ? 'Epics' :
                    selectedIssueType === 'Story' ? 'Stories, Tasks & Epics' :
                    'Sub-tasks, Stories, Tasks & Epics'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Batch Scoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Incomplete {selectedIssueType}s
                  {incompleteItems.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{incompleteItems.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingIncomplete ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2 text-muted-foreground">Loading {selectedIssueType}s...</span>
                  </div>
                ) : incompleteItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No incomplete {selectedIssueType}s found in {selectedProject?.key}.</p>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={runBatchAnalysis}
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={isBatchAnalyzing}
                    >
                      {isBatchAnalyzing ? (
                        <>
                          <Spinner className="mr-2 h-5 w-5" />
                          Analyzing {batchProgress.current} of {batchProgress.total}...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-5 w-5" />
                          Score All {incompleteItems.length} {selectedIssueType}s
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      AI will analyze each item against Executive Summaries and completed work context
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Batch Results Table */}
            {batchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Prioritization Results
                    </div>
                    <Badge variant="outline">{batchResults.length} items scored</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th 
                            className="text-left py-3 px-2 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('key')}
                          >
                            Key {sortColumn === 'key' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-left py-3 px-2">Title</th>
                          <th 
                            className="text-center py-3 px-2 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('impactScore')}
                          >
                            I {sortColumn === 'impactScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-center py-3 px-2 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('feasibilityScore')}
                          >
                            F {sortColumn === 'feasibilityScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-center py-3 px-2 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('scalabilityScore')}
                          >
                            S {sortColumn === 'scalabilityScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-center py-3 px-2 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('totalScore')}
                          >
                            Total {sortColumn === 'totalScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-center py-3 px-2">Archetype</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBatchResults.map((result) => {
                          const archetype = getArchetype(result.totalScore, result.impactScore, result.scalabilityScore, result.feasibilityScore, result.workType)
                          return (
                            <tr 
                              key={result.key} 
                              className="border-b hover:bg-muted/30 cursor-pointer"
                              onClick={() => setSelectedResult(result)}
                            >
                              <td className="py-3 px-2">
                                <Badge variant="outline" className="font-mono text-xs">{result.key}</Badge>
                              </td>
                              <td className="py-3 px-2 max-w-xs truncate" title={result.title}>
                                {result.title}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={result.impactScore >= 6 ? 'text-emerald-600 font-medium' : result.impactScore <= 3 ? 'text-red-500' : ''}>
                                  {result.impactScore}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={result.feasibilityScore >= 6 ? 'text-emerald-600 font-medium' : result.feasibilityScore <= 3 ? 'text-red-500' : ''}>
                                  {result.feasibilityScore}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={result.scalabilityScore >= 6 ? 'text-emerald-600 font-medium' : result.scalabilityScore <= 3 ? 'text-red-500' : ''}>
                                  {result.scalabilityScore}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center font-semibold">
                                {result.totalScore}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Badge className={`${archetype.color} text-white text-xs`}>
                                  {archetype.name}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Result Detail */}
            {selectedResult && (
              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{selectedResult.key}</Badge>
                      <span className="text-base font-medium truncate max-w-md">{selectedResult.title}</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-amber-500">{selectedResult.impactScore}</p>
                      <p className="text-xs text-muted-foreground">Impact</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-emerald-500">{selectedResult.feasibilityScore}</p>
                      <p className="text-xs text-muted-foreground">Feasibility</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-blue-500">{selectedResult.scalabilityScore}</p>
                      <p className="text-xs text-muted-foreground">Scalability</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{selectedResult.totalScore}</p>
                      <p className="text-xs text-muted-foreground">Total (I×F×S)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-amber-600">Impact Rationale:</p>
                      <p className="text-muted-foreground">{selectedResult.rationale.impact}</p>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-600">Feasibility Rationale:</p>
                      <p className="text-muted-foreground">{selectedResult.rationale.feasibility}</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">Scalability Rationale:</p>
                      <p className="text-muted-foreground">{selectedResult.rationale.scalability}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: AI Synthesis & Scoring */}
        {currentStep === 3 && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* LEFT COLUMN - AI Opinion */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Opinion</h2>
                  <p className="text-xs text-muted-foreground">Analysis and scoring rationale</p>
                </div>
              </div>

              {/* Source Ticket Data */}
              {selectedTicket && (
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4 text-blue-600" />
                      Source Data from JIRA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Issue Key</Label>
                        <Badge variant="outline" className="font-mono">{selectedTicket.key}</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
                        <Badge className={workType === 'enablement' ? 'bg-purple-500' : 'bg-blue-500'}>
                          {workType === 'enablement' ? 'Enablement' : 'Activation'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title</Label>
                      <p className="text-sm bg-background/50 rounded-lg p-3 border">{selectedTicket.title}</p>
                    </div>
                    {selectedTicket.description && (
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                        <p className="text-sm bg-background/50 rounded-lg p-3 border line-clamp-4">
                          {selectedTicket.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Scoring Rationale */}
              {aiRationale && (
                <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4 text-blue-600" />
                      AI Scoring Rationale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-500/20 bg-background/80 p-4">
                      <p className="text-sm leading-relaxed text-foreground">{aiRationale.strategic}</p>
                    </div>
                    
                    {/* AI-Detected Organizational Focus */}
                    {detectedOrganizationalFocus && (
                      <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                        <div className="space-y-0.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Detected Organizational Focus</Label>
                          <p className="text-sm font-medium">{detectedOrganizationalFocus}</p>
                        </div>
                        <div className="text-right">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Strategic Alignment</Label>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-lg font-bold ${strategicAlignmentScore >= 7 ? 'text-emerald-600' : strategicAlignmentScore >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                              {strategicAlignmentScore}/10
                            </span>
                            {strategicAlignmentScore >= 7 && (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">+1 Impact</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Primary Bottleneck</Label>
                      <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-orange-700">{aiRationale.primaryBottleneck}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Score Rationale</Label>
                      
                      <div className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            Impact
                          </span>
                          <Badge variant="outline" className={aiOriginalScores && aiOriginalScores.impact !== impact ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'}>
                            {aiOriginalScores && aiOriginalScores.impact !== impact ? 'User Adjusted' : 'AI Suggested'}: {aiOriginalScores?.impact || impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{aiRationale.impact}</p>
                      </div>
                      
                      <div className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-primary" />
                            Feasibility
                          </span>
                          <Badge variant="outline" className={aiOriginalScores && aiOriginalScores.feasibility !== feasibility ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'}>
                            {aiOriginalScores && aiOriginalScores.feasibility !== feasibility ? 'User Adjusted' : 'AI Suggested'}: {aiOriginalScores?.feasibility || feasibility}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{aiRationale.feasibility}</p>
                      </div>
                      
                      <div className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                            Scalability
                          </span>
                          <Badge variant="outline" className={aiOriginalScores && aiOriginalScores.scalability !== scalability ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'}>
                            {aiOriginalScores && aiOriginalScores.scalability !== scalability ? 'User Adjusted' : 'AI Suggested'}: {aiOriginalScores?.scalability || scalability}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{aiRationale.scalability}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Reasoning Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Strategic Classification Logic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed text-foreground">{reasoning}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {scalability >= 7 && (
                      <Badge variant="outline" className="border-blue-500/50 text-blue-600">
                        High Velocity
                      </Badge>
                    )}
                    {hasStrategicBonus && (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
                        Strategic Alignment +1 ({detectedOrganizationalFocus})
                      </Badge>
                    )}
                    {makes10xFaster && (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
                        10x Bottleneck Test Passed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Archetype Classification */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Strategic Classification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${archetype.color} text-white`}>
                      {archetype.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{archetype.name}</h3>
                      <p className="text-sm text-muted-foreground">{archetype.description}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="font-medium">Recommended Action</span>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-base">
                      {archetype.action}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Strategic Decision */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                  <Settings2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Strategic Decision</h2>
                  <p className="text-xs text-muted-foreground">Interactive scoring</p>
                </div>
              </div>

              {/* Score Display */}
              <Card className="overflow-hidden">
                <div className={`h-2 ${archetype.color}`} />
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Total Score</p>
                    <div className="mb-4 text-6xl font-bold tabular-nums tracking-tight text-foreground">
                      {totalScore}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Badge className={`px-4 py-1.5 text-sm font-medium text-white ${archetype.color}`}>
                        {archetype.name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Human Override Toggle */}
              <Card className={isHumanOverrideActive ? 'border-amber-500/50 bg-amber-500/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        H
                      </span>
                      Human-in-the-Loop Override
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Enable</Label>
                      <Switch 
                        checked={isHumanOverrideActive} 
                        onCheckedChange={(checked) => {
                          setIsHumanOverrideActive(checked)
                          if (!checked) setHumanOverrideDisclaimer('')
                        }}
                      />
                    </div>
                  </div>
                  {isHumanOverrideActive && (
                    <p className="text-xs text-amber-600">
                      Override mode active - adjust AI scores manually
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {humanOverrideDisclaimer && (
                    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p className="italic">{humanOverrideDisclaimer}</p>
                      </div>
                    </div>
                  )}

                  <ScoreSlider
                    icon={<Zap className="h-4 w-4" />}
                    label="Impact"
                    dimension="impact"
                    value={impact}
                    onChange={(v) => handleSliderChange('impact', v)}
                    bonus={hasStrategicBonus ? 1 : 0}
                    isOverridden={aiOriginalScores && aiOriginalScores.impact !== impact}
                    disabled={!isHumanOverrideActive}
                  />
                  <ScoreSlider
                    icon={<Target className="h-4 w-4" />}
                    label="Feasibility"
                    dimension="feasibility"
                    value={feasibility}
                    onChange={(v) => handleSliderChange('feasibility', v)}
                    isOverridden={aiOriginalScores && aiOriginalScores.feasibility !== feasibility}
                    disabled={!isHumanOverrideActive}
                  />
                  <ScoreSlider
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Scalability"
                    dimension="scalability"
                    value={scalability}
                    onChange={(v) => handleSliderChange('scalability', v)}
                    isOverridden={aiOriginalScores && aiOriginalScores.scalability !== scalability}
                    disabled={!isHumanOverrideActive}
                  />
                </CardContent>
              </Card>

              {/* Override History */}
              {overrideHistory.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-4 w-4 text-muted-foreground" />
                      Override History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overrideHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="text-xs capitalize">{entry.field}</Badge>
                            <span className="font-mono">
                              {entry.previousValue} → {entry.newValue}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-1">{entry.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analyze Another Ticket */}
              <Button 
                onClick={resetToStep2}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Analyze Another Ticket
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// IFS Framework Descriptors
const IFS_RUBRICS = {
  impact: {
    fullLabel: 'Impact (Systemic Flow)',
    question: 'Does this eliminate the primary "Wait State" blocking the end-to-end workflow?',
    principle: 'Focus on Flow, not just Tasks',
    rubric: [
      { range: '1-3', text: "Localized task speed-up; doesn't affect overall cycle time." },
      { range: '4-7', text: 'Reduces handoffs/rework in a secondary bottleneck.' },
      { range: '8-10', text: 'Resolves a primary constraint; 10x faster step = 10x faster process.' },
    ],
  },
  feasibility: {
    fullLabel: 'Feasibility (Foundational Readiness)',
    question: 'Are the data, APIs, and "Human Systems" ready to support this today?',
    principle: 'Readiness over Ambition',
    rubric: [
      { range: '1-3', text: 'Requires significant "Enablement" (data cleanup/infrastructure).' },
      { range: '4-7', text: 'Minor gaps; team is skilled but assets need refinement.' },
      { range: '8-10', text: 'All assets ready (SSOT verified); high "Organizational Pull" to adopt.' },
    ],
  },
  scalability: {
    fullLabel: 'Scalability (Autonomous Velocity)',
    question: 'Can this execute 10,000+ times without a new human bottleneck?',
    principle: 'Machine Speed over Human Pace',
    rubric: [
      { range: '1-3', text: 'Manual/one-off prompting; high variable cost per execution.' },
      { range: '4-7', text: 'Hybrid; human-in-the-loop required for >30% of outputs.' },
      { range: '8-10', text: 'Fully automated via API; runs at machine speed with sustainable economics.' },
    ],
  },
}

function ScoreSlider({
  icon,
  label,
  dimension,
  value,
  onChange,
  bonus = 0,
  penalty = 0,
  isOverridden = false,
  disabled = false,
}: {
  icon: React.ReactNode
  label: string
  dimension: 'impact' | 'feasibility' | 'scalability'
  value: number
  onChange: (value: number) => void
  bonus?: number
  penalty?: number
  isOverridden?: boolean
  disabled?: boolean
}) {
  const displayValue = Math.min(10, Math.max(1, value + bonus - penalty))
  const rubric = IFS_RUBRICS[dimension]
  const [showTooltip, setShowTooltip] = useState(false)

  const currentRubric = value <= 3 ? rubric.rubric[0] : value <= 7 ? rubric.rubric[1] : rubric.rubric[2]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium text-foreground">{rubric.fullLabel}</span>
          {bonus > 0 && (
            <Badge variant="outline" className="border-emerald-500/30 text-xs text-emerald-600">
              +{bonus}
            </Badge>
          )}
          {penalty > 0 && (
            <Badge variant="outline" className="border-red-500/30 text-xs text-red-600">
              -{penalty}
            </Badge>
          )}
          {isOverridden && (
            <Badge className="bg-amber-500/20 text-amber-700 border border-amber-500/30 text-xs">
              User Adjusted
            </Badge>
          )}
          <div className="relative">
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="Principle Check"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-md border bg-popover p-3 text-xs shadow-lg">
                <p className="mb-2 font-semibold text-foreground">Principle: {rubric.principle}</p>
                <div className="space-y-1.5 text-muted-foreground">
                  {rubric.rubric.map((r) => (
                    <p key={r.range}>
                      <span className="font-medium text-foreground">({r.range}):</span> {r.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold ${
          isOverridden 
            ? 'bg-amber-500 text-white' 
            : 'bg-primary text-primary-foreground'
        }`}>
          {displayValue}
        </span>
      </div>
      <p className="text-xs italic text-muted-foreground/80">{rubric.question}</p>
      <div className={`relative ${isOverridden ? '[&_[data-slot=thumb]]:bg-amber-500 [&_[data-slot=thumb]]:border-amber-600' : ''}`}>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={1}
          max={10}
          step={1}
          className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">({currentRubric.range}):</span> {currentRubric.text}
      </p>
    </div>
  )
}
