"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface AppealRecord {
  id: string; claimNumber: string; insuranceProvider: string
  amount: number; deniedReason: string; status: string
  letter: string | null; clinicalEvidence: string[] | null
  createdAt: string
}

interface AppealLetter {
  patientName: string; claimNumber: string; insuranceProvider: string
  amountDenied: number; reasonGiven: string; letterBody: string
  supportingCitations: string[]; submissionInstructions: string
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<AppealRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppeal, setSelectedAppeal] = useState<AppealLetter | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { loadAppeals() }, [])

  async function loadAppeals() {
    try {
      const res = await fetch("/api/appeals")
      if (res.ok) setAppeals(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function createAppeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const res = await fetch("/api/appeals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        claimNumber: fd.get("claimNumber"),
        insuranceProvider: fd.get("insuranceProvider"),
        amount: parseInt(fd.get("amount") as string) || 0,
        deniedReason: fd.get("deniedReason"),
      }),
    })

    if (res.ok) {
      toast.success("Appeal request created")
      e.currentTarget.reset()
      loadAppeals()
    } else toast.error("Failed to create appeal")
  }

  async function generateLetter(appealId: string) {
    setGenerating(true)
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", appealId }),
      })
      if (res.ok) {
        setSelectedAppeal(await res.json())
        toast.success("Appeal letter generated")
      } else toast.error("Failed to generate letter")
    } catch { toast.error("Network error") }
    setGenerating(false)
  }

  async function copyLetter(text: string) {
    await navigator.clipboard.writeText(text)
    toast.success("Letter copied to clipboard")
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><span className="gradient-text">Insurance Appeals</span></h1>
        <p className="text-muted-foreground mt-1">Generate clinically-cited appeal letters for denied insurance claims</p>
      </div>

      <Card className="glass-card border-white/10">
        <CardHeader><CardTitle className="text-lg">Create a New Appeal Request</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAppeal} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Claim number</Label>
              <Input name="claimNumber" placeholder="e.g. CLAIM-12345" required className="glass border-white/10" />
            </div>
            <div className="space-y-1">
              <Label>Insurance provider</Label>
              <Input name="insuranceProvider" placeholder="e.g. Blue Cross" required className="glass border-white/10" />
            </div>
            <div className="space-y-1">
              <Label>Amount denied ($)</Label>
              <Input name="amount" type="number" placeholder="e.g. 2500" required className="glass border-white/10" />
            </div>
            <div className="space-y-1">
              <Label>Denial reason</Label>
              <Input name="deniedReason" placeholder="e.g. Not medically necessary" required className="glass border-white/10" />
            </div>
            <div className="col-span-2">
              <Button type="submit" className="gradient-button w-full">Create Appeal Request</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {appeals.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-4">⚖️</p>
            <p className="text-muted-foreground">No appeal requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">Insurance denied a claim? Create an appeal and we'll generate a clinically-cited letter for you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appeals.map((a) => (
            <Card key={a.id} className="glass-card border-white/10">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{a.insuranceProvider} — Claim #{a.claimNumber}</p>
                    <p className="text-sm text-muted-foreground">Denied: ${a.amount.toLocaleString()} — Reason: {a.deniedReason}</p>
                  </div>
                  <Badge variant={a.status === "draft" ? "outline" : "default"}>{a.status}</Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => generateLetter(a.id)} disabled={generating} className="gradient-button">
                    {generating ? "..." : "📝 Generate Appeal Letter"}
                  </Button>
                  {a.letter && (
                    <Button size="sm" variant="outline" onClick={() => copyLetter(a.letter!)} className="border-white/10">
                      📋 Copy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedAppeal && (
        <Card className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>📄 Appeal Letter — Claim #{selectedAppeal.claimNumber}</span>
              <Button variant="outline" size="sm" onClick={() => copyLetter(selectedAppeal.letterBody)} className="border-white/10">
                📋 Copy Full Letter
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-background/50 border border-white/10 p-5 rounded-xl font-mono">
              {selectedAppeal.letterBody}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-medium mb-2">📚 Supporting Citations</p>
              <ul className="space-y-1">
                {selectedAppeal.supportingCitations.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {c}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-medium mb-1">📬 Submission Instructions</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAppeal.submissionInstructions}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
