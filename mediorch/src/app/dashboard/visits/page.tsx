"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Appointment {
  id: string
  title: string
  providerName: string | null
  date: string
  status: string
  prepNotes: string | null
  followUp: string | null
  reason: string | null
}

export default function VisitsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [prepResult, setPrepResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [followUpMode, setFollowUpMode] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState("")

  useEffect(() => { loadAppointments() }, [])

  async function loadAppointments() {
    const res = await fetch("/api/health-profile")
    if (res.ok) {
      const data = await res.json()
      setAppointments(data.appointments)
    }
  }

  async function prepareVisit(apt: Appointment) {
    setSelectedApt(apt)
    setLoading(true)
    setFollowUpMode(false)
    setPrepResult(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Prepare me for my upcoming appointment: ${apt.title} with ${apt.providerName || "my doctor"} on ${new Date(apt.date).toLocaleDateString()}. My reason is: ${apt.reason || "regular visit"}.`,
          history: [],
        }),
      })
      const data = await res.json()
      setPrepResult(data.response)
    } catch {
      toast.error("Failed to generate prep notes")
    }
    setLoading(false)
  }

  async function saveFollowUp() {
    if (!selectedApt || !doctorNotes.trim()) return
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `SUMMARIZE_AFTER_VISIT:${selectedApt.id}:${doctorNotes}`,
          history: [],
        }),
      })
      const data = await res.json()
      setPrepResult(data.response)
      toast.success("Follow-up summary saved!")
      loadAppointments()
    } catch {
      toast.error("Failed to save follow-up")
    }
  }

  const upcoming = appointments.filter((a) => a.status === "upcoming")
  const past = appointments.filter((a) => a.status === "completed")

  return (
    <div className="space-y-6 pt-0 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Visit Prep</span>
          </h1>
          <p className="text-muted-foreground mt-1">Prepare for appointments and summarize after visits</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            🟢 {upcoming.length} upcoming
          </Badge>
          <Badge variant="secondary" className="bg-muted/50">
            ⚪ {past.length} past
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Upcoming Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm text-muted-foreground">No upcoming visits</p>
                </div>
              ) : (
                upcoming.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-lg">🏥</div>
                      <div>
                        <p className="font-medium text-sm">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.providerName && `${apt.providerName} · `}
                          {new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => prepareVisit(apt)} disabled={loading && selectedApt?.id === apt.id}
                      className="gradient-button text-xs">
                      {loading && selectedApt?.id === apt.id ? "..." : "Prepare"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Past Visits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {past.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-muted-foreground">No past visits recorded</p>
                </div>
              ) : (
                past.map((apt) => (
                  <div key={apt.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 flex items-center justify-center text-lg">📋</div>
                        <div>
                          <p className="font-medium text-sm">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.providerName && `${apt.providerName} · `}
                            {new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-white/10 text-xs"
                        onClick={() => {
                          setSelectedApt(apt)
                          setFollowUpMode(true)
                          setPrepResult(apt.followUp || null)
                        }}>
                        {apt.followUp ? "View" : "Summarize"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedApt && !followUpMode && (
            <Card className="glass-card border-white/10 sticky top-4">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Prep Guide</Badge>
                </div>
                <CardTitle className="text-lg">{selectedApt.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedApt.providerName} · {new Date(selectedApt.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-sm text-muted-foreground animate-pulse">Generating your prep guide...</p>
                    </div>
                  </div>
                ) : prepResult ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{prepResult}</div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {selectedApt && followUpMode && (
            <Card className="glass-card border-white/10 sticky top-4">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">Post-Visit</Badge>
                </div>
                <CardTitle className="text-lg">{selectedApt.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!prepResult ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Paste your doctor&apos;s notes or describe what happened, and I&apos;ll translate it into plain language with action items.
                    </p>
                    <Textarea
                      placeholder="Paste doctor's notes or describe what happened during the visit..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      rows={6}
                      className="glass border-white/10"
                    />
                    <Button onClick={saveFollowUp} disabled={!doctorNotes.trim()} className="gradient-button">
                      Generate Summary
                    </Button>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{prepResult}</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
