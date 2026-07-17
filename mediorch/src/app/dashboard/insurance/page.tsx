"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface InsurancePlan {
  id: string; provider: string; planName: string; planType: string
  deductible: number; deductibleRemaining: number; outOfPocketMax: number
  oopRemaining: number; copayPrimary: number; copaySpecialist: number
  copayUrgentCare: number; copayER: number; coinsurance: number
  inNetwork: boolean; annualIncome: number
}

interface HospitalMatch {
  name: string; address: string; distance: number
  estimatedCost: number; qualityScore: number; specialties: string[]
  inNetwork: boolean; estimatedOOP: number; cashPrice: number
  matchedSpecialty: string
}

interface CostNavResult {
  treatment: string; hospitals: HospitalMatch[]
  estimatedSavings: { inNetwork: number; shopping: number; withCoupons: number }
  summary: string
}

export default function InsurancePage() {
  const [plans, setPlans] = useState<InsurancePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("plans")
  const [treatment, setTreatment] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [navResult, setNavResult] = useState<CostNavResult | null>(null)
  const [navLoading, setNavLoading] = useState(false)

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    try {
      const res = await fetch("/api/insurance")
      if (res.ok) setPlans(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function savePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      provider: fd.get("provider") as string,
      planName: fd.get("planName") as string,
      planType: fd.get("planType") as string,
      deductible: parseInt(fd.get("deductible") as string) || 0,
      deductibleRemaining: parseInt(fd.get("deductibleRemaining") as string) || 0,
      outOfPocketMax: parseInt(fd.get("outOfPocketMax") as string) || 0,
      copayPrimary: parseInt(fd.get("copayPrimary") as string) || 0,
      copaySpecialist: parseInt(fd.get("copaySpecialist") as string) || 0,
      coinsurance: parseInt(fd.get("coinsurance") as string) || 0,
      annualIncome: parseInt(fd.get("annualIncome") as string) || 0,
      inNetwork: true,
    }

    const res = await fetch("/api/insurance", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    })
    if (res.ok) { toast.success("Insurance plan saved"); loadPlans(); e.currentTarget.reset() }
    else toast.error("Failed to save plan")
  }

  async function searchHospitals() {
    if (!treatment.trim() || !zipCode.trim()) return
    setNavLoading(true)
    try {
      const res = await fetch(`/api/insurance/hospitals?treatment=${encodeURIComponent(treatment)}&zipCode=${encodeURIComponent(zipCode)}`)
      if (res.ok) setNavResult(await res.json())
      else toast.error("Failed to search")
    } catch { toast.error("Network error") }
    setNavLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><span className="gradient-text">Cost Navigator</span></h1>
        <p className="text-muted-foreground mt-1">Find the best hospitals for your treatment within your budget and insurance plan</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass border-white/10">
          <TabsTrigger value="plans">📋 Insurance Plans</TabsTrigger>
          <TabsTrigger value="search">🔍 Find Hospitals</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader><CardTitle className="text-lg">Add Your Insurance Plan</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={savePlan} className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Insurance provider</Label>
                  <Input name="provider" placeholder="e.g. Blue Cross, Aetna" required className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Plan name</Label>
                  <Input name="planName" placeholder="e.g. Silver PPO 2025" required className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Plan type</Label>
                  <Select name="planType">
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hmo">HMO</SelectItem>
                      <SelectItem value="ppo">PPO</SelectItem>
                      <SelectItem value="epo">EPO</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                      <SelectItem value="hdhp">HDHP</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Annual income (for savings calc)</Label>
                  <Input name="annualIncome" type="number" placeholder="e.g. 75000" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Annual deductible ($)</Label>
                  <Input name="deductible" type="number" placeholder="e.g. 3000" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Remaining deductible ($)</Label>
                  <Input name="deductibleRemaining" type="number" placeholder="e.g. 1500" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>OOP max ($)</Label>
                  <Input name="outOfPocketMax" type="number" placeholder="e.g. 8000" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Coinsurance (%)</Label>
                  <Input name="coinsurance" type="number" placeholder="e.g. 20" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Primary copay ($)</Label>
                  <Input name="copayPrimary" type="number" placeholder="e.g. 30" className="glass border-white/10" />
                </div>
                <div className="space-y-1">
                  <Label>Specialist copay ($)</Label>
                  <Input name="copaySpecialist" type="number" placeholder="e.g. 60" className="glass border-white/10" />
                </div>
                <div className="col-span-2">
                  <Button type="submit" className="gradient-button w-full">Save Insurance Plan</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {plans.map((p) => (
            <Card key={p.id} className="glass-card border-white/10">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.provider} — {p.planName}</p>
                    <Badge variant="outline" className="mt-1 border-cyan-500/30">{p.planType.toUpperCase()}</Badge>
                  </div>
                  <Badge variant={p.inNetwork ? "default" : "secondary"}>{p.inNetwork ? "In-Network" : "Out-of-Network"}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <div><span className="text-muted-foreground">Deductible:</span> ${p.deductible.toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Remaining:</span> ${p.deductibleRemaining.toLocaleString()}</div>
                  <div><span className="text-muted-foreground">OOP Max:</span> ${p.outOfPocketMax.toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Coinsurance:</span> {p.coinsurance}%</div>
                  <div><span className="text-muted-foreground">Primary copay:</span> ${p.copayPrimary}</div>
                  <div><span className="text-muted-foreground">Specialist:</span> ${p.copaySpecialist}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="search" className="mt-4 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader><CardTitle className="text-lg">Find Best Hospitals for Your Treatment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter a treatment or procedure and your ZIP code to find top hospitals ranked by quality, distance, and estimated cost based on your insurance plan.</p>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label>Treatment / procedure</Label>
                  <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="e.g. knee replacement, MRI, cardiology consult" className="glass border-white/10" />
                </div>
                <div className="w-32 space-y-1">
                  <Label>ZIP code</Label>
                  <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="e.g. 55901" className="glass border-white/10" />
                </div>
                <div className="flex items-end">
                  <Button onClick={searchHospitals} disabled={navLoading || !treatment || !zipCode} className="gradient-button">
                    {navLoading ? "..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {navResult && (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10">
                <p className="text-sm font-medium">{navResult.summary}</p>
              </div>

              {navResult.hospitals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Top Hospitals for "{navResult.treatment}"</h3>
                  {navResult.hospitals.map((h, i) => (
                    <Card key={i} className={`glass-card border-white/10 hover:border-cyan-500/30 transition-all ${i === 0 ? "ring-1 ring-cyan-500/30" : ""}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-gradient-to-br from-cyan-500 to-purple-500 text-white" : "bg-muted"}`}>
                              #{i + 1}
                            </div>
                            <div>
                              <p className="font-medium">{h.name}</p>
                              <p className="text-xs text-muted-foreground">{h.address} · {h.distance} mi</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">{h.matchedSpecialty}</Badge>
                                {h.inNetwork && <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400">In-Network</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold gradient-text">${h.estimatedCost.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Cash: ${h.cashPrice.toLocaleString()}</div>
                            <Badge variant="outline" className="mt-1 border-purple-500/30">Quality: {h.qualityScore}%</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="glass-card border-white/10">
                <CardHeader><CardTitle className="text-lg">💰 Estimated Savings</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-2xl font-bold text-emerald-500">${navResult.estimatedSavings.inNetwork.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">In-network savings</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-2xl font-bold text-cyan-500">${navResult.estimatedSavings.shopping.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Shopping around</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-2xl font-bold text-purple-500">${navResult.estimatedSavings.withCoupons.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Coupons & discounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
