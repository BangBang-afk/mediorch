"use server"

import { store, type TimelineEvent, type SymptomLog } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type TimelineSummary = {
  totalEvents: number
  byType: Record<string, number>
  recentEvents: TimelineEvent[]
  dateRange: { earliest: string; latest: string }
}

type Insight = {
  type: "milestone" | "warning" | "trend" | "achievement" | "correlation"
  title: string
  description: string
  icon: string
}

type HealthTimeline = {
  events: TimelineEvent[]
  symptoms: SymptomLog[]
  insights: Insight[]
  summary: TimelineSummary
}

export async function getHealthTimeline(userId: string, days: number = 90): Promise<HealthTimeline> {
  const events = store.timeline.findByUser(userId).filter(e => {
    const d = new Date(e.date)
    return Date.now() - d.getTime() < days * 86400000
  })
  const symptoms = store.symptom.findRecent(userId, days)

  if (isDemoMode()) {
    return getDemoHealthTimeline(userId, events, symptoms, days)
  }

  const insights: Insight[] = []

  const symptomsByType = new Map<string, SymptomLog[]>()
  for (const s of symptoms) {
    if (!symptomsByType.has(s.symptom)) symptomsByType.set(s.symptom, [])
    symptomsByType.get(s.symptom)!.push(s)
  }

  for (const [symptom, logs] of symptomsByType) {
    if (logs.length >= 3) {
      const severities = logs.map(l => l.severity)
      const trend = severities[severities.length - 1] - severities[0]
      if (trend <= -2) {
        insights.push({
          type: "trend",
          title: `${symptom} is improving`,
          description: `Your ${symptom.toLowerCase()} severity has decreased from ${severities[0]}/10 to ${severities[severities.length - 1]}/10 over ${logs.length} logs. Keep it up!`,
          icon: "📈",
        })
      } else if (trend >= 2) {
        insights.push({
          type: "warning",
          title: `${symptom} is worsening`,
          description: `Your ${symptom.toLowerCase()} severity has increased from ${severities[0]}/10 to ${severities[severities.length - 1]}/10. Consider discussing with your doctor.`,
          icon: "⚠️",
        })
      }
    }
  }

  const medChanges = events.filter(e => e.type === "medication_change")
  if (medChanges.length > 0) {
    insights.push({
      type: "milestone",
      title: `${medChanges.length} medication change(s) recorded`,
      description: `You've recorded ${medChanges.length} changes to your medications in the last ${days} days.`,
      icon: "💊",
    })
  }

  if (symptoms.length === 0 && events.length === 0) {
    insights.push({
      type: "achievement",
      title: "Start your health timeline",
      description: "Log symptoms, doctor visits, and medication changes to see your health story unfold. Each entry helps MediOrch find patterns.",
      icon: "🌟",
    })
  }

  const byType: Record<string, number> = {}
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1
  }

  const dates = events.map(e => e.date).concat(symptoms.map(s => s.date))
  const dateRange = dates.length > 0
    ? { earliest: dates.toSorted()[0], latest: dates.toSorted()[dates.length - 1] }
    : { earliest: new Date().toISOString(), latest: new Date().toISOString() }

  return {
    events,
    symptoms,
    insights,
    summary: {
      totalEvents: events.length + symptoms.length,
      byType,
      recentEvents: events.slice(0, 10),
      dateRange,
    },
  }
}

function getDemoHealthTimeline(_userId: string, _events: TimelineEvent[], _symptoms: SymptomLog[], _days: number): HealthTimeline {
  const demoEvents: TimelineEvent[] = [
    {
      id: "demo-1", userId: "demo", type: "doctor_visit", title: "Annual physical with Dr. Smith",
      description: "Blood work ordered. BP slightly elevated at 132/85. Discussed fatigue concerns.",
      date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      severity: "informational", relatedTo: [], metadata: {},
      createdAt: new Date(Date.now() - 30 * 86400000),
    },
    {
      id: "demo-2", userId: "demo", type: "medication_change", title: "Started Metformin 500mg",
      description: "Prescribed for prediabetes management. Take twice daily with meals.",
      date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
      severity: "moderate", relatedTo: [], metadata: {},
      createdAt: new Date(Date.now() - 14 * 86400000),
    },
    {
      id: "demo-3", userId: "demo", type: "lab_result", title: "Lab results: A1C 6.2%",
      description: "Indicates prediabetes. Down from 6.4% last year. Improving but needs monitoring.",
      date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      severity: "moderate", relatedTo: [], metadata: {},
      createdAt: new Date(Date.now() - 7 * 86400000),
    },
  ]

  const demoSymptoms: SymptomLog[] = [
    { id: "ds-1", userId: "demo", symptom: "Fatigue", severity: 6, duration: "2 weeks", notes: "Especially after meals", date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0], relatedCondition: "Prediabetes", createdAt: new Date(Date.now() - 30 * 86400000) },
    { id: "ds-2", userId: "demo", symptom: "Fatigue", severity: 4, duration: "1 week", notes: "Slightly better this week", date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0], relatedCondition: "Prediabetes", createdAt: new Date(Date.now() - 14 * 86400000) },
    { id: "ds-3", userId: "demo", symptom: "Headache", severity: 5, duration: "3 days", notes: "Tension type, after long work days", date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0], relatedCondition: null, createdAt: new Date(Date.now() - 7 * 86400000) },
  ]

  return {
    events: demoEvents,
    symptoms: demoSymptoms,
    insights: [
      { type: "trend", title: "Fatigue is improving", description: "Your fatigue severity decreased from 6/10 to 4/10. This could be related to starting Metformin.", icon: "📈" },
      { type: "milestone", title: "Started Metformin 2 weeks ago", description: "Track how you feel and report any side effects to your doctor.", icon: "💊" },
      { type: "warning", title: "Headaches reported", description: "New symptom: headaches rated 5/10. Track frequency and potential triggers.", icon: "⚠️" },
    ],
    summary: {
      totalEvents: 6,
      byType: { doctor_visit: 1, medication_change: 1, lab_result: 1 },
      recentEvents: demoEvents,
      dateRange: { earliest: demoSymptoms[0].date, latest: demoEvents[0].date },
    },
  }
}
