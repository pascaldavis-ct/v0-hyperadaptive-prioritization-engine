'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import {
  Brain,
  Zap,
  Wrench,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  X,
  Hammer,
  Layers,
  Info,
  ChevronDown,
} from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface AnalysisResult {
  bottleneckReasoning: string
  impactScore: number
  impactRationale: string
  feasibilityScore: number
  feasibilityRationale: string
  scalabilityScore: number
  scalabilityRationale: string
}

export default function PrioritizationDashboard() {
  const [clientContext, setClientContext] = useState('')
  const [userStory, setUserStory] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(true)

  // PDF upload state
  const [clientPdf, setClientPdf] = useState<{ name: string; text: string } | null>(null)
  const [storyPdf, setStoryPdf] = useState<{ name: string; text: string } | null>(null)
  const [isExtractingClient, setIsExtractingClient] = useState(false)
  const [isExtractingStory, setIsExtractingStory] = useState(false)

  // Human-adjusted scores (initialized from AI draft)
  const [impact, setImpact] = useState(3)
  const [feasibility, setFeasibility] = useState(3)
  const [scalability, setScalability] = useState(3)

  // Calculate IFS Score: (Impact × Scalability) × Feasibility
  const ifsScore = useMemo(() => {
    return impact * scalability * feasibility
  }, [impact, scalability, feasibility])

  // Determine priority level
  const priority = useMemo(() => {
    if (ifsScore >= 75) return { label: 'High Priority', color: 'bg-emerald-500' }
    if (ifsScore >= 40) return { label: 'Medium Priority', color: 'bg-amber-500' }
    return { label: 'Low Priority', color: 'bg-red-500' }
  }, [ifsScore])

  // Extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      fullText += pageText + '\n'
    }

    return fullText.trim()
  }

  // Handle PDF upload for client context
  const handleClientPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return

    setIsExtractingClient(true)
    try {
      const text = await extractPdfText(file)
      setClientPdf({ name: file.name, text })
      setClientContext((prev) => (prev ? `${prev}\n\n--- PDF Content ---\n${text}` : text))
    } catch (error) {
      console.error('Failed to extract PDF:', error)
    } finally {
      setIsExtractingClient(false)
      e.target.value = ''
    }
  }

  // Handle PDF upload for user story
  const handleStoryPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return

    setIsExtractingStory(true)
    try {
      const text = await extractPdfText(file)
      setStoryPdf({ name: file.name, text })
      setUserStory((prev) => (prev ? `${prev}\n\n--- PDF Content ---\n${text}` : text))
    } catch (error) {
      console.error('Failed to extract PDF:', error)
    } finally {
      setIsExtractingStory(false)
      e.target.value = ''
    }
  }

  // Remove PDF from client context
  const removeClientPdf = () => {
    if (clientPdf) {
      setClientContext((prev) => prev.replace(`\n\n--- PDF Content ---\n${clientPdf.text}`, '').replace(clientPdf.text, ''))
      setClientPdf(null)
    }
  }

  // Remove PDF from user story
  const removeStoryPdf = () => {
    if (storyPdf) {
      setUserStory((prev) => prev.replace(`\n\n--- PDF Content ---\n${storyPdf.text}`, '').replace(storyPdf.text, ''))
      setStoryPdf(null)
    }
  }

  const handleAnalyze = async () => {
    if (!clientContext.trim() || !userStory.trim()) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientContext, userStory }),
      })
      const result: AnalysisResult = await response.json()
      setAnalysis(result)

      // Initialize sliders with AI draft scores
      setImpact(result.impactScore)
      setFeasibility(result.feasibilityScore)
      setScalability(result.scalabilityScore)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                GenAI Prioritization Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                IFS Framework for Forward Deployed Engineers
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* IFS Framework Reference - Glassmorphism Card */}
        <div className="mb-8">
          <button
            onClick={() => setIsFrameworkOpen(!isFrameworkOpen)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-border/50 bg-card/80 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:bg-card"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">The IFS Framework</span>
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
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 p-6 shadow-xl backdrop-blur-xl">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                        <Zap className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="font-semibold text-white">Impact</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Breaks bottlenecks
                      <span className="mt-1 block text-xs text-slate-400">
                        Score 5 = 10x workflow speed
                      </span>
                    </p>
                  </div>

                  <div className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                        <Hammer className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="font-semibold text-white">Feasibility</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Ready to build
                      <span className="mt-1 block text-xs text-slate-400">
                        Score 5 = 2-4 week delivery
                      </span>
                    </p>
                  </div>

                  <div className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                        <Layers className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="font-semibold text-white">Scalability</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      API-ready automation
                      <span className="mt-1 block text-xs text-slate-400">
                        Score 5 = Zero-touch scale
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-center text-xs italic text-slate-400">
                    IFS ensures we prioritize transformation over individual task-speed improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Input Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Project Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="client-context">Client Context</Label>
                    <div className="flex items-center gap-2">
                      {clientPdf && (
                        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-24 truncate text-foreground">{clientPdf.name}</span>
                          <button
                            type="button"
                            onClick={removeClientPdf}
                            className="ml-1 rounded-sm text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleClientPdfUpload}
                          className="hidden"
                          disabled={isExtractingClient}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          {isExtractingClient ? (
                            <>
                              <Spinner className="h-3 w-3" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              Upload PDF
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                  <Textarea
                    id="client-context"
                    placeholder="Describe the client's industry, current workflows, pain points, and strategic goals..."
                    value={clientContext}
                    onChange={(e) => setClientContext(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-story">Jira User Story / PRD</Label>
                    <div className="flex items-center gap-2">
                      {storyPdf && (
                        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-24 truncate text-foreground">{storyPdf.name}</span>
                          <button
                            type="button"
                            onClick={removeStoryPdf}
                            className="ml-1 rounded-sm text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleStoryPdfUpload}
                          className="hidden"
                          disabled={isExtractingStory}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          {isExtractingStory ? (
                            <>
                              <Spinner className="h-3 w-3" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              Upload PDF
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                  <Textarea
                    id="user-story"
                    placeholder="Paste the user story or product requirements document..."
                    value={userStory}
                    onChange={(e) => setUserStory(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzing || !clientContext.trim() || !userStory.trim()
                  }
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Run Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Assessment Card */}
            {analysis && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    AI Draft Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bottleneck Reasoning</Label>
                    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
                      {analysis.bottleneckReasoning}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <RationaleItem
                      icon={<Zap className="h-3.5 w-3.5" />}
                      label="Impact"
                      score={analysis.impactScore}
                      rationale={analysis.impactRationale}
                    />
                    <RationaleItem
                      icon={<Wrench className="h-3.5 w-3.5" />}
                      label="Feasibility"
                      score={analysis.feasibilityScore}
                      rationale={analysis.feasibilityRationale}
                    />
                    <RationaleItem
                      icon={<TrendingUp className="h-3.5 w-3.5" />}
                      label="Scalability"
                      score={analysis.scalabilityScore}
                      rationale={analysis.scalabilityRationale}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Scoring */}
          <div className="space-y-6">
            {/* Real-time Score Display */}
            <Card className="overflow-hidden">
              <div
                className={`h-1.5 transition-colors duration-300 ${priority.color}`}
              />
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Final IFS Score
                  </p>
                  <div className="mb-4 text-7xl font-bold tabular-nums tracking-tight text-foreground">
                    {ifsScore}
                  </div>
                  <Badge
                    className={`px-4 py-1.5 text-sm font-medium text-white ${priority.color}`}
                  >
                    {priority.label}
                  </Badge>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Score Range: 1-125 • High: 75-125 • Medium: 40-74 • Low:
                    1-39
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
                    (I × S) × F = ({impact} × {scalability}) × {feasibility} ={' '}
                    {ifsScore}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Human-in-the-Loop Sliders */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    H
                  </span>
                  Human-in-the-Loop Adjustment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScoreSlider
                  icon={<Zap className="h-4 w-4" />}
                  label="Impact"
                  description="5 = Eliminates bottleneck • 1 = Minimal value"
                  value={impact}
                  onChange={setImpact}
                />
                <ScoreSlider
                  icon={<Wrench className="h-4 w-4" />}
                  label="Feasibility"
                  description="5 = All assets ready (2-4 wks) • 1 = Not feasible"
                  value={feasibility}
                  onChange={setFeasibility}
                />
                <ScoreSlider
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Scalability"
                  description="5 = Fully automated API • 1 = Manual prompting"
                  value={scalability}
                  onChange={setScalability}
                />
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
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
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

function RationaleItem({
  icon,
  label,
  score,
  rationale,
}: {
  icon: React.ReactNode
  label: string
  score: number
  rationale: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <Badge variant="secondary" className="tabular-nums">
            {score}/5
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {rationale}
        </p>
      </div>
    </div>
  )
}
