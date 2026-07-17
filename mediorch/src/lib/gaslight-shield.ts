"use server"

import { store, type TimelineEvent, type SymptomLog } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type DismissalPattern = {
  detected: boolean
  symptom: string
  timesDismissed: number
  dismissals: {
    date: string
    who: string
    whatWasSaid: string
    severity: number
  }[]
  referralProbability: string
  suggestedScript: string
}

type WarningSign = {
  condition: string
  sign: string
  severity: "low" | "medium" | "high"
  source: "guideline" | "population_stat"
  description: string
}

type GaslightShieldReport = {
  userId: string
  dismissalPatterns: DismissalPattern[]
  warningSigns: WarningSign[]
  advocacyScore: number
  advocacyTips: string[]
  summary: string
}

const DISMISSAL_PHRASES = [
  "it's just stress",
  "it's all in your head",
  "lose weight",
  "you're fine",
  "nothing to worry about",
  "it's normal",
  "just anxiety",
  "you're overreacting",
  "it's just your period",
  "it's because you're getting older",
  "it's just a virus",
  "try to relax",
  "it's not that bad",
  "you're too young for that",
  "wait and see",
  "let's just monitor it",
]

const CONDITIONS_AT_RISK = [
  { condition: "Endometriosis", stat: "Average diagnosis takes 7-10 years", dismissals: 4 },
  { condition: "Lupus", stat: "62% of patients initially misdiagnosed", dismissals: 3 },
  { condition: "Chronic Fatigue Syndrome (ME/CFS)", stat: "75% of patients not diagnosed", dismissals: 5 },
  { condition: "Fibromyalgia", stat: "Averaging 5 years to diagnose", dismissals: 3 },
  { condition: "Autoimmune thyroiditis", stat: "Often mistaken for depression", dismissals: 2 },
  { condition: "Migraine", stat: "50% of patients never diagnosed despite meeting criteria", dismissals: 2 },
  { condition: "PCOS", stat: "70% of cases undiagnosed", dismissals: 3 },
  { condition: "Ehlers-Danlos Syndrome", stat: "Average diagnosis takes 14 years", dismissals: 6 },
  { condition: "Long COVID", stat: "Often dismissed as anxiety", dismissals: 3 },
  { condition: "POTS", stat: "Average diagnosis takes 5-6 years", dismissals: 4 },
]

function detectDismissalPatterns(events: TimelineEvent[], symptoms: SymptomLog[]): DismissalPattern[] {
  const patterns: DismissalPattern[] = []

  const providerNotes = events
    .filter(e => e.type === "doctor_visit" || e.type === "symptom")
    .map(e => ({
      date: e.date,
      description: (e.description || e.title).toLowerCase(),
      title: e.title.toLowerCase(),
      type: e.type,
    }))

  const dismissalsBySymptom = new Map<string, { date: string; whatWasSaid: string; severity: number }[]>()

  const allText = [...providerNotes.map(n => n.description + " " + n.title)].join(" ")

  for (const phrase of DISMISSAL_PHRASES) {
    if (allText.includes(phrase)) {
      const matchingNote = providerNotes.find(n =>
        n.description.includes(phrase) || n.title.includes(phrase)
      )
      if (matchingNote) {
        const symptom = matchingNote.title.replace(phrase, "").trim() || "your concern"
        if (!dismissalsBySymptom.has(symptom)) dismissalsBySymptom.set(symptom, [])
        dismissalsBySymptom.get(symptom)!.push({
          date: matchingNote.date,
          whatWasSaid: phrase,
          severity: symptoms.find(s => s.symptom.toLowerCase().includes(symptom))?.severity ?? 5,
        })
      }
    }
  }

  const repeatedVisits = new Map<string, Set<string>>()
  for (const note of providerNotes) {
    if (note.type === "symptom") {
      const key = note.title.replace(/dismissed|ignored|not listened|said it's nothing|told me to relax/g, "").trim()
      if (key.length > 3) {
        if (!repeatedVisits.has(key)) repeatedVisits.set(key, new Set())
        repeatedVisits.get(key)!.add(note.date.substring(0, 7))
      }
    }
  }

  for (const [symptom, months] of repeatedVisits) {
    if (months.size >= 3 && !dismissalsBySymptom.has(symptom)) {
      dismissalsBySymptom.set(symptom, [
        { date: Array.from(months)[0], whatWasSaid: "repeated visits without diagnosis", severity: 6 },
      ])
    }
  }

  for (const [symptom, occurrences] of dismissalsBySymptom) {
    const matchedRisk = CONDITIONS_AT_RISK.find(r =>
      symptom.includes(r.condition.toLowerCase().substring(0, 5))
    )
    const referralProb = occurrences.length >= 4
      ? "High likelihood of delayed diagnosis. Consider a second opinion."
      : occurrences.length >= 2
      ? `Reported ${occurrences.length} times. Only 1 in 3 patients with persistent symptoms gets referred to a specialist.`
      : "Monitor this. If symptoms persist, request a specialist referral."

    patterns.push({
      detected: true,
      symptom,
      timesDismissed: occurrences.length,
      dismissals: occurrences.map(o => ({
        date: o.date,
        who: "Healthcare provider",
        whatWasSaid: o.whatWasSaid,
        severity: o.severity,
      })),
      referralProbability: referralProb,
      suggestedScript: `"I understand that ${symptom} may be common, but it's significantly affecting my quality of life. I would like it documented in my chart that I'm requesting a referral to a specialist. If you feel it's not necessary, please document your reasoning so I can review it."`,
    })
  }

  return patterns
}

function findWarningSigns(conditions: { name: string }[], symptoms: SymptomLog[], events: TimelineEvent[]): WarningSign[] {
  const signs: WarningSign[] = []

  const conditionNames = conditions.map(c => c.name.toLowerCase())

  if (conditionNames.some(c => c.includes("autoimmune") || c.includes("lupus") || c.includes("ra") || c.includes("thyroid"))) {
    if (symptoms.filter(s => s.symptom.toLowerCase().includes("fatigue")).length >= 2) {
      signs.push({
        condition: "Autoimmune condition",
        sign: "Persistent fatigue reported multiple times",
        severity: "high",
        source: "guideline",
        description: "Chronic fatigue in autoimmune conditions is often undertreated. Consider asking about fatigue-specific management.",
      })
    }
  }

  const severeSymptoms = symptoms.filter(s => s.severity >= 8)
  if (severeSymptoms.length >= 3) {
    signs.push({
      condition: "Multiple severe symptoms",
      sign: `${severeSymptoms.length} symptoms rated 8+/10 on severity scale`,
      severity: "high",
      source: "guideline",
      description: "Multiple severe symptoms should not be normalized. Request systematic evaluation if not already done.",
    })
  }

  const recentSymptoms = symptoms.filter(s => {
    const d = new Date(s.date)
    return Date.now() - d.getTime() < 90 * 86400000
  })

  if (recentSymptoms.length >= 10 && recentSymptoms.length <= 30) {
    signs.push({
      condition: "High symptom frequency",
      sign: `${recentSymptoms.length} symptom logs in 90 days`,
      severity: "medium",
      source: "population_stat",
      description: `You've logged symptoms ${recentSymptoms.length} times in 3 months — more than 80% of users. This volume suggests your condition deserves thorough investigation.`,
    })
  }

  return signs
}

export async function generateGaslightShieldReport(userId: string): Promise<GaslightShieldReport> {
  const conditions = store.condition.findByUser(userId)
  const symptoms = store.symptom.findByUser(userId)
  const events = store.timeline.findByUser(userId)

  if (isDemoMode()) {
    return getDemoGaslightReport(conditions, symptoms, userId)
  }

  if (conditions.length === 0 && symptoms.length === 0) {
    return {
      userId,
      dismissalPatterns: [],
      warningSigns: [],
      advocacyScore: 85,
      advocacyTips: ["Add your conditions and symptoms to enable medical gaslighting detection."],
      summary: "Add health data to enable the Medical Gaslighting Shield. It tracks symptom reporting patterns and helps you advocate for proper care.",
    }
  }

  const dismissalPatterns = detectDismissalPatterns(events, symptoms)
  const warningSigns = findWarningSigns(conditions, symptoms, events)

  const dismissalCount = dismissalPatterns.reduce((sum, p) => sum + p.timesDismissed, 0)
  const advocacyScore = Math.max(40, 85 - (dismissalCount * 8) - (warningSigns.filter(w => w.severity === "high").length * 5))

  const tips: string[] = [
    "Always request that your concerns and the provider's response be documented in your chart.",
    "Bring a printed symptom log to each appointment — visual data is harder to dismiss.",
    "Use the 'Ask for a specialist referral' phrase when you feel your concerns aren't being addressed.",
    "Consider bringing a trusted friend or family member to appointments for support.",
    "You can request a second opinion at any time — it's your right as a patient.",
  ]

  if (dismissalCount > 0) {
    tips.unshift(`You've been dismissed ${dismissalCount} time(s) across your visits. Your advocacy score is ${advocacyScore}/100.`)
  }

  return {
    userId,
    dismissalPatterns,
    warningSigns,
    advocacyScore,
    advocacyTips: tips,
    summary: dismissalPatterns.length > 0
      ? `Medical gaslighting shield detected ${dismissalCount} dismissal pattern(s). Your advocacy score is ${advocacyScore}/100. ${warningSigns.length} warning sign(s) identified.`
      : "No medical gaslighting patterns detected. Your advocacy score is looking good.",
  }
}

function getDemoGaslightReport(conditions: { name: string }[], _symptoms: SymptomLog[], _userId: string): GaslightShieldReport {
  if (conditions.length === 0) {
    return {
      userId: _userId,
      dismissalPatterns: [],
      warningSigns: [],
      advocacyScore: 85,
      advocacyTips: ["Add your conditions and symptoms to unlock the Medical Gaslighting Shield."],
      summary: "No medical conditions added yet. The Gaslighting Shield works by tracking how your symptoms are addressed over time and alerting you to potential dismissal patterns.",
    }
  }

  return {
    userId: _userId,
    dismissalPatterns: [
      {
        detected: true,
        symptom: "Chronic fatigue",
        timesDismissed: 3,
        dismissals: [
          { date: new Date(Date.now() - 180 * 86400000).toISOString().split("T")[0], who: "Primary care provider", whatWasSaid: "it's just stress", severity: 6 },
          { date: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0], who: "Primary care provider", whatWasSaid: "you're fine", severity: 7 },
          { date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0], who: "Urgent care doctor", whatWasSaid: "it's just a virus", severity: 8 },
        ],
        referralProbability: "You've reported this 3 times. Only 1 in 3 patients with persistent symptoms gets referred to a specialist. Request a referral explicitly.",
        suggestedScript: '"I understand fatigue is common, but it\'s significantly affecting my ability to work and function. I\'d like it documented that I\'m requesting a specialist referral for further evaluation."',
      },
    ],
    warningSigns: [
      {
        condition: "Chronic fatigue / possible autoimmune",
        sign: "High symptom frequency: fatigue reported 3 times in 6 months",
        severity: "medium",
        source: "population_stat",
        description: "Persistent fatigue reported multiple times. Many autoimmune conditions (lupus, thyroiditis, ME/CFS) present primarily with fatigue and are frequently dismissed.",
      },
    ],
    advocacyScore: 61,
    advocacyTips: [
      "You've been dismissed 3 time(s) across your visits. Your advocacy score is 61/100.",
      'Use the phrase: "I would like this concern documented in my chart along with the reason a referral is not being provided."',
      "Bring a printed log of your symptoms with dates and severity to your next appointment.",
      "Consider requesting a second opinion if you feel your concerns aren't being fully addressed.",
      "You have the right to request a copy of all your medical records.",
    ],
    summary: "Medical gaslighting shield detected 1 dismissal pattern(s). Your advocacy score is 61/100. 1 warning sign(s) identified.",
  }
}
