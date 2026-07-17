"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { VoiceInput } from "@/components/voice-input"

interface TimelineEvent {
  id: string; type: string; title: string; description: string | null
  date: string; severity: string; metadata: Record<string, string>
}

interface SymptomLog {
  id: string; symptom: string; severity: number; duration: string | null
  notes: string | null; date: string; relatedCondition: string | null
}

const TYPE_ICONS: Record<string, string> = {
  symptom: "🤒", medication_change: "💊", diagnosis: "🩺", lab_result: "🧪",
  doctor_visit: "🏥", reaction: "⚠️", food_log: "🍽️", supplement: "💊",
  exercise: "🏃", sleep: "😴", mood: "😊", procedure: "🔬",
  vaccination: "💉", insurance_change: "📄", appeal: "⚖️",
}

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  moderate: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  severe: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  informational: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"timeline" | "log">("timeline")

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [eventsRes, symptomsRes] = await Promise.all([
        fetch("/api/timeline"),
        fetch("/api/symptoms"),
      ])
      if (eventsRes.ok) setEvents(await eventsRes.json())
      if (symptomsRes.ok) setSymptoms(await symptomsRes.json())
    } catch { toast.error("Failed to load timeline") }
    setLoading(false)
  }

  async function logSymptom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const severity = parseInt(fd.get("severity") as string) || 5

    const res = await fetch("/api/symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symptom: fd.get("symptom"),
        severity,
        duration: fd.get("duration") || null,
        notes: fd.get("notes") || null,
        date: fd.get("date") || new Date().toISOString().split("T")[0],
        relatedCondition: fd.get("relatedCondition") || null,
      }),
    })

    if (res.ok) {
      toast.success("Symptom logged")
      e.currentTarget.reset()
      loadData()
    } else toast.error("Failed to log symptom")
  }

  async function handleVoiceResult(transcript: string) {
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message, { duration: 5000 })
        loadData()
      } else {
        toast.error("Failed to process voice input")
      }
    } catch {
      toast.error("Network error processing voice")
    }
  }

  async function addEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: fd.get("type"),
        title: fd.get("title"),
        description: fd.get("description") || null,
        date: fd.get("date") || new Date().toISOString().split("T")[0],
        severity: fd.get("severity") || "informational",
      }),
    })

    if (res.ok) {
      toast.success("Event added to timeline")
      e.currentTarget.reset()
      loadData()
    } else toast.error("Failed to add event")
  }

  const allEntries = [
    ...events.map(e => ({ id: e.id, date: e.date, type: "event" as const, event: e })),
    ...symptoms.map(s => ({ id: s.id, date: s.date, type: "symptom" as const, symptom: s })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading timeline...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><span className="gradient-text">Health Timeline</span></h1>
          <p className="text-muted-foreground mt-1">Your complete health story — every symptom, visit, medication change, and more</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "timeline" ? "default" : "outline"} onClick={() => setTab("timeline")} className={tab === "timeline" ? "gradient-button" : "border-white/10"}>📋 Timeline</Button>
          <Button variant={tab === "log" ? "default" : "outline"} onClick={() => setTab("log")} className={tab === "log" ? "gradient-button" : "border-white/10"}>➕ Log Data</Button>
        </div>
      </div>

      {tab === "log" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-white/10">
            <CardHeader><CardTitle className="text-lg">🤒 Log a Symptom</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={logSymptom} className="space-y-3">
                <div className="space-y-1">
                  <Label>Symptom</Label>
                  <Input name="symptom" placeholder="e.g. Headache, Fatigue, Nausea" required className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Severity (0-10)</Label>
                  <Input name="severity" type="number" min="0" max="10" placeholder="5" className="glass border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Duration</Label>
                    <Input name="duration" placeholder="e.g. 3 days, 2 hours" className="glass border-white/10" />
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input name="date" type="date" className="glass border-white/10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Related condition (optional)</Label>
                  <Input name="relatedCondition" placeholder="e.g. Prediabetes" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea name="notes" placeholder="What were you doing? Any triggers?" className="glass border-white/10" rows={3} />
                </div>
                <Button type="submit" className="gradient-button w-full">Log Symptom</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader><CardTitle className="text-lg">📌 Add Timeline Event</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addEvent} className="space-y-3">
                <div className="space-y-1">
                  <Label>Event type</Label>
                  <Select name="type">
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor_visit">🏥 Doctor Visit</SelectItem>
                      <SelectItem value="medication_change">💊 Medication Change</SelectItem>
                      <SelectItem value="lab_result">🧪 Lab Result</SelectItem>
                      <SelectItem value="diagnosis">🩺 New Diagnosis</SelectItem>
                      <SelectItem value="procedure">🔬 Procedure</SelectItem>
                      <SelectItem value="vaccination">💉 Vaccination</SelectItem>
                      <SelectItem value="reaction">⚠️ Reaction</SelectItem>
                      <SelectItem value="insurance_change">📄 Insurance Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input name="title" placeholder="e.g. Annual physical with Dr. Smith" required className="glass border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input name="date" type="date" className="glass border-white/10" />
                  </div>
                  <div className="space-y-1">
                    <Label>Significance</Label>
                    <Select name="severity">
                      <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informational">ℹ️ Info</SelectItem>
                        <SelectItem value="mild">🟢 Mild</SelectItem>
                        <SelectItem value="moderate">🟡 Moderate</SelectItem>
                        <SelectItem value="severe">🔴 Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Details about this event..." className="glass border-white/10" rows={3} />
                </div>
                <Button type="submit" className="gradient-button w-full">Add to Timeline</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{allEntries.length} entries in your timeline</p>

          {allEntries.length === 0 ? (
            <Card className="glass-card border-white/10">
              <CardContent className="py-12 text-center">
                <p className="text-4xl mb-4">📋</p>
                <p className="text-muted-foreground">Your health timeline is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Log symptoms and events to build your complete health story</p>
                <Button onClick={() => setTab("log")} className="gradient-button mt-4">Start logging</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent" />
              <div className="space-y-4">
                {allEntries.map((entry) => {
                  if (entry.type === "event") {
                    const e = entry.event
                    return (
                      <div key={e.id} className="relative pl-16">
                        <div className="absolute left-4 top-3 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-background" />
                        <Card className="glass-card border-white/10 hover:border-cyan-500/30 transition-colors">
                          <CardContent className="py-3 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">{TYPE_ICONS[e.type] || "📌"}</span>
                              <div>
                                <p className="font-medium">{e.title}</p>
                                {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Badge variant="outline" className={SEVERITY_COLORS[e.severity] || ""}>{e.severity}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  } else {
                    const s = entry.symptom
                    const severityColor = s.severity >= 7 ? "text-red-500" : s.severity >= 4 ? "text-amber-500" : "text-green-500"
                    return (
                      <div key={s.id} className="relative pl-16">
                        <div className="absolute left-4 top-3 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-red-500 border-2 border-background" />
                        <Card className="glass-card border-white/10 hover:border-amber-500/30 transition-colors">
                          <CardContent className="py-3 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">🤒</span>
                              <div>
                                <p className="font-medium">{s.symptom}</p>
                                <p className={`text-sm font-medium ${severityColor}`}>Severity: {s.severity}/10</p>
                                {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
                                {s.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {s.duration}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {s.relatedCondition && <Badge variant="outline" className="border-purple-500/30">{s.relatedCondition}</Badge>}
                              <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <VoiceInput onResult={handleVoiceResult} variant="fab" />
    </div>
  )
}
