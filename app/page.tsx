'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'

// Mock Jira data for MCP simulation
const mockJiraData: Record<string, {
  title: string
  bottleneck: string
  readiness: 'Ready' | 'Siloed' | 'Partial'
  links: string[]
  type: 'Activation' | 'Enablement'
  impact_hint: string
}> = {
  'AI-101': {
    title: 'Automated Claims Processing',
    bottleneck: 'Manual data entry from PDFs (8 hours/day)',
    readiness: 'Siloed',
    links: ['INFRA-20', 'DATA-05', 'DATA-09'],
    type: 'Activation',
    impact_hint: 'Eliminates primary entry bottleneck for the billing team.',
  },
  'DATA-05': {
    title: 'Snowflake-to-Model Pipeline',
    bottleneck: 'No real-time data flow for AI models',
    readiness: 'Ready',
    links: ['AI-101', 'AI-105', 'AI-202'],
    type: 'Enablement',
    impact_hint: 'Unlocks 3 high-impact activation use cases.',
  },
}

// Transform mockJiraData to internal format for MCP lookup
const MOCK_MCP_DATA: Record<string, {
  primaryBottleneck: string
  dataReadiness: string
  linkedDependencies: { key: string; type: 'enablement' | 'activation' }[]
  description: string
  title: string
  impactHint: string
  workType: 'enablement' | 'activation'
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

function getArchetype(
  totalScore: number,
  impact: number,
  scalability: number,
  feasibility: number,
  workType: 'enablement' | 'activation'
): Archetype {
  // Transformer: Score > 100 with high I, F, and S
  if (totalScore > 100) {
    return {
      name: 'Transformer',
      action: 'Immediate Delivery',
      color: 'bg-emerald-500',
      icon: <Rocket className="h-5 w-5" />,
      description: 'High impact, feasibility, and scalability. Ship immediately.',
    }
  }

  // The Foundation: High I/S, Low F, classified as Enablement
  if (impact >= 7 && scalability >= 7 && feasibility <= 4 && workType === 'enablement') {
    return {
      name: 'The Foundation',
      action: 'Fund Infrastructure',
      color: 'bg-blue-500',
      icon: <Layers className="h-5 w-5" />,
      description: 'Critical enablement work. Invest in infrastructure first.',
    }
  }

  // Quick Win: High F, Mid I
  if (feasibility >= 7 && impact >= 4 && impact <= 7) {
    return {
      name: 'Quick Win',
      action: 'Build Momentum',
      color: 'bg-cyan-500',
      icon: <Zap className="h-5 w-5" />,
      description: 'High feasibility with moderate impact. Build momentum.',
    }
  }

  // The Experiment: Score 40-74
  if (totalScore >= 40 && totalScore <= 74) {
    return {
      name: 'The Experiment',
      action: 'Time-box Prompting Party',
      color: 'bg-amber-500',
      icon: <FlaskConical className="h-5 w-5" />,
      description: 'Moderate potential. Time-box exploration to validate.',
    }
  }

  // Money Pit: Low S, High F
  if (scalability <= 3 && feasibility >= 7) {
    return {
      name: 'Money Pit',
      action: 'Defer - Manual/Non-Scalable',
      color: 'bg-orange-500',
      icon: <Trash2 className="h-5 w-5" />,
      description: 'Easy to build but won\'t scale. Defer or redesign.',
    }
  }

  // The Noise: Score < 20
  if (totalScore < 20) {
    return {
      name: 'The Noise',
      action: 'Discard',
      color: 'bg-red-500',
      icon: <Volume2 className="h-5 w-5" />,
      description: 'Low value across all dimensions. Discard.',
    }
  }

  // Default fallback for scores 20-39 or other edge cases
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
  archetype: Archetype
): string {
  const handoffAnalysis = impact >= 7
    ? 'Eliminates multiple handoff points in the current workflow.'
    : impact >= 4
    ? 'Reduces some handoffs but manual touchpoints remain.'
    : 'Minimal impact on existing handoff structure.'

  const waitTimeAnalysis = scalability >= 7
    ? 'Automation potential eliminates wait times between process steps.'
    : scalability >= 4
    ? 'Partial automation reduces wait times but oversight required.'
    : 'Wait times persist due to manual intervention requirements.'

  return `${handoffAnalysis} ${waitTimeAnalysis} Classification: ${archetype.name} (Score: ${totalScore}).`
}

export default function HyperadaptivePrioritizationEngine() {
  // Data Mode Toggle
  const [dataMode, setDataMode] = useState<'manual' | 'mcp'>('manual')
  const [jiraKey, setJiraKey] = useState('')
  const [isFetchingMcp, setIsFetchingMcp] = useState(false)
  const [mcpData, setMcpData] = useState<typeof MOCK_MCP_DATA['AI-101'] | null>(null)

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

  // Framework visibility
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(true)

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
    return Math.min(10, impact + enablementBonus)
  }, [impact, enablementBonus])

  // Calculate Total Score: (Impact × Scalability) × Feasibility
  const totalScore = useMemo(() => {
    return adjustedImpact * scalability * feasibility
  }, [adjustedImpact, scalability, feasibility])

  // Certainty Score
  const certaintyScore = useMemo(() => {
    return dataMode === 'mcp' ? 9 : 3
  }, [dataMode])

  // Get archetype
  const archetype = useMemo(() => {
    return getArchetype(totalScore, adjustedImpact, scalability, feasibility, workType)
  }, [totalScore, adjustedImpact, scalability, feasibility, workType])

  // Generate reasoning
  const reasoning = useMemo(() => {
    return generateReasoning(adjustedImpact, feasibility, scalability, totalScore, archetype)
  }, [adjustedImpact, feasibility, scalability, totalScore, archetype])

  // Handle MCP fetch simulation
  const handleMcpFetch = async () => {
    if (!jiraKey.trim()) return

    setIsFetchingMcp(true)
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

const data = MOCK_MCP_DATA[jiraKey.toUpperCase()]
  if (data) {
  setMcpData(data)
  setUseCaseDescription(data.title)
  // Set work type from the ticket's type
  setWorkType(data.workType)
  // Update prioritization context with impact hint
  if (data.impactHint) {
    setPrioritizationContext(prev => prev ? `${prev}\n\nMCP Impact Hint: ${data.impactHint}` : `MCP Impact Hint: ${data.impactHint}`)
  }
  } else {
  setMcpData(null)
  }

    setIsFetchingMcp(false)
  }

  const clearMcpData = () => {
    setMcpData(null)
    setJiraKey('')
    setUseCaseDescription('')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
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
                  Version 2.0 - Strategic Archetype Classification
                </p>
              </div>
            </div>

            {/* Data Mode Toggle */}
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
                  MCP Demo
                </span>
                <Database className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* IFS Framework Reference */}
        <div className="mb-8">
          <button
            onClick={() => setIsFrameworkOpen(!isFrameworkOpen)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/80 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:bg-card"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">The IFS Framework (1-10 Scale)</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                isFrameworkOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isFrameworkOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="group rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:bg-muted">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                          <Zap className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="font-semibold text-foreground">Impact (I)</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Breaks bottlenecks
                        <span className="mt-1 block text-xs text-muted-foreground/70">
                          10 = Transforms entire workflow
                        </span>
                      </p>
                    </div>

                    <div className="group rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:bg-muted">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                          <Target className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span className="font-semibold text-foreground">Feasibility (F)</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Ready to build
                        <span className="mt-1 block text-xs text-muted-foreground/70">
                          10 = Ship in 1-2 weeks
                        </span>
                      </p>
                    </div>

                    <div className="group rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:bg-muted">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                          <Layers className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-foreground">Scalability (S)</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        API-ready automation
                        <span className="mt-1 block text-xs text-muted-foreground/70">
                          10 = Unlimited zero-touch scale
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg bg-primary/5 px-5 py-4">
                    <p className="text-balance text-center text-base font-medium leading-relaxed text-foreground">
                      Formula: <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">(I x S) x F = Total Score</code>
                      <span className="ml-2 text-sm text-muted-foreground">Max: 1000</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* MCP Mode Input */}
            {dataMode === 'mcp' && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Atlassian MCP Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter Jira Key (e.g., AI-101, AI-200, AI-300)"
                        value={jiraKey}
                        onChange={(e) => setJiraKey(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleMcpFetch()}
                      />
                    </div>
                    <Button onClick={handleMcpFetch} disabled={isFetchingMcp || !jiraKey.trim()}>
                      {isFetchingMcp ? <Spinner className="h-4 w-4" /> : 'Fetch'}
                    </Button>
                  </div>

                  {mcpData && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono">
                          {jiraKey.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={clearMcpData}>
                          Clear
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Primary Bottleneck</Label>
                          <p className="text-sm text-foreground">{mcpData.primaryBottleneck}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Data Readiness</Label>
                          <p className="text-sm text-foreground">{mcpData.dataReadiness}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Linked Dependencies</Label>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {mcpData.linkedDependencies.map((dep) => (
                              <Badge
                                key={dep.key}
                                variant={dep.type === 'enablement' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                <Link2 className="mr-1 h-3 w-3" />
                                {dep.key}
                                <span className="ml-1 opacity-70">({dep.type})</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Demo keys: AI-101 (Localization), AI-200 (Hero Images), AI-300 (Onboarding)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Use Case Description */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Use Case Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the use case, including the current workflow pain points, desired outcome, and any technical requirements..."
                  value={useCaseDescription}
                  onChange={(e) => setUseCaseDescription(e.target.value)}
                  className="min-h-24 resize-none"
                />

                {/* Prioritization Context */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Prioritization Context
                  </Label>
                  <Textarea
                    placeholder="Provide additional context to help with prioritization and scoring. Include information like business goals, existing infrastructure, team capabilities, deadlines, dependencies, or any constraints that should influence the analysis..."
                    value={prioritizationContext}
                    onChange={(e) => setPrioritizationContext(e.target.value)}
                    className="min-h-28 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    This context helps improve scoring accuracy and AI-powered analysis.
                  </p>
                </div>

                {/* Work Type Selection */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm">Work Type:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={workType === 'activation' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWorkType('activation')}
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Activation
                    </Button>
                    <Button
                      variant={workType === 'enablement' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWorkType('enablement')}
                    >
                      <Layers className="mr-1.5 h-3.5 w-3.5" />
                      Enablement
                    </Button>
                  </div>
                </div>

                {/* Bottleneck Test Checklist */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="bottleneck-test"
                      checked={makes10xFaster}
                      onCheckedChange={(checked) => setMakes10xFaster(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="bottleneck-test" className="cursor-pointer font-medium">
                        The Bottleneck Test
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Does this make the entire process 10x faster?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enablement Bonus Indicator */}
                {workType === 'enablement' && linkedActivationCount >= 3 && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600">
                      Enablement Multiplier Active: +2 Impact bonus (linked to {linkedActivationCount} activation tickets)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* IFS Score Sliders */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    H
                  </span>
                  Human-in-the-Loop Scoring (1-10)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScoreSlider
                  icon={<Zap className="h-4 w-4" />}
                  label="Impact"
                  description="10 = Eliminates primary bottleneck completely"
                  value={impact}
                  onChange={setImpact}
                  bonus={enablementBonus}
                />
                <ScoreSlider
                  icon={<Target className="h-4 w-4" />}
                  label="Feasibility"
                  description="10 = All assets ready, ship in 1-2 weeks"
                  value={feasibility}
                  onChange={setFeasibility}
                />
                <ScoreSlider
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Scalability"
                  description="10 = Fully automated API, unlimited scale"
                  value={scalability}
                  onChange={setScalability}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Total Score Display */}
            <Card className="overflow-hidden">
              <div className={`h-1.5 transition-colors duration-300 ${archetype.color}`} />
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Total Score
                  </p>
                  <div className="mb-4 text-7xl font-bold tabular-nums tracking-tight text-foreground">
                    {totalScore}
                  </div>
                  <Badge
                    className={`px-4 py-1.5 text-sm font-medium text-white ${archetype.color}`}
                  >
                    {archetype.name}
                  </Badge>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Score Range: 1-1000 | Transformer: {'>'} 100
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formula Display */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Formula:</span>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-foreground">
                    (I x S) x F = ({adjustedImpact} x {scalability}) x {feasibility} = {totalScore}
                  </code>
                </div>
                {enablementBonus > 0 && (
                  <p className="mt-2 text-center text-xs text-emerald-600">
                    Impact includes +{enablementBonus} enablement bonus
                  </p>
                )}
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
                <div className={`flex items-center gap-4 rounded-lg border p-4 ${archetype.color}/10 border-${archetype.color}/30`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${archetype.color} text-white`}>
                    {archetype.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{archetype.name}</h3>
                    <p className="text-sm text-muted-foreground">{archetype.description}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Recommended Action</span>
                  </div>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {archetype.action}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Certainty Gauge & Reasoning */}
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
                    <Badge variant={certaintyScore >= 7 ? 'default' : 'secondary'}>
                      {certaintyScore}/10
                    </Badge>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`transition-all duration-500 ${
                        certaintyScore >= 7 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${certaintyScore * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dataMode === 'mcp'
                      ? 'High certainty - Data sourced from Atlassian MCP'
                      : 'Low certainty - Manual entry mode. Consider MCP for validation.'}
                  </p>
                </div>

                {/* AI Reasoning Rubric */}
                <div className="space-y-2">
                  <Label className="text-sm">AI Reasoning Rubric</Label>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      {reasoning}
                    </p>
                  </div>
                </div>

                {/* Bottleneck Test Result */}
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
                    { name: 'Transformer', score: '> 100', color: 'bg-emerald-500' },
                    { name: 'The Foundation', score: 'High I/S, Low F + Enablement', color: 'bg-blue-500' },
                    { name: 'Quick Win', score: 'High F, Mid I', color: 'bg-cyan-500' },
                    { name: 'The Experiment', score: '40-74', color: 'bg-amber-500' },
                    { name: 'Money Pit', score: 'Low S, High F', color: 'bg-orange-500' },
                    { name: 'The Noise', score: '< 20', color: 'bg-red-500' },
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
      </main>
    </div>
  )
}

function ScoreSlider({
  icon,
  label,
  description,
  value,
  onChange,
  bonus = 0,
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  bonus?: number
}) {
  const displayValue = Math.min(10, value + bonus)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium text-foreground">{label}</span>
          {bonus > 0 && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">
              +{bonus}
            </Badge>
          )}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          {displayValue}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span
            key={n}
            className={`text-xs ${
              n === value ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {n}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
