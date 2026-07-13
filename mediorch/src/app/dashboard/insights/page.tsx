"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function InsightsPage() {
  const [researchResult, setResearchResult] = useState<string | null>(null)
  const [plainLanguage, setPlainLanguage] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [translateResult, setTranslateResult] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [translateText, setTranslateText] = useState("")
  const [showPlain, setShowPlain] = useState(false)

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

  return (
    <div className="space-y-6 pt-0 md:pt-0">
      <div>
        <h1 className="text-3xl font-bold"><span className="gradient-text">Insights & Research</span></h1>
        <p className="text-muted-foreground mt-1">Discover relevant medical research and translate complex information</p>
      </div>

      <Tabs defaultValue="research">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="research">📚 My Research</TabsTrigger>
          <TabsTrigger value="search">🔍 Search</TabsTrigger>
          <TabsTrigger value="translate">🧭 Plain Language</TabsTrigger>
        </TabsList>

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
