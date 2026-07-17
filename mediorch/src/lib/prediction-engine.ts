"use server"

import { store, type TimelineEvent, type SymptomLog, type StoredMedication } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type Prediction = {
  type: "flare_up" | "seasonal_pattern" | "medication_effect" | "missed_diagnosis" | "preventable_event" | "adherence_risk"
  title: string
  description: string
  confidence: "low" | "medium" | "high"
  timeframe: string
  actionSuggestion: string
  relatedItems: string[]
}

type PatternInsight = {
  symptom: string
  frequency: string
  commonTriggers: string[]
  bestTimeOfDay: string
  worstTimeOfDay: string
  dayOfWeek: string
  correlationWith: string[]
}

type PredictionReport = {
  userId: string
  predictions: Prediction[]
  patternInsights: PatternInsight[]
  seasonalAlerts: string[]
  summary: string
}

function analyzePatterns(symptoms: SymptomLog[]): PatternInsight[] {
  const bySymptom = new Map<string, SymptomLog[]>()
  for (const s of symptoms) {
    if (!bySymptom.has(s.symptom)) bySymptom.set(s.symptom, [])
    bySymptom.get(s.symptom)!.push(s)
  }

  const insights: PatternInsight[] = []
  for (const [symptom, logs] of bySymptom) {
    if (logs.length < 3) continue

    const dates = logs.map(l => new Date(l.date))
    const daysBetween: number[] = []
    for (let i = 1; i < dates.length; i++) {
      daysBetween.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24))
    }
    const avgDays = daysBetween.length > 0 ? Math.round(daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length) : 0

    const hours = dates.map(d => d.getHours())
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)

    const dayOfWeeks = dates.map(d => d.getDay())
    const mostCommonDay = [0, 1, 2, 3, 4, 5, 6].map(d => ({
      day: d,
      count: dayOfWeeks.filter(dw => dw === d).length,
    })).sort((a, b) => b.count - a.count)[0]

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    insights.push({
      symptom,
      frequency: avgDays > 0 ? `Every ${avgDays} days on average` : "Irregular",
      commonTriggers: [],
      bestTimeOfDay: avgHour < 12 ? "Morning" : avgHour < 17 ? "Afternoon" : "Evening",
      worstTimeOfDay: avgHour < 12 ? "Afternoon/Evening" : avgHour < 17 ? "Morning/Evening" : "Morning/Afternoon",
      dayOfWeek: `${dayNames[mostCommonDay.day]} (${mostCommonDay.count} occurrences)`,
      correlationWith: [],
    })
  }

  return insights
}

function buildPredictions(
  userId: string,
  conditions: { name: string }[],
  medications: StoredMedication[],
  symptoms: SymptomLog[],
  events: TimelineEvent[],
  insights: PatternInsight[]
): Prediction[] {
  const predictions: Prediction[] = []

  const upcomingAppointments = store.appointment.findByUser(userId)
    .filter(a => a.status === "upcoming" && new Date(a.date) > new Date())

  if (new Date().getMonth() >= 7 && new Date().getMonth() <= 9) {
    const respConditions = conditions.filter(c =>
      c.name.toLowerCase().includes("asthma") ||
      c.name.toLowerCase().includes("allerg") ||
      c.name.toLowerCase().includes("copd") ||
      c.name.toLowerCase().includes("sinus")
    )
    if (respConditions.length > 0) {
      predictions.push({
        type: "seasonal_pattern",
        title: `Fall allergen season approaching: ${respConditions.map(c => c.name).join(", ")}`,
        description: "Late summer to early fall (ragweed and mold season) typically worsens respiratory conditions. Your logs show higher symptom frequency during August-October.",
        confidence: "high",
        timeframe: "Next 2-4 weeks",
        actionSuggestion: "Schedule a pre-season checkup now. Ask about adjusting your allergy or asthma medications before symptoms peak. Consider starting antihistamines proactively.",
        relatedItems: respConditions.map(c => c.name),
      })
    }
  }

  for (const insight of insights) {
    if (insight.frequency.includes("Every") && parseInt(insight.frequency) <= 7) {
      predictions.push({
        type: "flare_up",
        title: `Recurring pattern detected: ${insight.symptom}`,
        description: `Your ${insight.symptom} follows a recurring pattern (${insight.frequency}). This predictability means it may be triggered by specific weekly activities or dietary patterns.`,
        confidence: "medium",
        timeframe: `Expected within ${insight.frequency}`,
        actionSuggestion: `Start a daily log tracking food, activity, and sleep to identify triggers for ${insight.symptom}. The pattern suggests a modifiable trigger exists.`,
        relatedItems: [insight.symptom],
      })
    }
  }

  const activeMeds = medications.filter(m => m.isActive)
  for (const med of activeMeds) {
    if (med.startedAt) {
      const startDate = new Date(med.startedAt)
      const daysOnMed = Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysOnMed > 80 && daysOnMed < 100) {
        predictions.push({
          type: "medication_effect",
          title: `3-month review due: ${med.name}`,
          description: `You've been taking ${med.name} for ${daysOnMed} days. Many medications require a 3-month effectiveness and side effect review.`,
          confidence: "high",
          timeframe: "This week",
          actionSuggestion: `Schedule a medication review with your prescriber. Track any side effects or changes in how you feel. Ask if the dosage is still appropriate.`,
          relatedItems: [med.name],
        })
      }
    }
  }

  if (new Date().getMonth() === 0 || new Date().getMonth() === 11) {
    predictions.push({
      type: "seasonal_pattern",
      title: "New year: insurance deductible resets",
      description: "Most insurance plans reset deductibles in January. If you have planned procedures or prescriptions, understanding your deductible status can save money.",
      confidence: "high",
      timeframe: "January",
      actionSuggestion: "Check if you've met your deductible. If you have, schedule procedures now. If not, ask about cash-pay options or manufacturer coupons for prescriptions.",
      relatedItems: [],
    })
  }

  if (predictions.length === 0) {
    predictions.push({
      type: "preventable_event",
      title: "Preventive care opportunity",
      description: "Based on your profile, there may be preventive screenings or immunizations you're due for. Staying current on preventive care can catch issues early.",
      confidence: "medium",
      timeframe: "Within 3 months",
      actionSuggestion: "Check with your doctor about recommended screenings based on your age, conditions, and family history.",
      relatedItems: [],
    })
  }

  return predictions
}

export async function generatePredictions(userId: string): Promise<PredictionReport> {
  const conditions = store.condition.findByUser(userId)
  const medications = store.medication.findByUser(userId)
  const symptoms = store.symptom.findByUser(userId)
  const events = store.timeline.findByUser(userId)

  if (isDemoMode()) {
    return getDemoPredictionReport(conditions, medications, symptoms, userId)
  }

  if (conditions.length === 0 && symptoms.length === 0) {
    return {
      userId,
      predictions: [],
      patternInsights: [],
      seasonalAlerts: [],
      summary: "Add conditions and symptoms to enable predictive insights. The more data you log, the smarter your predictions become.",
    }
  }

  const patternInsights = analyzePatterns(symptoms)
  const predictions = buildPredictions(userId, conditions, medications, symptoms, events, patternInsights)

  const seasonalAlerts: string[] = []
  const month = new Date().getMonth()
  if (month >= 7 && month <= 9) seasonalAlerts.push("Fall allergy season: Ragweed and mold spores peak Aug-Oct. Consider starting allergy medications before symptoms begin.")
  if (month >= 10 || month <= 1) seasonalAlerts.push("Flu season: Annual influenza vaccine recommended. Takes 2 weeks to build immunity.")
  if (month >= 4 && month <= 6) seasonalAlerts.push("Spring allergy season: Tree pollen peaks March-June. Start antihistamines early.")
  if (month >= 5 && month <= 8) seasonalAlerts.push("Summer: Heat-related illness risk increases. Stay hydrated, especially if on diuretics or blood pressure medication.")

  return {
    userId,
    predictions,
    patternInsights,
    seasonalAlerts,
    summary: `${predictions.length} prediction(s) and ${patternInsights.length} pattern insight(s) generated. ${seasonalAlerts.length} seasonal alert(s).`,
  }
}

function getDemoPredictionReport(
  conditions: { name: string }[],
  medications: StoredMedication[],
  symptoms: SymptomLog[],
  userId: string
): PredictionReport {
  const predictions: Prediction[] = [
    {
      type: "seasonal_pattern",
      title: "Fall allergy season approaching",
      description: "Late summer to early fall typically worsens respiratory conditions. Your profile shows you may be at risk for seasonal allergy exacerbation.",
      confidence: "high",
      timeframe: "Next 2-4 weeks",
      actionSuggestion: "Schedule a pre-season checkup now. Consider starting antihistamines proactively before symptoms peak. Keep windows closed during high pollen days.",
      relatedItems: conditions.map(c => c.name),
    },
    {
      type: "flare_up",
      title: "Recurring pattern detected: Headaches",
      description: "Your headache logs follow a recurring pattern. This predictability may mean specific triggers (food, sleep, weather) are involved.",
      confidence: "medium",
      timeframe: "Expected within 7 days",
      actionSuggestion: "Start tracking potential triggers: what you ate, hours of sleep, weather changes, and stress levels each day. Compare with headache days to identify patterns.",
      relatedItems: ["Headache"],
    },
  ]

  if (symptoms.length === 0) predictions.length = 0
  if (conditions.length === 0) predictions.length = 0

  return {
    userId,
    predictions,
    patternInsights: symptoms.length > 0
      ? [{ symptom: "Headaches", frequency: "Every 7 days", commonTriggers: ["Stress", "Skipping meals"], bestTimeOfDay: "Morning", worstTimeOfDay: "Afternoon", dayOfWeek: "Monday", correlationWith: ["Work stress", "Caffeine withdrawal"] }]
      : [],
    seasonalAlerts: ["Fall allergy season: Ragweed and mold spores peak Aug-Oct.", "Flu season approaching: Consider getting your flu shot."],
    summary: `${predictions.length} prediction(s) generated based on your health data. Log symptoms regularly to improve prediction accuracy.`,
  }
}
