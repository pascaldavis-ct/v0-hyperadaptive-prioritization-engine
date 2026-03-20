'use client'

import { useState, useMemo, useCallback } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Import,
  History,
  X,
  Settings2,
  Lock,
  Unlock,
  Plus,
  AlertCircle,
} from 'lucide-react'

// Mock Workspace Metadata for Space Context
const mockWorkspaceData: Record<string, {
  name: string
  focus: string[]
  enablers: { key: string; status: 'Active' | 'Stalled' | 'Missing' }[]
  constraints: string[]
}> = {
  'MKTG': {
    name: 'Marketing AI Initiatives',
    focus: ['OPEX Reduction', 'Customer Experience'],
    enablers: [
      { key: 'DATA-05', status: 'Active' },
      { key: 'INFRA-99', status: 'Stalled' },
    ],
    constraints: ['Q4 Budget Freeze', 'Limited ML Expertise'],
  },
  'ENG': {
    name: 'Engineering Platform',
    focus: ['Developer Productivity', 'Infrastructure'],
    enablers: [
      { key: 'INFRA-99', status: 'Active' },
      { key: 'DATA-05', status: 'Missing' },
    ],
    constraints: ['Security Review Required'],
  },
  'OPS': {
    name: 'Operations Automation',
    focus: ['OPEX Reduction', 'Process Efficiency'],
    enablers: [
      { key: 'DATA-05', status: 'Active' },
      { key: 'INFRA-99', status: 'Active' },
    ],
    constraints: ['Legacy System Dependencies'],
  },
}

// Mock Jira data for MCP simulation with Friction Metrics
const mockJiraData: Record<string, {
  title: string
  bottleneck: string
  readiness: 'Ready' | 'Siloed' | 'Partial'
  links: string[]
  type: 'Activation' | 'Enablement'
  impact_hint: string
  active_time: number
  wait_time: number
  suggested_scores?: { impact: number; feasibility: number; scalability: number }
  requiredEnablers?: string[]
}> = {
  'AI-101': {
    title: 'Automated Content Localization',
    bottleneck: 'Manual translation (4 days/market)',
    readiness: 'Ready',
    links: ['DATA-05'],
    type: 'Activation',
    impact_hint: 'Eliminates primary localization bottleneck.',
    active_time: 8,
    wait_time: 88,
    suggested_scores: { impact: 8, feasibility: 7, scalability: 9 },
    requiredEnablers: ['DATA-05'],
  },
  'DATA-05': {
    title: 'Global Terminology Database',
    bottleneck: 'Inconsistent brand voice across regions',
    readiness: 'Siloed',
    links: ['AI-101', 'AI-102', 'AI-103', 'AI-104'],
    type: 'Enablement',
    impact_hint: 'Unlocks 4 high-impact activation use cases.',
    active_time: 20,
    wait_time: 40,
    suggested_scores: { impact: 9, feasibility: 4, scalability: 8 },
  },
  'AI-202': {
    title: 'Generic FAQ Chatbot',
    bottleneck: 'None (General Inquiry)',
    readiness: 'Ready',
    links: [],
    type: 'Activation',
    impact_hint: 'Does not address a primary workflow constraint.',
    active_time: 30,
    wait_time: 10,
    suggested_scores: { impact: 3, feasibility: 9, scalability: 5 },
  },
  'INFRA-99': {
    title: 'Vector Database Setup',
    bottleneck: 'No retrieval infrastructure for RAG',
    readiness: 'Ready',
    links: ['AI-301', 'AI-302'],
    type: 'Enablement',
    impact_hint: 'Prerequisite for all RAG-based search tools.',
    active_time: 16,
    wait_time: 4,
    suggested_scores: { impact: 7, feasibility: 8, scalability: 9 },
  },
  'AI-102': {
    title: 'Smart Email Composer',
    bottleneck: 'Manual drafting (2 hours/campaign)',
    readiness: 'Ready',
    links: ['DATA-05'],
    type: 'Activation',
    impact_hint: 'Reduces email creation time by 80%.',
    active_time: 12,
    wait_time: 36,
    suggested_scores: { impact: 6, feasibility: 8, scalability: 7 },
    requiredEnablers: ['DATA-05'],
  },
}

// Transform mockJiraData to internal format
const MOCK_MCP_DATA: Record<string, {
  primaryBottleneck: string
  dataReadiness: string
  linkedDependencies: { key: string; type: 'enablement' | 'activation' }[]
  description: string
  title: string
  impactHint: string
  workType: 'enablement' | 'activation'
  activeTime: number
  waitTime: number
  suggestedScores?: { impact: number; feasibility: number; scalability: number }
  requiredEnablers?: string[]
}> = Object.fromEntries(
  Object.entries(mockJiraData).map(([key, data]) => [
    key,
    {
      primaryBottleneck: data.bottleneck,
      dataReadiness: data.readiness === 'Ready' ? 'Data available and integrated' : 
                     data.readiness === 'Siloed' ? 'Data exists but siloed across systems' : 
                     'Partial data available, needs integration',
      linkedDependencies: data.links.map(link => ({
        key: link,
        type: (mockJiraData[link]?.type?.toLowerCase() as 'enablement' | 'activation') || 'activation'
      })),
      description: data.title,
      title: data.title,
      impactHint: data.impact_hint,
      workType: data.type.toLowerCase() as 'enablement' | 'activation',
      activeTime: data.active_time,
      waitTime: data.wait_time,
      suggestedScores: data.suggested_scores,
      requiredEnablers: data.requiredEnablers,
    }
  ])
)

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

interface FoundationItem {
  key: string
  title: string
  type: 'enablement' | 'activation'
  linkedTo: string
}

interface SelectedArtifact {
  key: string
  data: typeof MOCK_MCP_DATA['AI-101']
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
      description: 'Easy to build but won\'t scale. Defer or redesign.',
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
  frictionRatio?: number,
  hasStrategicBonus?: boolean,
  hasBlocker?: boolean
): string {
  let reasoning = ''
  
  // Strategic Alignment Bonus
  if (hasStrategicBonus) {
    reasoning += 'STRATEGIC ALIGNMENT: Initiative aligns with organizational OPEX reduction focus. '
  }
  
  // Blocker Alert (Readiness issue)
  if (hasBlocker) {
    reasoning += 'READINESS ALERT: Required enabler is Stalled or Missing - Foundational Readiness impacted. '
  }
  
  // Friction insight (Wait States)
  if (frictionRatio !== undefined && frictionRatio > 0.6) {
    reasoning += 'HIGH WAIT STATE RATIO: Significant wait time indicates systemic flow improvement opportunity. '
  }

  if (impactHint) {
    // Velocity analysis
    const velocityAnalysis = scalability >= 7
      ? 'High Autonomous Velocity: Can execute at machine speed without human bottlenecks.'
      : scalability >= 4
      ? 'Moderate Velocity: Hybrid execution with human-in-the-loop for some outputs.'
      : 'Low Velocity: Manual prompting required; high variable cost per execution.'
    
    return reasoning + `${impactHint} ${velocityAnalysis}`
  }

  // Systemic Flow analysis
  const flowAnalysis = impact >= 7
    ? 'Systemic Flow: Resolves primary Wait State constraint.'
    : impact >= 4
    ? 'Partial Flow: Reduces handoffs in secondary bottleneck.'
    : 'Localized: Task speed-up without systemic flow impact.'

  // Velocity analysis
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
  
  // Data Mode Toggle
  const [dataMode, setDataMode] = useState<'manual' | 'mcp'>('manual')
  
  // Context State (Step 1)
  const [isContextSet, setIsContextSet] = useState(false)
  const [organizationalFocus, setOrganizationalFocus] = useState<string>('')
  const [resourceCapacity, setResourceCapacity] = useState<'high' | 'medium' | 'low'>('medium')
  const [spaceKey, setSpaceKey] = useState('')
  const [workspaceContext, setWorkspaceContext] = useState<typeof mockWorkspaceData['MKTG'] | null>(null)
  const [isFetchingSpace, setIsFetchingSpace] = useState(false)
  
  // MCP Search State
  const [jiraKey, setJiraKey] = useState('')
  const [isFetchingMcp, setIsFetchingMcp] = useState(false)
  const [mcpData, setMcpData] = useState<typeof MOCK_MCP_DATA['AI-101'] | null>(null)
  const [currentJiraKey, setCurrentJiraKey] = useState('')

  // Multi-Select Artifacts
  const [selectedArtifacts, setSelectedArtifacts] = useState<SelectedArtifact[]>([])

  // Preview Modal State
  const [previewData, setPreviewData] = useState<{ key: string; data: typeof MOCK_MCP_DATA['AI-101'] } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Input state
  const [useCaseDescription, setUseCaseDescription] = useState('')
  const [prioritizationContext, setPrioritizationContext] = useState('')
  const [workType, setWorkType] = useState<'enablement' | 'activation'>('activation')
  
  // Bottleneck Test
  const [makes10xFaster, setMakes10xFaster] = useState(false)

  // IFS Scores (1-10 scale)
  const [impact, setImpact] = useState(5)
  const [feasibility, setFeasibility] = useState(5)
  const [scalability, setScalability] = useState(5)

  // Track original MCP values for override detection
  const [mcpOriginalScores, setMcpOriginalScores] = useState<{ impact: number; feasibility: number; scalability: number } | null>(null)

  // Override History
  const [overrideHistory, setOverrideHistory] = useState<OverrideHistoryEntry[]>([])
  const [pendingOverride, setPendingOverride] = useState<{ field: string; previousValue: number; newValue: number } | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)

  // Foundations Column
  const [foundations, setFoundations] = useState<FoundationItem[]>([])

  // Framework visibility
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(false)

  // Blocker detection
  const blockerAlert = useMemo(() => {
    if (!workspaceContext || !mcpData?.requiredEnablers) return null
    
    for (const reqEnabler of mcpData.requiredEnablers) {
      const enabler = workspaceContext.enablers.find(e => e.key === reqEnabler)
      if (enabler && (enabler.status === 'Stalled' || enabler.status === 'Missing')) {
        return { key: reqEnabler, status: enabler.status }
      }
      if (!enabler) {
        return { key: reqEnabler, status: 'Missing' as const }
      }
    }
    return null
  }, [workspaceContext, mcpData])

  // Strategic Alignment Bonus (OPEX Reduction + Wait Time reduction)
  const hasStrategicBonus = useMemo(() => {
    if (!workspaceContext) return false
    const hasOPEXFocus = workspaceContext.focus.includes('OPEX Reduction')
    const hasHighWaitTime = mcpData && (mcpData.waitTime / (mcpData.activeTime + mcpData.waitTime)) > 0.5
    return hasOPEXFocus && hasHighWaitTime
  }, [workspaceContext, mcpData])

  // Feasibility penalty for blockers
  const feasibilityPenalty = useMemo(() => {
    if (blockerAlert) {
      return blockerAlert.status === 'Stalled' ? 2 : 3
    }
    return 0
  }, [blockerAlert])

  // Context Affinity Score
  const contextAffinity = useMemo(() => {
    if (!isContextSet) return 0
    
    let affinity = 50 // Base score
    
    // Bonus for strategic alignment
    if (hasStrategicBonus) affinity += 25
    
    // Penalty for blockers
    if (blockerAlert) affinity -= 20
    
    // Bonus for matching organizational focus keywords in description
    if (workspaceContext && useCaseDescription) {
      const descLower = useCaseDescription.toLowerCase()
      for (const focus of workspaceContext.focus) {
        if (descLower.includes(focus.toLowerCase())) {
          affinity += 10
        }
      }
    }
    
    return Math.min(100, Math.max(0, affinity))
  }, [isContextSet, hasStrategicBonus, blockerAlert, workspaceContext, useCaseDescription])

  // Enablement Multiplier Logic
  const linkedActivationCount = useMemo(() => {
    if (!mcpData) return 0
    return mcpData.linkedDependencies.filter(dep => dep.type === 'activation').length
  }, [mcpData])

  const enablementBonus = useMemo(() => {
    if (workType === 'enablement' && linkedActivationCount >= 3) {
      return 2
    }
    return 0
  }, [workType, linkedActivationCount])

  const adjustedImpact = useMemo(() => {
    let adjusted = Math.min(10, impact + enablementBonus)
    if (hasStrategicBonus) adjusted = Math.min(10, adjusted + 1)
    return adjusted
  }, [impact, enablementBonus, hasStrategicBonus])

  const adjustedFeasibility = useMemo(() => {
    return Math.max(1, feasibility - feasibilityPenalty)
  }, [feasibility, feasibilityPenalty])

  // Calculate Total Score
  const totalScore = useMemo(() => {
    return adjustedImpact * scalability * adjustedFeasibility
  }, [adjustedImpact, scalability, adjustedFeasibility])

  // Aggregate friction from multi-select
  const aggregatedFriction = useMemo(() => {
    if (selectedArtifacts.length === 0) {
      if (!mcpData) return undefined
      return {
        activeTime: mcpData.activeTime,
        waitTime: mcpData.waitTime,
        ratio: mcpData.waitTime / (mcpData.activeTime + mcpData.waitTime)
      }
    }
    
    const totalActive = selectedArtifacts.reduce((sum, a) => sum + a.data.activeTime, 0)
    const totalWait = selectedArtifacts.reduce((sum, a) => sum + a.data.waitTime, 0)
    const total = totalActive + totalWait
    
    return {
      activeTime: totalActive,
      waitTime: totalWait,
      ratio: total > 0 ? totalWait / total : 0
    }
  }, [selectedArtifacts, mcpData])

  // Certainty Score
  const certaintyScore = useMemo(() => {
    let score = dataMode === 'mcp' ? 95 : 30
    if (isContextSet && workspaceContext) score = Math.min(100, score + 5)
    return score
  }, [dataMode, isContextSet, workspaceContext])

  // Get archetype
  const archetype = useMemo(() => {
    return getArchetype(totalScore, adjustedImpact, scalability, adjustedFeasibility, workType)
  }, [totalScore, adjustedImpact, scalability, adjustedFeasibility, workType])

  // Critical Path Detection
  const isCriticalPath = useMemo(() => {
    if (workType !== 'enablement' || !mcpData) return false
    const hasHighScoreActivation = mcpData.linkedDependencies.some(dep => {
      if (dep.type === 'activation') {
        return totalScore > 80
      }
      return false
    })
    return hasHighScoreActivation && totalScore > 80
  }, [workType, mcpData, totalScore])

  // Generate reasoning
  const reasoning = useMemo(() => {
    return generateReasoning(
      adjustedImpact, 
      adjustedFeasibility, 
      scalability, 
      totalScore, 
      archetype, 
      mcpData?.impactHint, 
      aggregatedFriction?.ratio,
      hasStrategicBonus,
      !!blockerAlert
    )
  }, [adjustedImpact, adjustedFeasibility, scalability, totalScore, archetype, mcpData?.impactHint, aggregatedFriction?.ratio, hasStrategicBonus, blockerAlert])

  // Handle score changes with override detection
  const handleScoreChange = useCallback((field: 'impact' | 'feasibility' | 'scalability', newValue: number) => {
    if (mcpOriginalScores && mcpData) {
      const previousValue = field === 'impact' ? impact : field === 'feasibility' ? feasibility : scalability
      const originalValue = mcpOriginalScores[field]
      
      if (originalValue !== newValue && previousValue === originalValue) {
        setPendingOverride({ field, previousValue: originalValue, newValue })
        setIsOverrideDialogOpen(true)
        return
      }
    }
    
    if (field === 'impact') setImpact(newValue)
    else if (field === 'feasibility') setFeasibility(newValue)
    else setScalability(newValue)
  }, [mcpOriginalScores, mcpData, impact, feasibility, scalability])

  // Confirm override
  const confirmOverride = () => {
    if (!pendingOverride || !overrideReason.trim()) return
    
    const entry: OverrideHistoryEntry = {
      field: pendingOverride.field,
      previousValue: pendingOverride.previousValue,
      newValue: pendingOverride.newValue,
      reason: overrideReason,
      timestamp: new Date(),
    }
    
    setOverrideHistory(prev => [...prev, entry])
    
    if (pendingOverride.field === 'impact') setImpact(pendingOverride.newValue)
    else if (pendingOverride.field === 'feasibility') setFeasibility(pendingOverride.newValue)
    else setScalability(pendingOverride.newValue)
    
    setPendingOverride(null)
    setOverrideReason('')
    setIsOverrideDialogOpen(false)
    
    toast({
      title: 'Override Recorded',
      description: `${entry.field} changed from ${entry.previousValue} to ${entry.newValue}.`,
    })
  }

  const cancelOverride = () => {
    setPendingOverride(null)
    setOverrideReason('')
    setIsOverrideDialogOpen(false)
  }

  // Load Space Context
  const handleLoadSpaceContext = async () => {
    if (!spaceKey.trim()) return
    
    setIsFetchingSpace(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    const key = spaceKey.toUpperCase()
    const data = mockWorkspaceData[key]
    
    if (data) {
      setWorkspaceContext(data)
      setOrganizationalFocus(data.focus[0] || '')
      setIsContextSet(true)
      setCurrentStep(2)
      toast({
        title: 'Space Context Loaded',
        description: `${data.name} context has been applied.`,
      })
    } else {
      toast({
        title: 'Space Not Found',
        description: 'Try: MKTG, ENG, or OPS',
        variant: 'destructive',
      })
    }
    
    setIsFetchingSpace(false)
  }

  // Set Manual Context
  const handleSetManualContext = () => {
    if (!organizationalFocus) {
      toast({
        title: 'Focus Required',
        description: 'Please select an organizational focus.',
        variant: 'destructive',
      })
      return
    }
    setIsContextSet(true)
    setCurrentStep(2)
    toast({
      title: 'Context Set',
      description: 'Prioritization context has been established.',
    })
  }

  // Handle MCP search
  const handleMcpSearch = async () => {
    if (!jiraKey.trim()) return

    setIsFetchingMcp(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const key = jiraKey.toUpperCase()
    const data = MOCK_MCP_DATA[key]
    
    if (data) {
      setPreviewData({ key, data })
      setIsPreviewOpen(true)
    } else {
      toast({
        title: 'Key Not Found',
        description: 'Key not found in Atlassian MCP.',
        variant: 'destructive',
      })
    }

    setIsFetchingMcp(false)
  }

  // Import data from preview (supports multi-select)
  const handleImport = (addToMulti: boolean = false) => {
    if (!previewData) return

    const { key, data } = previewData
    
    if (addToMulti) {
      // Add to multi-select artifacts
      setSelectedArtifacts(prev => {
        const exists = prev.some(a => a.key === key)
        if (exists) return prev
        return [...prev, { key, data }]
      })
      toast({
        title: 'Artifact Added',
        description: `${key} added to initiative bundle.`,
      })
    } else {
      // Single import
      setMcpData(data)
      setCurrentJiraKey(key)
      setUseCaseDescription(data.title)
      setWorkType(data.workType)
      
      if (data.suggestedScores) {
        setImpact(data.suggestedScores.impact)
        setFeasibility(data.suggestedScores.feasibility)
        setScalability(data.suggestedScores.scalability)
        setMcpOriginalScores(data.suggestedScores)
      }
      
      if (data.impactHint) {
        setPrioritizationContext(prev => prev ? `${prev}\n\nMCP: ${data.impactHint}` : `MCP: ${data.impactHint}`)
      }

      // Recursive dependency fetching
      const linkedEnablements = data.linkedDependencies
        .filter(dep => dep.type === 'enablement' && mockJiraData[dep.key])
        .map(dep => ({
          key: dep.key,
          title: mockJiraData[dep.key].title,
          type: dep.type,
          linkedTo: key,
        }))
      
      if (linkedEnablements.length > 0) {
        setFoundations(prev => {
          const existingKeys = new Set(prev.map(f => f.key))
          const newItems = linkedEnablements.filter(item => !existingKeys.has(item.key))
          return [...prev, ...newItems]
        })
      }

      // Move to step 3 when imported
      setCurrentStep(3)
      
      toast({
        title: 'Initiative Imported',
        description: `${key}: ${data.title}`,
      })
    }

    setIsPreviewOpen(false)
    setPreviewData(null)
    setJiraKey('')
  }

  // Remove artifact from multi-select
  const removeArtifact = (key: string) => {
    setSelectedArtifacts(prev => prev.filter(a => a.key !== key))
  }

  // Import all selected artifacts as single initiative
  const importMultiSelectBundle = () => {
    if (selectedArtifacts.length === 0) return
    
    const titles = selectedArtifacts.map(a => a.data.title).join(' + ')
    setUseCaseDescription(`Bundle: ${titles}`)
    
    // Average the suggested scores
    const avgScores = selectedArtifacts.reduce((acc, a) => {
      if (a.data.suggestedScores) {
        acc.impact += a.data.suggestedScores.impact
        acc.feasibility += a.data.suggestedScores.feasibility
        acc.scalability += a.data.suggestedScores.scalability
        acc.count++
      }
      return acc
    }, { impact: 0, feasibility: 0, scalability: 0, count: 0 })
    
    if (avgScores.count > 0) {
      setImpact(Math.round(avgScores.impact / avgScores.count))
      setFeasibility(Math.round(avgScores.feasibility / avgScores.count))
      setScalability(Math.round(avgScores.scalability / avgScores.count))
    }
    
    setCurrentStep(3)
    
    toast({
      title: 'Bundle Created',
      description: `${selectedArtifacts.length} artifacts merged into single initiative.`,
    })
  }

  const clearMcpData = () => {
    setMcpData(null)
    setJiraKey('')
    setCurrentJiraKey('')
    setUseCaseDescription('')
    setMcpOriginalScores(null)
    setOverrideHistory([])
    setSelectedArtifacts([])
  }

  const removeFoundation = (key: string) => {
    setFoundations(prev => prev.filter(f => f.key !== key))
  }

  const resetContext = () => {
    setIsContextSet(false)
    setWorkspaceContext(null)
    setOrganizationalFocus('')
    setSpaceKey('')
    setCurrentStep(1)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Override Reason Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Override Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Changing <strong>{pendingOverride?.field}</strong> from{' '}
              <strong>{pendingOverride?.previousValue}</strong> to{' '}
              <strong>{pendingOverride?.newValue}</strong>.
            </p>
            <Textarea
              placeholder="Enter your reason for this override..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelOverride}>Cancel</Button>
            <Button onClick={confirmOverride} disabled={!overrideReason.trim()}>
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview & Import Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              MCP Preview
            </DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-base">
                  {previewData.key}
                </Badge>
                <Badge variant={previewData.data.workType === 'enablement' ? 'default' : 'secondary'}>
                  {previewData.data.workType === 'enablement' ? 'Enablement' : 'Activation'}
                </Badge>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="text-lg font-medium text-foreground">{previewData.data.title}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Bottleneck</Label>
                <p className="text-sm text-foreground">{previewData.data.primaryBottleneck}</p>
              </div>

              {previewData.data.suggestedScores && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <Label className="text-xs text-muted-foreground">Suggested Scores</Label>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">{previewData.data.suggestedScores.impact}</p>
                      <p className="text-xs text-muted-foreground">Impact</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">{previewData.data.suggestedScores.feasibility}</p>
                      <p className="text-xs text-muted-foreground">Feasibility</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{previewData.data.suggestedScores.scalability}</p>
                      <p className="text-xs text-muted-foreground">Scalability</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
            {dataMode === 'mcp' && (
              <Button variant="secondary" onClick={() => handleImport(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Bundle
              </Button>
            )}
            <Button onClick={() => handleImport(false)}>
              <Import className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Header with Context */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Hyperadaptive Prioritization Engine
                </h1>
                <p className="text-sm text-muted-foreground">
                  Context-First AI Initiative Scoring
                </p>
              </div>
            </div>

            {/* Data Mode Toggle */}
            <div className="flex items-center gap-4">
              {isContextSet && workspaceContext && (
                <div className="hidden items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 md:flex">
                  <Badge variant="outline" className="text-xs">
                    {workspaceContext.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">|</span>
                  <span className="text-xs text-foreground">{organizationalFocus}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm ${dataMode === 'manual' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    Manual
                  </span>
                </div>
                <Switch
                  checked={dataMode === 'mcp'}
                  onCheckedChange={(checked) => {
                    setDataMode(checked ? 'mcp' : 'manual')
                    if (!checked) clearMcpData()
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${dataMode === 'mcp' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    MCP
                  </span>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: 'Set Context', icon: Settings2 },
              { step: 2, label: 'Define Initiative', icon: Sparkles },
              { step: 3, label: 'AI Synthesis', icon: Brain },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <button
                  onClick={() => item.step <= currentStep && setCurrentStep(item.step)}
                  disabled={item.step > currentStep}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    currentStep === item.step
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > item.step
                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
                {index < 2 && (
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
</div>
  </div>
  </div>

  {/* IFS Framework Reference - Always visible below header */}
  <div className="border-b border-border bg-muted/30">
    <div className="mx-auto max-w-7xl px-6 py-4">
      <button
        onClick={() => setIsFrameworkOpen(!isFrameworkOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:bg-card/80"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">IFS Framework Reference</span>
          <span className="text-xs text-muted-foreground">(Impact x Scalability) x Feasibility</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isFrameworkOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isFrameworkOpen && (
        <Card className="mt-4">
          <CardContent className="p-6 space-y-6">
            {/* IFS Dimensions */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Impact */}
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">Impact (Systemic Flow)</span>
                </div>
                <p className="text-xs italic text-muted-foreground">
                  "Does this eliminate the primary Wait State?"
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-emerald-600 font-medium">Principle: Focus on Flow, not Tasks</p>
                  <p><span className="font-medium">(1-3):</span> Localized task speed-up</p>
                  <p><span className="font-medium">(4-7):</span> Reduces secondary bottleneck</p>
                  <p><span className="font-medium">(8-10):</span> Resolves primary constraint</p>
                </div>
              </div>
              {/* Feasibility */}
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold">Feasibility (Foundational Readiness)</span>
                </div>
                <p className="text-xs italic text-muted-foreground">
                  "Are data, APIs, and Human Systems ready?"
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-emerald-600 font-medium">Principle: Readiness over Ambition</p>
                  <p><span className="font-medium">(1-3):</span> Requires significant Enablement</p>
                  <p><span className="font-medium">(4-7):</span> Minor gaps; assets need refinement</p>
                  <p><span className="font-medium">(8-10):</span> All assets ready (SSOT verified)</p>
                </div>
              </div>
              {/* Scalability */}
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">Scalability (Autonomous Velocity)</span>
                </div>
                <p className="text-xs italic text-muted-foreground">
                  "Can this run 10,000x without human bottleneck?"
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-emerald-600 font-medium">Principle: Machine Speed over Human Pace</p>
                  <p><span className="font-medium">(1-3):</span> Manual prompting; high variable cost</p>
                  <p><span className="font-medium">(4-7):</span> Hybrid; human-in-loop for &gt;30%</p>
                  <p><span className="font-medium">(8-10):</span> Fully automated via API</p>
                </div>
              </div>
            </div>
            {/* Formula */}
            <div className="rounded-lg bg-primary/5 px-4 py-3 text-center">
              <code className="text-sm font-medium">(I x S) x F = Score (Max: 1000)</code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
  
  <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Step 1: Context & Constraints */}
        {currentStep === 1 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Context & Constraints
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Define your organization's strategic priorities and resource availability. This context directly influences how AI initiatives are scored and classified.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {dataMode === 'mcp' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Load Space Context</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Enter Project Key (e.g., MKTG)"
                            value={spaceKey}
                            onChange={(e) => setSpaceKey(e.target.value)}
                            className="pl-9"
                            onKeyDown={(e) => e.key === 'Enter' && handleLoadSpaceContext()}
                          />
                        </div>
                        <Button onClick={handleLoadSpaceContext} disabled={isFetchingSpace}>
                          {isFetchingSpace ? <Spinner className="h-4 w-4" /> : 'Load'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Demo spaces: MKTG, ENG, OPS
                      </p>
                    </div>

                    {workspaceContext && (
                      <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">{workspaceContext.name}</h3>
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Strategic Focus</Label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {workspaceContext.focus.map((f) => (
                              <Badge key={f} variant="secondary">{f}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Active Enablers</Label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {workspaceContext.enablers.map((e) => (
                              <Badge 
                                key={e.key} 
                                variant="outline"
                                className={
                                  e.status === 'Active' ? 'border-emerald-500/50 text-emerald-600' :
                                  e.status === 'Stalled' ? 'border-amber-500/50 text-amber-600' :
                                  'border-red-500/50 text-red-600'
                                }
                              >
                                {e.key}: {e.status}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Constraints</Label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {workspaceContext.constraints.map((c) => (
                              <Badge key={c} variant="destructive" className="bg-red-500/10 text-red-600">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button onClick={() => setCurrentStep(2)} className="w-full">
                          Continue to Initiative
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Organizational Focus</Label>
                        <div className="group relative">
                          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                          <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-64 rounded-md border bg-popover p-3 text-xs shadow-lg group-hover:block">
                            <p className="font-medium text-foreground mb-1">Organizational Focus</p>
                            <p className="text-muted-foreground">
                              Your company's primary strategic objective. Initiatives that align with this focus receive a +1 Strategic Alignment Bonus to their Impact score.
                            </p>
                          </div>
                        </div>
                      </div>
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
                      <p className="text-xs text-muted-foreground">
                        Select the strategic priority that best represents current leadership directives.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Resource Capacity</Label>
                        <div className="group relative">
                          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                          <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-64 rounded-md border bg-popover p-3 text-xs shadow-lg group-hover:block">
                            <p className="font-medium text-foreground mb-1">Resource Capacity</p>
                            <p className="text-muted-foreground mb-2">
                              Current team bandwidth and availability for AI initiative work.
                            </p>
                            <ul className="text-muted-foreground space-y-1">
                              <li><span className="font-medium">High:</span> Dedicated team, full focus</li>
                              <li><span className="font-medium">Medium:</span> Shared resources, partial allocation</li>
                              <li><span className="font-medium">Low:</span> Limited bandwidth, competing priorities</li>
                            </ul>
                          </div>
                        </div>
                      </div>
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
                      <p className="text-xs text-muted-foreground">
                        Low capacity may affect Feasibility scoring for complex initiatives.
                      </p>
                    </div>

                    <Button onClick={handleSetManualContext} className="w-full">
                      Set Context & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            
          </div>
        )}

        {/* Step 2: Define Initiative */}
        {currentStep === 2 && (
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Context Banner */}
            {isContextSet && (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="font-medium text-foreground">Context Active:</span>
                    <span className="ml-2 text-muted-foreground">
                      {workspaceContext?.name || organizationalFocus} | {resourceCapacity} capacity
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetContext}>
                  Change
                </Button>
              </div>
            )}

            {/* MCP Search (if MCP mode) */}
            {dataMode === 'mcp' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Search Jira Artifacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter Jira Key (e.g., AI-101)"
                        value={jiraKey}
                        onChange={(e) => setJiraKey(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleMcpSearch()}
                      />
                    </div>
                    <Button onClick={handleMcpSearch} disabled={isFetchingMcp || !jiraKey.trim()}>
                      {isFetchingMcp ? <Spinner className="h-4 w-4" /> : 'Search'}
                    </Button>
                  </div>

                  {/* Multi-Select Bundle */}
                  {selectedArtifacts.length > 0 && (
                    <div className="space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Initiative Bundle ({selectedArtifacts.length} artifacts)</Label>
                        <Button variant="outline" size="sm" onClick={importMultiSelectBundle}>
                          <Zap className="mr-1.5 h-3.5 w-3.5" />
                          Score Bundle
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedArtifacts.map((artifact) => (
                          <Badge key={artifact.key} variant="secondary" className="gap-1.5 pr-1">
                            {artifact.key}
                            <button
                              onClick={() => removeArtifact(artifact.key)}
                              className="ml-1 rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Net Time Saved: {aggregatedFriction?.waitTime}h wait time reduction opportunity
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Demo keys: AI-101, AI-102, DATA-05, AI-202, INFRA-99
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Initiative Description */}
            <Card className={!isContextSet ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  {isContextSet ? (
                    <Unlock className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  AI Initiative Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
{/* Context Affinity Meter */}
  {isContextSet && useCaseDescription && (
  <div className="space-y-2">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-1.5">
    <Label className="text-xs text-muted-foreground">Context Affinity</Label>
    <div className="group relative">
      <Info className="h-3 w-3 cursor-help text-muted-foreground" />
      <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-64 rounded-md border bg-popover p-3 text-xs shadow-lg group-hover:block">
        <p className="font-medium text-foreground mb-1">Context Affinity Score</p>
        <p className="text-muted-foreground mb-2">
          Measures how well this initiative aligns with your organizational context:
        </p>
        <ul className="text-muted-foreground space-y-1 list-disc pl-3">
          <li><span className="text-emerald-600 font-medium">70%+</span>: Strong alignment with focus and enablers</li>
          <li><span className="text-amber-600 font-medium">40-69%</span>: Moderate fit; some constraints</li>
          <li><span className="text-red-600 font-medium">&lt;40%</span>: Misaligned or blocked by dependencies</li>
        </ul>
        <p className="text-muted-foreground mt-2 italic">
          Factors: Strategic alignment, blocker penalties, keyword matches in description.
        </p>
      </div>
    </div>
  </div>
  <span className="text-xs font-medium">{contextAffinity}%</span>
  </div>
  <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
  <div
  className={`transition-all duration-500 ${
  contextAffinity >= 70 ? 'bg-emerald-500' :
  contextAffinity >= 40 ? 'bg-amber-500' : 'bg-red-500'
  }`}
  style={{ width: `${contextAffinity}%` }}
  />
  </div>
  </div>
  )}

                <Textarea
                  placeholder="Describe the AI initiative..."
                  value={useCaseDescription}
                  onChange={(e) => setUseCaseDescription(e.target.value)}
                  className="min-h-24 resize-none"
                  disabled={!isContextSet}
                />

                {/* Additional Prioritization Context */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Additional Prioritization Context</Label>
                    <div className="group relative">
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                      <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-72 rounded-md border bg-popover p-3 text-xs shadow-lg group-hover:block">
                        <p className="font-medium text-foreground mb-1">Prioritization Context</p>
                        <p className="text-muted-foreground mb-2">
                          Provide supplementary information that influences scoring and analysis:
                        </p>
                        <ul className="text-muted-foreground space-y-1 list-disc pl-3">
                          <li>Business goals and deadlines</li>
                          <li>Team capabilities and constraints</li>
                          <li>Dependencies on other initiatives</li>
                          <li>Stakeholder requirements</li>
                        </ul>
                        <p className="text-muted-foreground mt-2 italic">
                          In MCP mode, impact hints are auto-populated here.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Add context like business goals, deadlines, dependencies, team capabilities, or constraints that should influence the analysis..."
                    value={prioritizationContext}
                    onChange={(e) => setPrioritizationContext(e.target.value)}
                    className="min-h-16 resize-none"
                    disabled={!isContextSet}
                  />
                </div>

                {/* Initiative Type */}
                <div className="space-y-2">
                  <Label className="text-sm">Initiative Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={workType === 'activation' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWorkType('activation')}
                      className="w-full justify-center"
                      disabled={!isContextSet}
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Activation
                    </Button>
                    <Button
                      variant={workType === 'enablement' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWorkType('enablement')}
                      className="w-full justify-center"
                      disabled={!isContextSet}
                    >
                      <Layers className="mr-1.5 h-3.5 w-3.5" />
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
                      disabled={!isContextSet}
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

                {/* Blocker Alert */}
                {blockerAlert && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      Blocker: {blockerAlert.key} is {blockerAlert.status} (-{feasibilityPenalty} Feasibility)
                    </span>
                  </div>
                )}

                {/* Strategic Bonus */}
                {hasStrategicBonus && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600">
                      Strategic Alignment Bonus Active (+1 Impact)
                    </span>
                  </div>
                )}

                <Button 
                  onClick={() => setCurrentStep(3)} 
                  className="w-full"
                  disabled={!isContextSet || !useCaseDescription}
                >
                  Proceed to AI Synthesis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: AI Synthesis & Scoring */}
        {currentStep === 3 && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Scoring */}
            <div className="space-y-6">
              {/* Context Summary */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Active Context</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Edit
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {workspaceContext?.name || organizationalFocus} | {resourceCapacity} capacity
                  </div>
                </CardContent>
              </Card>

              {/* IFS Sliders */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      H
                    </span>
                    Human-in-the-Loop Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ScoreSlider
                    icon={<Zap className="h-4 w-4" />}
                    label="Impact"
                    dimension="impact"
                    value={impact}
                    onChange={(v) => handleScoreChange('impact', v)}
                    bonus={enablementBonus + (hasStrategicBonus ? 1 : 0)}
                    isOverridden={mcpOriginalScores && mcpOriginalScores.impact !== impact}
                  />
                  <ScoreSlider
                    icon={<Target className="h-4 w-4" />}
                    label="Feasibility"
                    dimension="feasibility"
                    value={feasibility}
                    onChange={(v) => handleScoreChange('feasibility', v)}
                    penalty={feasibilityPenalty}
                    isOverridden={mcpOriginalScores && mcpOriginalScores.feasibility !== feasibility}
                  />
                  <ScoreSlider
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Scalability"
                    dimension="scalability"
                    value={scalability}
                    onChange={(v) => handleScoreChange('scalability', v)}
                    isOverridden={mcpOriginalScores && mcpOriginalScores.scalability !== scalability}
                  />
                </CardContent>
              </Card>

              {/* Friction Metrics */}
              {aggregatedFriction && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Friction Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-emerald-500" />
                        Active: {aggregatedFriction.activeTime}h
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-500" />
                        Wait: {aggregatedFriction.waitTime}h
                      </span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-full">
                      <div 
                        className="bg-emerald-500"
                        style={{ width: `${(1 - aggregatedFriction.ratio) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500"
                        style={{ width: `${aggregatedFriction.ratio * 100}%` }}
                      />
                    </div>
                    {aggregatedFriction.ratio > 0.6 && (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                        High Automation Potential
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column - Results */}
            <div className="space-y-6">
              {/* Score Display */}
              <Card className="overflow-hidden">
                <div className={`h-1.5 ${archetype.color}`} />
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Total Score</p>
                    <div className="mb-4 text-6xl font-bold tabular-nums tracking-tight text-foreground">
                      {totalScore}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`px-4 py-1.5 text-sm font-medium text-white ${archetype.color}`}>
                        {archetype.name}
                      </Badge>
                      {isCriticalPath && (
                        <Badge className="bg-red-600 text-white hover:bg-red-600">
                          Critical Path
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Archetype Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
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

              {/* Context Metadata */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    Context Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Certainty Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Certainty Score</Label>
                      <Badge variant={certaintyScore >= 50 ? 'default' : 'destructive'} 
                        className={certaintyScore >= 50 ? 'bg-green-500 hover:bg-green-500/90' : ''}>
                        {certaintyScore}%
                      </Badge>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={certaintyScore >= 50 ? 'bg-green-500' : 'bg-red-500'}
                        style={{ width: `${certaintyScore}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="space-y-2">
                    <Label className="text-sm">AI Reasoning Rubric</Label>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-sm leading-relaxed text-foreground">{reasoning}</p>
                    </div>
                  </div>

                  {makes10xFaster && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-600">
                        Passes 10x Bottleneck Test
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Foundations & History */}
            <div className="space-y-6">
              {/* Foundations */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Foundations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {foundations.length === 0 ? (
                    <div className="py-8 text-center">
                      <Layers className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No foundations linked.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {foundations.map((foundation) => (
                        <div
                          key={foundation.key}
                          className="relative rounded-lg border border-purple-500/30 bg-purple-500/5 p-4"
                        >
                          <button
                            onClick={() => removeFoundation(foundation.key)}
                            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div className="flex-1 pr-6">
                              <Badge variant="outline" className="mb-1 font-mono text-xs">
                                {foundation.key}
                              </Badge>
                              <p className="text-sm font-medium text-foreground">{foundation.title}</p>
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Link2 className="h-3 w-3" />
                                <span>Linked to {foundation.linkedTo}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Override History */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Override Archive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overrideHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      <History className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No overrides recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overrideHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{entry.field}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {entry.previousValue} → {entry.newValue}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{entry.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Archetype Legend */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Archetype Legend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {[
                      { name: 'Transformer', score: '> 100', color: 'bg-blue-500' },
                      { name: 'The Foundation', score: 'High I/S, Low F', color: 'bg-purple-500' },
                      { name: 'Quick Win', score: 'High F, Mid I', color: 'bg-green-500' },
                      { name: 'The Experiment', score: '40-74', color: 'bg-yellow-500' },
                      { name: 'Money Pit', score: 'Low S, High F', color: 'bg-orange-500' },
                      { name: 'The Noise', score: '< 20', color: 'bg-gray-500' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-3 text-sm">
                        <div className={`h-3 w-3 rounded-full ${item.color}`} />
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground">({item.score})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
      { range: '1-3', text: 'Localized task speed-up; doesn\'t affect overall cycle time.' },
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
}: {
  icon: React.ReactNode
  label: string
  dimension: 'impact' | 'feasibility' | 'scalability'
  value: number
  onChange: (value: number) => void
  bonus?: number
  penalty?: number
  isOverridden?: boolean
}) {
  const displayValue = Math.min(10, Math.max(1, value + bonus - penalty))
  const rubric = IFS_RUBRICS[dimension]
  const [showTooltip, setShowTooltip] = useState(false)

  // Determine which rubric range applies
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
            <Badge variant="outline" className="border-amber-500/30 text-xs text-amber-600">
              Overridden
            </Badge>
          )}
          {/* Principle Check Tooltip */}
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
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          {displayValue}
        </span>
      </div>
      {/* Deep Question */}
      <p className="text-xs italic text-muted-foreground/80">{rubric.question}</p>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      {/* Dynamic Rubric Guidance */}
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">({currentRubric.range}):</span> {currentRubric.text}
      </p>
    </div>
  )
}
