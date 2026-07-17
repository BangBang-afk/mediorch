"use server"

import { store, type StoredMedication, type SymptomLog } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type CrossRefType = "med-med" | "med-food" | "med-symptom" | "med-supplement" | "symptom-condition" | "food-symptom"

type CrossRefResult = {
  type: CrossRefType
  severity: "low" | "moderate" | "high" | "critical"
  title: string
  description: string
  recommendation: string
  items: string[]
  timestamp: string
}

type CrossRefReport = {
  userId: string
  results: CrossRefResult[]
  summary: string
  generatedAt: Date
}

const KNOWN_INTERACTIONS: Record<string, { interactsWith: string[]; effect: string; severity: "low" | "moderate" | "high" | "critical" }> = {
  warfarin: { interactsWith: ["aspirin", "ibuprofen", "naproxen", "vitamin k", "cranberry"], effect: "Increased bleeding risk", severity: "high" },
  statin: { interactsWith: ["grapefruit", "grapefruit juice", "macrolide antibiotics", "azole antifungals"], effect: "Increased risk of muscle damage and liver problems", severity: "moderate" },
  metformin: { interactsWith: ["alcohol", "contrast dye", "topiramate"], effect: "Increased risk of lactic acidosis", severity: "high" },
  lisinopril: { interactsWith: ["potassium supplements", "salt substitutes", "nsaids", "aliskiren"], effect: "Risk of hyperkalemia or reduced blood pressure control", severity: "moderate" },
  levothyroxine: { interactsWith: ["calcium", "iron", "soy", "fiber supplements", "proton pump inhibitors"], effect: "Reduced thyroid hormone absorption", severity: "moderate" },
  ssri: { interactsWith: ["maoi", "st johns wort", "triptans", "nsaids"], effect: "Serotonin syndrome risk or increased bleeding", severity: "high" },
  "blood pressure": { interactsWith: ["nsaids", "decongestants", "licorice", "caffeine"], effect: "May reduce effectiveness of blood pressure medication", severity: "moderate" },
}

const COMMON_FOOD_MED_INTERACTIONS: Record<string, { food: string; effect: string; severity: "low" | "moderate" | "high" }> = {
  warfarin: { food: "Leafy greens (vitamin K)", effect: "Reduces anticoagulant effect", severity: "high" },
  "thyroid medication": { food: "Calcium-rich foods within 4 hours", effect: "Blocks medication absorption", severity: "moderate" },
  "certain antibiotics": { food: "Dairy products within 2 hours", effect: "Binds to antibiotics, reduces effectiveness", severity: "moderate" },
  "iron supplements": { food: "Tea, coffee, calcium within 1 hour", effect: "Significantly reduces iron absorption", severity: "moderate" },
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim()
}

function findInteractingMeds(medications: StoredMedication[]): CrossRefResult[] {
  const results: CrossRefResult[] = []
  const names = medications.map(m => ({ id: m.id, name: normalizeName(m.name) }))

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i].name
      const b = names[j].name
      const interaction = KNOWN_INTERACTIONS[a]
      if (interaction && interaction.interactsWith.some(iw => b.includes(iw) || iw.includes(b))) {
        results.push({
          type: "med-med",
          severity: interaction.severity,
          title: `Interaction detected: ${medications[i].name} + ${medications[j].name}`,
          description: interaction.effect,
          recommendation: interaction.severity === "critical" ? "Contact your doctor immediately" : `Monitor for ${interaction.effect.toLowerCase()}. Discuss with your pharmacist.`,
          items: [medications[i].name, medications[j].name],
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  return results
}

function findFoodInteractions(medications: StoredMedication[]): CrossRefResult[] {
  const results: CrossRefResult[] = []
  for (const med of medications) {
    const name = normalizeName(med.name)
    for (const [medKey, interaction] of Object.entries(COMMON_FOOD_MED_INTERACTIONS)) {
      if (name.includes(medKey) || medKey.includes(name)) {
        results.push({
          type: "med-food",
          severity: interaction.severity,
          title: `Food interaction: ${med.name} + ${interaction.food}`,
          description: interaction.effect,
          recommendation: `Separate intake of ${interaction.food} from ${med.name} by at least 2-4 hours.`,
          items: [med.name, interaction.food],
          timestamp: new Date().toISOString(),
        })
      }
    }
  }
  return results
}

function findSymptomMedCorrelations(medications: StoredMedication[], symptoms: SymptomLog[]): CrossRefResult[] {
  const results: CrossRefResult[] = []
  const medStartMap = new Map<string, Date>()
  for (const med of medications) {
    if (med.startedAt) medStartMap.set(normalizeName(med.name), new Date(med.startedAt))
  }

  for (const symptom of symptoms) {
    const symptomDate = new Date(symptom.date)
    for (const med of medications) {
      if (!med.startedAt) continue
      const medStart = new Date(med.startedAt)
      const diffDays = (symptomDate.getTime() - medStart.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays > 0 && diffDays < 14) {
        results.push({
          type: "med-symptom",
          severity: symptom.severity >= 7 ? "high" : symptom.severity >= 4 ? "moderate" : "low",
          title: `Possible side effect: ${med.name} → ${symptom.symptom}`,
          description: `"${symptom.symptom}" (severity: ${symptom.severity}/10) started ${Math.round(diffDays)} day(s) after starting ${med.name}`,
          recommendation: `Note: This may be a side effect. Track it for ${14 - Math.round(diffDays)} more days. Report to your doctor if it persists.`,
          items: [med.name, symptom.symptom],
          timestamp: symptom.date,
        })
      }
    }
  }
  return results
}

export async function runCrossReference(userId: string): Promise<CrossRefReport> {
  const medications = store.medication.findByUser(userId).filter(m => m.isActive)
  const symptoms = store.symptom.findRecent(userId, 30)

  if (isDemoMode()) {
    return getCrossRefDemoReport(medications, symptoms, userId)
  }

  if (medications.length === 0 && symptoms.length === 0) {
    return {
      userId,
      results: [],
      summary: "No data to cross-reference yet. Add medications or log symptoms to get started.",
      generatedAt: new Date(),
    }
  }

  const results: CrossRefResult[] = [
    ...findInteractingMeds(medications),
    ...findFoodInteractions(medications),
    ...findSymptomMedCorrelations(medications, symptoms),
  ]

  const critical = results.filter(r => r.severity === "critical").length
  const high = results.filter(r => r.severity === "high").length
  const moderate = results.filter(r => r.severity === "moderate").length

  const summary = results.length === 0
    ? "No cross-reference issues detected. Your current profile looks clear."
    : `Found ${results.length} concern(s): ${critical} critical, ${high} high, ${moderate} moderate. Review recommendations below.`

  return { userId, results, summary, generatedAt: new Date() }
}

function getCrossRefDemoReport(medications: StoredMedication[], symptoms: SymptomLog[], userId: string): CrossRefReport {
  const results: CrossRefResult[] = [
    {
      type: "med-med",
      severity: "moderate",
      title: "Potential interaction: Lisinopril + Ibuprofen",
      description: "Both affect kidney function and blood pressure. Ibuprofen can reduce the effectiveness of lisinopril.",
      recommendation: "Use acetaminophen for pain instead of ibuprofen. If you must take ibuprofen, stay hydrated and monitor blood pressure.",
      items: ["Lisinopril", "Ibuprofen"],
      timestamp: new Date().toISOString(),
    },
    {
      type: "med-food",
      severity: "moderate",
      title: "Food interaction: Levothyroxine + Calcium",
      description: "Calcium supplements or calcium-rich foods within 4 hours of levothyroxine significantly reduce thyroid hormone absorption.",
      recommendation: "Take levothyroxine on an empty stomach 60 minutes before any food or calcium supplements.",
      items: ["Levothyroxine", "Calcium supplements"],
      timestamp: new Date().toISOString(),
    },
    {
      type: "med-symptom",
      severity: "moderate",
      title: "New symptom after starting Metformin: Fatigue",
      description: "Fatigue (severity: 5/10) started 5 days after beginning Metformin. This can be a common side effect during the adjustment period.",
      recommendation: "This often resolves within 2 weeks. Take Metformin with food. If fatigue persists beyond 2 weeks, consult your doctor.",
      items: ["Metformin", "Fatigue"],
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ]

  if (medications.length === 0) {
    results.length = 0
  }

  return {
    userId,
    results,
    summary: results.length === 0
      ? "No active medications to cross-reference. Your symptom log is clear."
      : `Found ${results.length} concern(s): 0 critical, 1 high, 2 moderate. Review recommendations below.`,
    generatedAt: new Date(),
  }
}
