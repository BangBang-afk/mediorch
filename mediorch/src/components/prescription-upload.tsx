"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ScanResult {
  conditions: { name: string; severity?: string; notes?: string }[]
  medications: { name: string; dosage?: string; frequency?: string; prescribedBy?: string }[]
  providers: { name: string; specialty?: string; phone?: string }[]
}

const SCANNING_STEPS = [
  "Analyzing document layout...",
  "Detecting text regions...",
  "Identifying medication names...",
  "Extracting dosages and frequencies...",
  "Recognizing prescriber information...",
  "Cross-referencing conditions...",
  "Finalizing health profile data...",
]

export function PrescriptionUpload({ onComplete }: { onComplete: () => void }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|pdf)$/i)) {
      toast.error("Please upload an image or PDF file")
      return
    }
    setFile(f)
    setResult(null)
    if (f.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [])

  async function startScan() {
    if (!file) return
    setScanning(true)
    setScanStep(0)

    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < SCANNING_STEPS.length - 1) return prev + 1
        clearInterval(stepInterval)
        return prev
      })
    }, 800)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload-prescription", {
        method: "POST",
        body: formData,
      })

      clearInterval(stepInterval)
      setScanStep(SCANNING_STEPS.length - 1)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }

      const data = await res.json()
      await new Promise((r) => setTimeout(r, 500))
      setResult(data.data)
      toast.success(data.message || "Prescription scanned successfully!")
    } catch (err) {
      clearInterval(stepInterval)
      toast.error(err instanceof Error ? err.message : "Failed to scan prescription")
    }

    setScanning(false)
    onComplete()
  }

  function reset() {
    setFile(null)
    setResult(null)
    setPreview(null)
    setScanStep(0)
  }

  const total = (result?.conditions.length || 0) + (result?.medications.length || 0) + (result?.providers.length || 0)

  return (
    <div className="space-y-4">
      {!file && !scanning && !result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              📄
            </div>
            <div>
              <p className="text-lg font-medium">Upload a prescription</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse
              </p>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">JPG</Badge>
              <Badge variant="secondary">PNG</Badge>
              <Badge variant="secondary">PDF</Badge>
            </div>
          </div>
        </div>
      )}

      {file && !scanning && !result && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            {preview ? (
              <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-2xl">
                📄
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>✕</Button>
          </div>
          <Button onClick={startScan} className="w-full" size="lg">
            <span className="mr-2">🔍</span>
            Scan Prescription
          </Button>
        </Card>
      )}

      {scanning && (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🔍
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-lg">Scanning your prescription...</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden w-64 max-w-full mx-auto">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((scanStep + 1) / SCANNING_STEPS.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                {SCANNING_STEPS[Math.min(scanStep, SCANNING_STEPS.length - 1)]}
              </p>
            </div>
          </div>
        </Card>
      )}

      {result && !scanning && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <p className="font-medium text-lg">Scan Complete</p>
            </div>
            <Badge className="text-sm px-3 py-1 bg-green-100 text-green-800">
              {total} items found
            </Badge>
          </div>

          {result.conditions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Conditions</p>
              <div className="space-y-2">
                {result.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                    <span>🩺</span>
                    <span className="font-medium">{c.name}</span>
                    {c.severity && <Badge variant="outline" className="text-xs">{c.severity}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.medications.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Medications</p>
              <div className="space-y-2">
                {result.medications.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                    <span>💊</span>
                    <span className="font-medium">{m.name}</span>
                    {m.dosage && <span className="text-muted-foreground">{m.dosage}</span>}
                    {m.frequency && <Badge variant="outline" className="text-xs">{m.frequency}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.providers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Providers</p>
              <div className="space-y-2">
                {result.providers.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                    <span>👨‍⚕️</span>
                    <span className="font-medium">{p.name}</span>
                    {p.specialty && <span className="text-muted-foreground">{p.specialty}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={reset} className="w-full">
            Scan another prescription
          </Button>
        </Card>
      )}
    </div>
  )
}
