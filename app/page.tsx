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
  Database,
  FileEdit,
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
  Upload,
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

function getArchetype(
  totalScore: number,
  impact: number,
  scalability: number,
  feasibility: number,
  workType: 'enablement' | 'activation'
): Archetype {
  if (totalScore > 100) {
    return {
      name: 'Transformer',
      action: 'Immediate Delivery',
      color: 'bg-blue-500',
      icon: <Rocket className="h-5 w-5" />,
      description: 'High impact, feasibility, and scalability. Ship immediately.',
    }
  }

  if (impact >= 7 && scalability >= 7 && feasibility <= 4 && workType === 'enablement') {
    return {
      name: 'The Foundation',
      action: 'Fund Infrastructure (Enablement)',
      color: 'bg-purple-500',
      icon: <Layers className="h-5 w-5" />,
      description: 'Critical enablement work. Invest in infrastructure first.',
    }
  }

  if (feasibility >= 7 && impact >= 4 && impact <= 7) {
    return {
      name: 'Quick Win',
      action: 'Build Momentum',
      color: 'bg-green-500',
      icon: <Zap className="h-5 w-5" />,
      description: 'High feasibility with moderate impact. Build momentum.',
    }
  }

  if (totalScore >= 40 && totalScore <= 74) {
    return {
      name: 'The Experiment',
      action: 'Time-box Prompting Party',
      color: 'bg-yellow-500',
      icon: <FlaskConical className="h-5 w-5" />,
      description: 'Moderate potential. Time-box exploration to validate.',
    }
  }

  if (scalability <= 3 && feasibility >= 7) {
    return {
      name: 'Money Pit',
      action: 'Defer - Manual/Non-Scalable',
      color: 'bg-orange-500',
      icon: <Trash2 className="h-5 w-5" />,
      description: "Easy to build but won't scale. Defer or redesign.",
    }
  }

  if (totalScore < 20) {
    return {
      name: 'The Noise',
      action: 'Discard',
      color: 'bg-gray-500',
      icon: <Volume2 className="h-5 w-5" />,
      description: 'Low value across all dimensions. Discard.',
    }
  }

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
  
  // Step 1: Context Input
  const [contextMethod, setContextMethod] = useState<'manual' | 'pdf' | 'ticket'>('manual')
  const [clientContext, setClientContext] = useState('')
  const [contextTitle, setContextTitle] = useState('')
  const [organizationalFocus, setOrganizationalFocus] = useState<string>('')
  const [resourceCapacity, setResourceCapacity] = useState<'high' | 'medium' | 'low'>('medium')
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [contextTicketKey, setContextTicketKey] = useState('')
  const [isLoadingContextTicket, setIsLoadingContextTicket] = useState(false)
  
  // Step 2: Ticket Selection
  const [projectIssues, setProjectIssues] = useState<TransformedIssue[]>([])
  const [isLoadingIssues, setIsLoadingIssues] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TransformedIssue | null>(null)
  const [ticketSearchQuery, setTicketSearchQuery] = useState('')
  
  // Step 3: Scoring & Analysis
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

  // Filter tickets by search query
  const filteredTickets = useMemo(() => {
    return projectIssues
      .filter(t => {
        if (!ticketSearchQuery.trim()) return true
        const query = ticketSearchQuery.toLowerCase()
        return t.title.toLowerCase().includes(query) || t.key.toLowerCase().includes(query)
      })
  }, [projectIssues, ticketSearchQuery])

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

  // Load issues when project is selected
  const loadProjectIssues = async (projectKey: string) => {
    setIsLoadingIssues(true)
    
    try {
      const response = await fetch(`/api/jira/issues?project=${projectKey}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load issues')
      }
      
      setProjectIssues(data.issues)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load issues'
      toast({
        title: 'Error Loading Issues',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingIssues(false)
    }
  }

  // Handle project selection
  const handleProjectSelect = (projectKey: string) => {
    const project = projects.find(p => p.key === projectKey)
    if (project) {
      setSelectedProject(project)
      loadProjectIssues(projectKey)
    }
  }

  // Handle PDF upload
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsUploadingPdf(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF')
      }
      
      setClientContext(data.text)
      setContextTitle(file.name.replace('.pdf', ''))
      
      toast({
        title: 'PDF Parsed Successfully',
        description: `Extracted ${data.numPages} page(s) of content.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse PDF'
      toast({
        title: 'PDF Upload Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingPdf(false)
    }
  }

  // Load context from a JIRA ticket
  const loadContextFromTicket = async () => {
    if (!contextTicketKey.trim()) return
    
    setIsLoadingContextTicket(true)
    
    try {
      const response = await fetch(`/api/jira/issue/${contextTicketKey}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load ticket')
      }
      
      const issue = data.issue as TransformedIssue
      setClientContext(issue.description || issue.title)
      setContextTitle(`${issue.key}: ${issue.title}`)
      
      toast({
        title: 'Context Loaded from Ticket',
        description: `Loaded ${issue.key}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load ticket'
      toast({
        title: 'Error Loading Ticket',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingContextTicket(false)
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
    
    if (!organizationalFocus) {
      toast({
        title: 'Focus Required',
        description: 'Please select an organizational focus.',
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

  // Handle ticket selection
  const handleTicketSelect = (ticketKey: string) => {
    const ticket = projectIssues.find(t => t.key === ticketKey)
    if (ticket) {
      setSelectedTicket(ticket)
    }
  }

  // Strategic Alignment Bonus
  const hasStrategicBonus = useMemo(() => {
    if (!organizationalFocus || !selectedTicket) return false
    const description = selectedTicket.description?.toLowerCase() || ''
    const title = selectedTicket.title.toLowerCase()
    const focusLower = organizationalFocus.toLowerCase()
    return description.includes(focusLower) || title.includes(focusLower)
  }, [organizationalFocus, selectedTicket])

  // Client-Side Strategic Inference Engine
  const analyzeInitiativeStrategicValue = useCallback((description: string, context: string): {
    impactScore: number
    feasibilityScore: number
    scalabilityScore: number
    detectedWorkType: 'enablement' | 'activation'
    rationale: {
      strategic: string
      impact: string
      feasibility: string
      scalability: string
      primaryBottleneck: string
    }
  } => {
    const text = `${description} ${context}`.toLowerCase()
    
    // Impact Signals Detection
    let impactScore = 5
    const impactSignals: string[] = []
    if (text.includes('14-day') || text.includes('14 day') || text.includes('two week')) {
      impactScore = Math.max(impactScore, 9)
      impactSignals.push('critical timeline bottleneck (14-day)')
    }
    if (text.includes('336 hour') || text.includes('336-hour')) {
      impactScore = Math.max(impactScore, 10)
      impactSignals.push('severe time sink (336 hours)')
    }
    if (text.includes('$4m') || text.includes('$4 million') || text.includes('4 million')) {
      impactScore = Math.max(impactScore, 10)
      impactSignals.push('high-value opportunity ($4M+)')
    }
    if (text.includes('bottleneck') || text.includes('blocker')) {
      impactScore = Math.max(impactScore, 8)
      impactSignals.push('workflow bottleneck identified')
    }
    if (text.includes('revenue') || text.includes('cost saving') || text.includes('efficiency')) {
      impactScore = Math.max(impactScore, 7)
      impactSignals.push('direct business value')
    }
    if (text.includes('manual') || text.includes('repetitive')) {
      impactScore = Math.max(impactScore, 7)
      impactSignals.push('manual process automation potential')
    }
    
    // Feasibility Signals Detection
    let feasibilityScore = 5
    const feasibilitySignals: string[] = []
    if (text.includes('technical debt') || text.includes('legacy system')) {
      feasibilityScore = Math.min(feasibilityScore, 4)
      feasibilitySignals.push('technical debt concerns')
    }
    if (text.includes('complex integration') || text.includes('enterprise system')) {
      feasibilityScore = Math.min(feasibilityScore, 5)
      feasibilitySignals.push('complex integration required')
    }
    if (text.includes('ready to deploy') || text.includes('plug and play') || text.includes('simple')) {
      feasibilityScore = Math.max(feasibilityScore, 9)
      feasibilitySignals.push('high deployment readiness')
    }
    if (text.includes('api available') || text.includes('existing data') || text.includes('structured data')) {
      feasibilityScore = Math.max(feasibilityScore, 8)
      feasibilitySignals.push('data infrastructure ready')
    }
    if (text.includes('poc') || text.includes('proof of concept') || text.includes('prototype')) {
      feasibilityScore = Math.max(feasibilityScore, 7)
      feasibilitySignals.push('prior validation exists')
    }
    
    // Resource capacity adjustment
    if (resourceCapacity === 'low') {
      feasibilityScore = Math.max(1, feasibilityScore - 2)
      feasibilitySignals.push('limited resource capacity')
    } else if (resourceCapacity === 'high') {
      feasibilityScore = Math.min(10, feasibilityScore + 1)
      feasibilitySignals.push('high resource availability')
    }
    
    // Scalability Signals Detection
    let scalabilityScore = 5
    const scalabilitySignals: string[] = []
    if (text.includes('autonomous') || text.includes('self-service') || text.includes('automated')) {
      scalabilityScore = Math.max(scalabilityScore, 9)
      scalabilitySignals.push('autonomous operation potential')
    }
    if (text.includes('50,000') || text.includes('50000') || text.includes('high volume')) {
      scalabilityScore = Math.max(scalabilityScore, 10)
      scalabilitySignals.push('high-volume processing (50,000+)')
    }
    if (text.includes('global') || text.includes('multi-region') || text.includes('enterprise-wide')) {
      scalabilityScore = Math.max(scalabilityScore, 9)
      scalabilitySignals.push('global deployment scope')
    }
    if (text.includes('reusable') || text.includes('template') || text.includes('modular')) {
      scalabilityScore = Math.max(scalabilityScore, 8)
      scalabilitySignals.push('reusable component architecture')
    }
    if (text.includes('one-off') || text.includes('single use') || text.includes('pilot only')) {
      scalabilityScore = Math.min(scalabilityScore, 3)
      scalabilitySignals.push('limited reuse potential')
    }
    
    // Detect work type
    let detectedWorkType: 'enablement' | 'activation' = 'activation'
    if (text.includes('foundation') || text.includes('infrastructure') || text.includes('platform') || text.includes('enablement') || text.includes('api') || text.includes('data pipeline')) {
      detectedWorkType = 'enablement'
    }
    
    // Build rationale strings
    const strategicRationale = impactSignals.length > 0 || feasibilitySignals.length > 0 || scalabilitySignals.length > 0
      ? `Strategic analysis identified ${impactSignals.length + feasibilitySignals.length + scalabilitySignals.length} key signals. ${impactScore >= 8 ? 'High business impact detected.' : ''} ${feasibilityScore <= 5 ? 'Implementation complexity noted.' : ''} ${scalabilityScore >= 8 ? 'Strong scaling potential.' : ''}`
      : 'Moderate strategic value detected. Consider adding more specific details about bottlenecks, timelines, or scale to improve scoring precision.'
    
    const primaryBottleneck = impactSignals.length > 0 
      ? impactSignals[0].charAt(0).toUpperCase() + impactSignals[0].slice(1)
      : feasibilitySignals.length > 0 && feasibilityScore < 6
        ? `Implementation challenge: ${feasibilitySignals[0]}`
        : 'No critical bottleneck identified'
    
    return {
      impactScore,
      feasibilityScore,
      scalabilityScore,
      detectedWorkType,
      rationale: {
        strategic: strategicRationale,
        impact: impactSignals.length > 0 
          ? `High Impact identified via: ${impactSignals.join(', ')}.`
          : 'Moderate impact - no high-value signals detected in description.',
        feasibility: feasibilitySignals.length > 0
          ? `Feasibility assessment: ${feasibilitySignals.join(', ')}.`
          : 'Standard feasibility - no major blockers or accelerators detected.',
        scalability: scalabilitySignals.length > 0
          ? `Scalability factors: ${scalabilitySignals.join(', ')}.`
          : 'Moderate scalability - consider adding automation or reuse patterns.',
        primaryBottleneck,
      }
    }
  }, [resourceCapacity])

  // Run AI Analysis
  const runAnalysis = useCallback(async () => {
    if (!selectedTicket) return
    
    setIsAnalyzing(true)
    
    // Simulate AI "thinking" time for UX
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const description = `${selectedTicket.title}\n${selectedTicket.description || ''}`
    const result = analyzeInitiativeStrategicValue(description, clientContext)
    
    // Store AI rationale
    setAiRationale({
      strategic: result.rationale.strategic,
      impact: result.rationale.impact,
      feasibility: result.rationale.feasibility,
      scalability: result.rationale.scalability,
      primaryBottleneck: result.rationale.primaryBottleneck,
    })
    
    // Store original AI scores for override detection
    setAiOriginalScores({
      impact: result.impactScore,
      feasibility: result.feasibilityScore,
      scalability: result.scalabilityScore,
    })
    
    // Set sliders to AI-recommended positions
    setImpact(result.impactScore)
    setFeasibility(result.feasibilityScore)
    setScalability(result.scalabilityScore)
    
    // Set work type based on detection
    setWorkType(result.detectedWorkType)
    
    // Transition to Step 3
    setCurrentStep(3)
    setIsAnalyzing(false)
    
    toast({
      title: 'AI Analysis Complete',
      description: `IFS Scores: Impact=${result.impactScore}, Feasibility=${result.feasibilityScore}, Scalability=${result.scalabilityScore}`,
    })
  }, [selectedTicket, clientContext, analyzeInitiativeStrategicValue, toast])

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
          <div className="border-t bg-muted/50 px-4 py-3">
            <div className="container">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Impact (Systemic Flow)</p>
                    <p className="text-xs text-muted-foreground">
                      Does this eliminate the primary Wait State blocking the workflow?
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Feasibility (Readiness)</p>
                    <p className="text-xs text-muted-foreground">
                      Are data, APIs, and Human Systems ready to support this today?
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Scalability (Velocity)</p>
                    <p className="text-xs text-muted-foreground">
                      Can this execute 10,000+ times without new human bottlenecks?
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
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects by name or key..."
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Project Select */}
                    <Select value={selectedProject?.key || ''} onValueChange={handleProjectSelect}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredProjects.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No projects found matching &quot;{projectSearchQuery}&quot;
                          </div>
                        ) : (
                          filteredProjects.map((project) => (
                            <SelectItem key={project.key} value={project.key}>
                              <div className="flex items-center gap-2">
                                {project.avatar && (
                                  <img src={project.avatar} alt="" className="h-5 w-5 rounded" />
                                )}
                                <span className="font-mono text-sm">{project.key}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{project.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    <p className="text-xs text-muted-foreground">
                      {projects.length} projects available (sorted A-Z)
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
                    {isLoadingIssues ? (
                      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Spinner className="h-3 w-3" />
                        Loading issues...
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {projectIssues.length} issues available for prioritization
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Context Input */}
            <Card className={!selectedProject ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Client Context
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provide context about the client/organization to improve prioritization accuracy
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Context Method Selection */}
                <div className="flex gap-2">
                  <Button
                    variant={contextMethod === 'manual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContextMethod('manual')}
                    className="flex-1"
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Manual Entry
                  </Button>
                  <Button
                    variant={contextMethod === 'pdf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContextMethod('pdf')}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                  </Button>
                  <Button
                    variant={contextMethod === 'ticket' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContextMethod('ticket')}
                    className="flex-1"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    From Ticket
                  </Button>
                </div>

                {/* PDF Upload */}
                {contextMethod === 'pdf' && (
                  <div className="space-y-2">
                    <Label>Upload PDF Document</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        disabled={isUploadingPdf}
                        className="flex-1"
                      />
                      {isUploadingPdf && <Spinner className="h-4 w-4" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF containing client context, requirements, or discovery notes.
                    </p>
                  </div>
                )}

                {/* Ticket Context */}
                {contextMethod === 'ticket' && (
                  <div className="space-y-2">
                    <Label>Load Context from Ticket</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter ticket key (e.g., PROJ-123)"
                        value={contextTicketKey}
                        onChange={(e) => setContextTicketKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={loadContextFromTicket} 
                        disabled={isLoadingContextTicket || !contextTicketKey.trim()}
                      >
                        {isLoadingContextTicket ? <Spinner className="h-4 w-4" /> : 'Load'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Context Title */}
                <div className="space-y-2">
                  <Label>Context Title</Label>
                  <Input
                    placeholder="e.g., Q4 Digital Transformation Initiative"
                    value={contextTitle}
                    onChange={(e) => setContextTitle(e.target.value)}
                  />
                </div>

                {/* Client Context Text */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Client Context</Label>
                    <div className="group relative">
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                      <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-72 rounded-md border bg-popover p-3 text-xs shadow-lg group-hover:block">
                        <p className="font-medium text-foreground mb-1">Client Context</p>
                        <p className="text-muted-foreground">
                          Describe the organization&apos;s industry, size, current state, and strategic objectives.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Describe the client organization: industry, size, current systems, strategic goals, key stakeholders, and any critical constraints or deadlines..."
                    value={clientContext}
                    onChange={(e) => setClientContext(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                </div>

                {/* Organizational Focus */}
                <div className="space-y-2">
                  <Label>Organizational Focus</Label>
                  <Select value={organizationalFocus} onValueChange={setOrganizationalFocus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEX Reduction">OPEX Reduction</SelectItem>
                      <SelectItem value="Customer Experience">Customer Experience</SelectItem>
                      <SelectItem value="Developer Productivity">Developer Productivity</SelectItem>
                      <SelectItem value="Data Privacy">Data Privacy</SelectItem>
                      <SelectItem value="Process Efficiency">Process Efficiency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resource Capacity */}
                <div className="space-y-2">
                  <Label>Resource Capacity</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={resourceCapacity === level ? 'default' : 'outline'}
                        onClick={() => setResourceCapacity(level)}
                        className="capitalize"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleConfirmContext} 
                  className="w-full h-12"
                  disabled={!selectedProject || !organizationalFocus}
                >
                  Confirm Context & Select Ticket
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
                      {selectedProject?.name} | {organizationalFocus} | {resourceCapacity} capacity
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetToStep1}>
                  Change
                </Button>
              </div>
              {contextTitle && (
                <p className="text-sm text-muted-foreground mt-2 pl-8">{contextTitle}</p>
              )}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Step 2: Select Ticket to Prioritize</h2>
              <p className="text-muted-foreground mt-2">Choose a ticket from {selectedProject?.key} to analyze</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Select Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingIssues ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                    <span className="ml-2 text-muted-foreground">Loading issues...</span>
                  </div>
                ) : projectIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No issues found in this project.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tickets by title or key..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={selectedTicket?.key || ''} onValueChange={handleTicketSelect}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Select a ticket to prioritize..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {filteredTickets.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No tickets found matching &quot;{ticketSearchQuery}&quot;
                          </div>
                        ) : (
                          filteredTickets.map((issue) => (
                            <SelectItem key={issue.key} value={issue.key}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">{issue.key}</Badge>
                                <span className="truncate max-w-md">{issue.title}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    <p className="text-xs text-muted-foreground">
                      {projectIssues.length} tickets available
                    </p>
                  </div>
                )}

                {/* Selected Ticket Preview */}
                {selectedTicket && (
                  <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{selectedTicket.key}</Badge>
                          <Badge>{selectedTicket.issueType}</Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              selectedTicket.statusColor === 'green' ? 'border-emerald-500/50 text-emerald-600' :
                              selectedTicket.statusColor === 'blue-gray' ? 'border-blue-500/50 text-blue-600' :
                              'border-yellow-500/50 text-yellow-600'
                            }
                          >
                            {selectedTicket.status}
                          </Badge>
                        </div>
                        <Badge variant="outline">{selectedTicket.priority}</Badge>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                        {selectedTicket.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-4">
                            {selectedTicket.description}
                          </p>
                        )}
                      </div>

                      {(selectedTicket.labels.length > 0 || selectedTicket.components.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTicket.labels.map((label) => (
                            <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                          ))}
                          {selectedTicket.components.map((comp) => (
                            <Badge key={comp} variant="outline" className="text-xs">{comp}</Badge>
                          ))}
                        </div>
                      )}

                      {selectedTicket.assignee && (
                        <p className="text-sm text-muted-foreground">
                          Assignee: {selectedTicket.assignee}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Initiative Type */}
                <div className="space-y-2">
                  <Label>Initiative Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={workType === 'activation' ? 'default' : 'outline'}
                      onClick={() => setWorkType('activation')}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Activation
                    </Button>
                    <Button
                      variant={workType === 'enablement' ? 'default' : 'outline'}
                      onClick={() => setWorkType('enablement')}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Enablement
                    </Button>
                  </div>
                </div>

                {/* Bottleneck Test */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="bottleneck-test"
                      checked={makes10xFaster}
                      onCheckedChange={(checked) => setMakes10xFaster(checked as boolean)}
                    />
                    <div>
                      <Label htmlFor="bottleneck-test" className="cursor-pointer font-medium">
                        The Bottleneck Test
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Does this make the entire process 10x faster?
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={runAnalysis}
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={!selectedTicket || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner className="mr-2 h-5 w-5" />
                      AI Analyzing Strategic Value...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Run AI Analysis & Synthesis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
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
                        Strategic Alignment +1
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
