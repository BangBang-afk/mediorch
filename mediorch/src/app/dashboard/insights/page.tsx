"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface CrossRefResult {
  type: string; severity: string; title: string
  description: string; recommendation: string; items: string[]
}

interface CrossRefReport {
  results: CrossRefResult[]; summary: string
}

interface GaslightReport {
  dismissalPatterns: { symptom: string; timesDismissed: number; dismissalScore: number; referralProbability: string; suggestedScript: string }[]
  warningSigns: { condition: string; sign: string; severity: string; description: string }[]
  advocacyScore: number; advocacyTips: string[]; summary: string
}

interface PredictionReport {
  predictions: { type: string; title: string; description: string; confidence: string; timeframe: string; actionSuggestion: string }[]
  patternInsights: { symptom: string; frequency: string; dayOfWeek: string }[]
  seasonalAlerts: string[]; summary: string
}

export default function InsightsPage() {
  const [researchResult, setResearchResult] = useState<string | null>(null)
  const [plainLanguage, setPlainLanguage] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [translateResult, setTranslateResult] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [translateText, setTranslateText] = useState("")
  const [showPlain, setShowPlain] = useState(false)

  const [crossRef, setCrossRef] = useState<CrossRefReport | null>(null)
  const [gaslight, setGaslight] = useState<GaslightReport | null>(null)
  const [predictions, setPredictions] = useState<PredictionReport | null>(null)

  async function runResearch() {
    setLoading("research")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Find recent research relevant to my conditions", history: [] }),
      })
      const data = await res.json()
      setResearchResult(data.response)
      if (data.plainLanguage) setPlainLanguage(data.plainLanguage)
    } catch { toast.error("Failed to get research") }
    setLoading(null)
  }

  async function searchTopic() {
    if (!searchQuery.trim()) return
    setLoading("search")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Search for recent research about: ${searchQuery}`, history: [] }),
      })
      const data = await res.json()
      setSearchResult(data.response)
    } catch { toast.error("Failed to search") }
    setLoading(null)
  }

  async function translateMedicalText() {
    if (!translateText.trim()) return
    setLoading("translate")
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `TRANSLATE_MEDICAL_TEXT: ${translateText}`, history: [] }),
      })
      const data = await res.json()
      setTranslateResult(data.response)
    } catch { toast.error("Failed to translate") }
    setLoading(null)
  }

  async function runCrossReference() {
    setLoading("crossref")
    try {
      const res = await fetch("/api/cross-ref")
      if (res.ok) setCrossRef(await res.json())
      else toast.error("Failed to run cross-reference")
    } catch { toast.error("Network error") }
    setLoading(null)
  }

  async function runGaslightShield() {
    setLoading("gaslight")
    try {
      const res = await fetch("/api/gaslight")
      if (res.ok) setGaslight(await res.json())
      else toast.error("Failed to generate report")
    } catch { toast.error("Network error") }
    setLoading(null)
  }

  async function runPredictions() {
    setLoading("predictions")
    try {
      const res = await fetch("/api/predictions")
      if (res.ok) setPredictions(await res.json())
      else toast.error("Failed to generate predictions")
    } catch { toast.error("Network error") }
    setLoading(null)
  }

  function SeverityBadge({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
      low: "bg-green-500/20 text-green-600 border-green-500/30",
      moderate: "bg-amber-500/20 text-amber-600 border-amber-500/30",
      high: "bg-orange-500/20 text-orange-600 border-orange-500/30",
      critical: "bg-red-500/20 text-red-600 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    }
    return <Badge variant="outline" className={colors[severity] || ""}>{severity}</Badge>
  }

  return (
    <div className="space-y-6 pt-0 md:pt-0">
      <div>
        <h1 className="text-3xl font-bold"><span className="gradient-text">Insights & Research</span></h1>
        <p className="text-muted-foreground mt-1">Cross-reference medications, detect dismissal patterns, get predictions, and research conditions</p>
      </div>

      <Tabs defaultValue="crossref">
        <TabsList className="glass border-white/10 flex-wrap">
          <TabsTrigger value="crossref">🔬 Cross-Reference</TabsTrigger>
          <TabsTrigger value="gaslight">🛡️ Gaslight Shield</TabsTrigger>
          <TabsTrigger value="predictions">🔮 Predictions</TabsTrigger>
          <TabsTrigger value="research">📚 My Research</TabsTrigger>
          <TabsTrigger value="search">🔍 Search</TabsTrigger>
          <TabsTrigger value="translate">🧭 Plain Language</TabsTrigger>
        </TabsList>

        <TabsContent value="crossref" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">🔬 Cross-Reference Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Checks your medications against each other, food interactions, and symptom correlations. Catches what standard interaction checkers miss.</p>
              <Button onClick={runCrossReference} disabled={loading === "crossref"} className="gradient-button">
                {loading === "crossref" ? "Scanning..." : "🔬 Run Cross-Reference"}
              </Button>
              {crossRef && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-white/10 text-sm">{crossRef.summary}</div>
                  {crossRef.results.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No issues detected. Your profile looks clean!</p>
                  ) : (
                    crossRef.results.map((r, i) => (
                      <Card key={i} className="border-white/10">
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <SeverityBadge severity={r.severity} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{r.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                              <p className="text-xs text-primary mt-2">{r.recommendation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaslight" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">🛡️ Medical Gaslighting Shield</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Tracks symptom reporting patterns and flags potential dismissal. Helps you advocate for proper care with data-backed conversation scripts.</p>
              <Button onClick={runGaslightShield} disabled={loading === "gaslight"} className="gradient-button">
                {loading === "gaslight" ? "Analyzing..." : "🛡️ Run Shield Report"}
              </Button>
              {gaslight && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-white/10">
                    <span className="text-sm">Advocacy Score</span>
                    <span className={`text-2xl font-bold ${gaslight.advocacyScore >= 70 ? "text-emerald-500" : gaslight.advocacyScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {gaslight.advocacyScore}/100
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-white/10 text-sm">{gaslight.summary}</div>

                  {gaslight.dismissalPatterns.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">⚠️ Dismissal Patterns Detected</p>
                      {gaslight.dismissalPatterns.map((d, i) => (
                        <Card key={i} className="border-red-500/20 bg-red-500/5">
                          <CardContent className="py-3">
                            <p className="font-medium text-sm">"{d.symptom}" — dismissed {d.timesDismissed} time(s)</p>
                            <p className="text-sm text-muted-foreground mt-1">{d.referralProbability}</p>
                            <div className="mt-2 p-2 rounded-lg bg-muted/30 text-xs italic text-muted-foreground border border-white/10">
                              💬 {d.suggestedScript}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {gaslight.warningSigns.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">⚠️ Warning Signs</p>
                      {gaslight.warningSigns.map((w, i) => (
                        <Card key={i} className="border-amber-500/20 bg-amber-500/5">
                          <CardContent className="py-3">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={w.severity} />
                              <p className="font-medium text-sm">{w.condition}</p>
                            </div>
                            <p className="text-sm mt-1">{w.sign}</p>
                            <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {gaslight.advocacyTips.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="font-medium text-sm mb-2">💡 Advocacy Tips</p>
                      <ul className="space-y-1">
                        {gaslight.advocacyTips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">🔮 Proactive Predictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Learns your personal health patterns and predicts flare-ups, seasonal risks, and preventive care opportunities before they happen.</p>
              <Button onClick={runPredictions} disabled={loading === "predictions"} className="gradient-button">
                {loading === "predictions" ? "Analyzing..." : "🔮 Generate Predictions"}
              </Button>
              {predictions && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-white/10 text-sm">{predictions.summary}</div>

                  {predictions.predictions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Add health data to enable predictions.</p>
                  ) : (
                    predictions.predictions.map((p, i) => (
                      <Card key={i} className="border-cyan-500/20">
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">
                              {p.type === "flare_up" ? "⚡" : p.type === "seasonal_pattern" ? "🌤️" : p.type === "medication_effect" ? "💊" : "📌"}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{p.title}</p>
                                <Badge variant="outline" className={p.confidence === "high" ? "border-emerald-500/30 text-emerald-600" : p.confidence === "medium" ? "border-amber-500/30 text-amber-600" : "border-red-500/30 text-red-600"}>
                                  {p.confidence}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="border-cyan-500/30 text-xs">⏰ {p.timeframe}</Badge>
                              </div>
                              <p className="text-xs text-primary mt-2">💡 {p.actionSuggestion}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {predictions.patternInsights.length > 0 && (
                    <Card className="border-white/10">
                      <CardHeader><CardTitle className="text-sm">📊 Pattern Insights</CardTitle></CardHeader>
                      <CardContent>
                        {predictions.patternInsights.map((pi, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                            <span className="text-sm">{pi.symptom}</span>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{pi.frequency}</span>
                              <span>•</span>
                              <span>{pi.dayOfWeek}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {predictions.seasonalAlerts.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="font-medium text-sm mb-2">🌤️ Seasonal Alerts</p>
                      <ul className="space-y-1">
                        {predictions.seasonalAlerts.map((a, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Research for Your Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">LiterAgent searches for recent medical research relevant to the conditions in your health profile.</p>
              <Button onClick={runResearch} disabled={loading === "research"} className="gradient-button">
                {loading === "research" ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...</span>
                ) : "🔬 Find Relevant Research"}
              </Button>
              {researchResult && (
                <div>
                  <div className="flex gap-2 mb-3">
                    {plainLanguage && (
                      <Button variant="outline" size="sm" onClick={() => setShowPlain(!showPlain)} className="border-white/10">
                        {showPlain ? "Show original" : "📖 Plain language"}
                      </Button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 border border-white/10 p-5 rounded-xl">
                    {showPlain && plainLanguage ? plainLanguage : researchResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Search Medical Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. New treatments for type 2 diabetes" className="flex-1 glass border-white/10" />
                <Button onClick={searchTopic} disabled={loading === "search" || !searchQuery.trim()} className="gradient-button">
                  {loading === "search" ? "..." : "Search"}
                </Button>
              </div>
              {searchResult && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 border border-white/10 p-5 rounded-xl">
                  {searchResult}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translate" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Translate Medical Jargon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Paste any medical text — doctor's notes, lab results, insurance letters — and NavAgent will explain it in plain language.</p>
              <textarea value={translateText} onChange={(e) => setTranslateText(e.target.value)} placeholder="Paste medical text, lab results, insurance terms, or doctor's notes here..." className="w-full min-h-[120px] rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" rows={5} />
              <Button onClick={translateMedicalText} disabled={loading === "translate" || !translateText.trim()} className="gradient-button">
                {loading === "translate" ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Translating...</span>
                ) : "🧭 Translate to Plain Language"}
              </Button>
              {translateResult && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-5 rounded-xl">
                  {translateResult}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
