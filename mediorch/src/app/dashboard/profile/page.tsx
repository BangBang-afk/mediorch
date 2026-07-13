"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PrescriptionUpload } from "@/components/prescription-upload"

interface Condition { id: string; name: string; severity: string | null; notes: string | null }
interface Medication { id: string; name: string; dosage: string | null; frequency: string | null; prescribedBy: string | null; isActive: boolean }
interface Provider { id: string; name: string; specialty: string | null; phone: string | null; address: string | null }
interface Appointment { id: string; title: string; providerName: string | null; date: string; status: string; reason: string | null }

export default function ProfilePage() {
  const [conditions, setConditions] = useState<Condition[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const res = await fetch("/api/health-profile")
    if (res.ok) {
      const data = await res.json()
      setConditions(data.conditions)
      setMedications(data.medications)
      setProviders(data.providers)
      setAppointments(data.appointments)
    }
    setLoading(false)
  }

  async function addItem(type: string, data: Record<string, string>) {
    const res = await fetch("/api/health-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    })
    if (res.ok) {
      toast.success(`${type} added`)
      loadProfile()
    } else {
      toast.error(`Failed to add ${type}`)
    }
  }

  async function deleteItem(type: string, id: string) {
    const res = await fetch(`/api/health-profile?type=${type}&id=${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(`${type} removed`)
      loadProfile()
    } else {
      toast.error(`Failed to remove ${type}`)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your conditions, medications, providers, and appointments</p>
      </div>

      <Card className="p-6 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">📄 Scan a prescription</h2>
            <p className="text-sm text-muted-foreground">Upload a photo or PDF of your prescription to auto-fill your profile</p>
          </div>
        </div>
        <PrescriptionUpload onComplete={loadProfile} />
      </Card>

      <Tabs defaultValue="conditions">
        <TabsList>
          <TabsTrigger value="conditions">Conditions ({conditions.length})</TabsTrigger>
          <TabsTrigger value="medications">Medications ({medications.length})</TabsTrigger>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Condition</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                addItem("condition", {
                  name: fd.get("name") as string,
                  severity: fd.get("severity") as string || "",
                  notes: fd.get("notes") as string || "",
                })
                e.currentTarget.reset()
              }} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Condition name</Label>
                  <Input name="name" placeholder="e.g. Type 2 Diabetes" required />
                </div>
                <div className="w-32 space-y-1">
                  <Label>Severity</Label>
                  <Select name="severity">
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>
          {conditions.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <div className="flex gap-2 mt-1">
                    {c.severity && <Badge variant="secondary">{c.severity}</Badge>}
                  </div>
                  {c.notes && <p className="text-sm text-muted-foreground mt-1">{c.notes}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteItem("condition", c.id)}>✕</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Medication</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                addItem("medication", {
                  name: fd.get("name") as string,
                  dosage: fd.get("dosage") as string || "",
                  frequency: fd.get("frequency") as string || "",
                  prescribedBy: fd.get("prescribedBy") as string || "",
                })
                e.currentTarget.reset()
              }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input name="name" placeholder="e.g. Metformin" required />
                </div>
                <div className="space-y-1">
                  <Label>Dosage</Label>
                  <Input name="dosage" placeholder="e.g. 500mg" />
                </div>
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <Input name="frequency" placeholder="e.g. Twice daily" />
                </div>
                <div className="space-y-1">
                  <Label>Prescribed by</Label>
                  <Input name="prescribedBy" placeholder="Doctor name" />
                </div>
                <div className="col-span-2">
                  <Button type="submit">Add Medication</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {medications.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.dosage && `${m.dosage} — `}{m.frequency}{m.prescribedBy && ` (${m.prescribedBy})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.isActive && <Badge>Active</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => deleteItem("medication", m.id)}>✕</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Provider</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                addItem("provider", {
                  name: fd.get("name") as string,
                  specialty: fd.get("specialty") as string || "",
                  phone: fd.get("phone") as string || "",
                  address: fd.get("address") as string || "",
                })
                e.currentTarget.reset()
              }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input name="name" placeholder="Dr. Smith" required />
                </div>
                <div className="space-y-1">
                  <Label>Specialty</Label>
                  <Input name="specialty" placeholder="Cardiology" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input name="address" placeholder="123 Medical Dr" />
                </div>
                <div className="col-span-2">
                  <Button type="submit">Add Provider</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.specialty}{p.phone && ` · ${p.phone}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteItem("provider", p.id)}>✕</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add Appointment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                addItem("appointment", {
                  title: fd.get("title") as string,
                  providerName: fd.get("providerName") as string || "",
                  date: fd.get("date") as string,
                  reason: fd.get("reason") as string || "",
                })
                e.currentTarget.reset()
              }} className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input name="title" placeholder="Annual checkup" required />
                </div>
                <div className="space-y-1">
                  <Label>Provider</Label>
                  <Input name="providerName" placeholder="Dr. Smith" />
                </div>
                <div className="space-y-1">
                  <Label>Date & time</Label>
                  <Input name="date" type="datetime-local" required />
                </div>
                <div className="space-y-1">
                  <Label>Reason</Label>
                  <Input name="reason" placeholder="Routine visit" />
                </div>
                <div className="col-span-2">
                  <Button type="submit">Add Appointment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.providerName && `${a.providerName} · `}
                    {new Date(a.date).toLocaleDateString()} {new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "upcoming" ? "default" : "secondary"}>{a.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem("appointment", a.id)}>✕</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
