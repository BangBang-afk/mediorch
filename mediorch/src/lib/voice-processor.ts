"use server"

import { store, type TimelineEventType } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type ParsedVoiceEntry = {
  type: "symptom" | "event"
  title: string
  description: string
  date: string
  severity: "mild" | "moderate" | "severe" | "informational"
  symptomData?: {
    symptom: string
    severity: number
    duration: string | null
    notes: string | null
    relatedCondition: string | null
  }
}

function parseNumericSeverity(text: string): { severity: number; matched: boolean } {
  const patterns = [
    { regex: /(\d+)\s*\/\s*10/, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { regex: /(?:severity|level|pain)\s*(?:of|:)?\s*(\d+)/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { regex: /(\d+)\s*out\s*of\s*10/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { regex: /\b(ten|nine|eight|seven|six|five|four|three|two|one|zero)\b/i, extract: (m: RegExpMatchArray) => {
      const map: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
      return map[m[1].toLowerCase()] ?? -1
    }},
  ]

  for (const p of patterns) {
    const match = text.match(p.regex)
    if (match) {
      const val = p.extract(match)
      if (val >= 0 && val <= 10) return { severity: val, matched: true }
    }
  }

  if (/\b(mild|slight|minor)\b/i.test(text)) return { severity: 3, matched: true }
  if (/\b(moderate|medium|somewhat)\b/i.test(text)) return { severity: 5, matched: true }
  if (/\b(severe|extreme|horrible|terrible|awful|agonizing|crippling|worst)\b/i.test(text)) return { severity: 8, matched: true }
  if (/\b(unbearable|excruciating|worst possible)\b/i.test(text)) return { severity: 10, matched: true }

  return { severity: 5, matched: false }
}

function detectSymptomWords(text: string): string[] {
  const symptoms = [
    "headache", "migraine", "fatigue", "nausea", "dizziness", "pain", "fever",
    "cough", "sore throat", "congestion", "shortness of breath", "chest pain",
    "back pain", "joint pain", "muscle ache", "stomach ache", "bloating",
    "constipation", "diarrhea", "rash", "itching", "swelling", "numbness",
    "tingling", "blurred vision", "ringing in ears", "insomnia", "anxiety",
    "depression", "mood swing", "brain fog", "loss of appetite", "weight loss",
    "weight gain", "night sweat", "chills", "weakness", "tremor", "palpitation",
  ]

  return symptoms.filter(s => text.toLowerCase().includes(s))
}

function detectDuration(text: string): string | null {
  const patterns = [
    /(?:for|about|around|lasted)\s+(\d+)\s*(day|days|week|weeks|month|months|hour|hours|minute|minutes)/i,
    /(\d+)\s*(day|days|week|weeks|month|months|hour|hours)\s+(?:now|straight|in a row|long)/i,
    /(?:since|for)\s+(?:the past|the last)?\s*(\d+)\s*(day|days|week|weeks)/i,
  ]

  for (const p of patterns) {
    const match = text.match(p)
    if (match) return `${match[1]} ${match[2]}`
  }

  if (/\b(sudden|suddenly|came on suddenly)\b/i.test(text)) return "Sudden onset"
  if (/\b(gradual|gradually|over time)\b/i.test(text)) return "Gradual onset"
  if (/\b(chronic|ongoing|persistent|constant)\b/i.test(text)) return "Ongoing"

  return null
}

function classifyText(text: string): ParsedVoiceEntry {
  const lower = text.toLowerCase()
  const now = new Date().toISOString().split("T")[0]

  const hasSymptomWords = detectSymptomWords(text)
  const isSymptom = hasSymptomWords.length > 0 ||
    /\b(feel|feeling|felt|experiencing|having|suffering|noticed|noticing)\b/i.test(text)

  if (isSymptom) {
    const severityInfo = parseNumericSeverity(text)
    const symptom = hasSymptomWords[0] || "symptom"
    const duration = detectDuration(text)
    const notes = text.length > 80 ? text : null

    const timelineSeverity: "mild" | "moderate" | "severe" | "informational" =
      severityInfo.severity >= 7 ? "severe" : severityInfo.severity >= 4 ? "moderate" : "mild"

    return {
      type: "symptom",
      title: `${symptom.charAt(0).toUpperCase() + symptom.slice(1)} (voice log)`,
      description: text,
      date: now,
      severity: timelineSeverity,
      symptomData: {
        symptom,
        severity: severityInfo.severity,
        duration,
        notes: notes || `${symptom} reported via voice`,
        relatedCondition: null,
      },
    }
  }

  let eventType: TimelineEventType = "symptom"
  let title = "Voice log entry"
  let severity: "mild" | "moderate" | "severe" | "informational" = "informational"

  if (/\b(doctor|appointment|visit|saw|checkup|clinic|hospital|specialist)\b/i.test(text)) {
    eventType = "doctor_visit"
    title = "Doctor visit (voice log)"
    severity = "informational"
  } else if (/\b(started?|taking?|prescribed?|medication|medicine|drug|pill)\b/i.test(text)) {
    eventType = "medication_change"
    title = "Medication change (voice log)"
    severity = "moderate"
  } else if (/\b(test|lab|blood|result|xray|mri|scan|ultrasound)\b/i.test(text)) {
    eventType = "lab_result"
    title = "Medical test (voice log)"
    severity = "informational"
  } else if (/\b(reaction|side effect|allergy|allergic)\b/i.test(text)) {
    eventType = "reaction"
    title = "Reaction reported (voice log)"
    severity = "moderate"
  }

  return {
    type: "event",
    title,
    description: text,
    date: now,
    severity,
  }
}

export async function processVoiceInput(userId: string, transcript: string): Promise<{ message: string; entry?: ParsedVoiceEntry }> {
  if (isDemoMode()) {
    return processVoiceDemo(userId, transcript)
  }

  const entry = classifyText(transcript)

  if (entry.type === "symptom" && entry.symptomData) {
    const sd = entry.symptomData
    const symptom = store.symptom.create({
      userId,
      symptom: sd.symptom,
      severity: sd.severity,
      duration: sd.duration,
      notes: sd.notes,
      date: entry.date,
      relatedCondition: sd.relatedCondition,
    })

    store.timeline.create({
      userId,
      type: "symptom",
      title: entry.title,
      description: transcript,
      date: entry.date,
      severity: entry.severity,
      relatedTo: [],
      metadata: {},
    })

    return {
      message: `Logged symptom: ${sd.symptom} (severity: ${sd.severity}/10)`,
      entry,
    }
  }

  store.timeline.create({
    userId,
    type: entry.type === "event" ? "doctor_visit" : "symptom",
    title: entry.title,
    description: transcript,
    date: entry.date,
    severity: entry.severity,
    relatedTo: [],
    metadata: {},
  })

  return {
    message: `Logged to timeline: ${entry.title}`,
    entry,
  }
}

function processVoiceDemo(_userId: string, transcript: string): Promise<{ message: string; entry?: ParsedVoiceEntry }> {
  const entry = classifyText(transcript)

  if (entry.type === "symptom" && entry.symptomData) {
    return Promise.resolve({
      message: `Logged symptom: ${entry.symptomData.symptom} (severity: ${entry.symptomData.severity}/10). ${entry.symptomData.duration ? `Duration: ${entry.symptomData.duration}.` : ""} Check your timeline to see it.`,
      entry,
    })
  }

  return Promise.resolve({
    message: `Logged to timeline: "${transcript.length > 60 ? transcript.substring(0, 60) + "..." : transcript}". Check your timeline to see it.`,
    entry,
  })
}
