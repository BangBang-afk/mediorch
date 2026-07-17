"use server"

import { store, type InsurancePlan } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type HospitalMatch = {
  name: string
  address: string
  distance: number
  estimatedCost: number
  qualityScore: number
  specialties: string[]
  inNetwork: boolean
  estimatedOOP: number
  cashPrice: number
  matchedSpecialty: string
}

type InsuranceAnalysis = {
  planSummary: string
  remainingDeductible: number
  needsMetBeforeDeductible: string
  coverageWarnings: string[]
  estimatedCostForTreatment: (treatmentCost: number) => { insurancePays: number; patientPays: number; afterDiscount: number }
}

type CostNavigatorResult = {
  treatment: string
  zipCode: string
  plan: InsurancePlan | null
  hospitals: HospitalMatch[]
  insuranceAnalysis: InsuranceAnalysis | null
  estimatedSavings: { inNetwork: number; shopping: number; withCoupons: number }
  summary: string
}

const DEMO_HOSPITALS: Record<string, { name: string; address: string; distance: number; qualityScore: number; specialties: string[] }[]> = {
  "cardiology": [
    { name: "Mayo Clinic - Rochester", address: "200 First St SW, Rochester, MN", distance: 5.2, qualityScore: 95, specialties: ["cardiology", "cardiac surgery", "interventional cardiology"] },
    { name: "Cleveland Clinic Main Campus", address: "9500 Euclid Ave, Cleveland, OH", distance: 12.8, qualityScore: 93, specialties: ["cardiology", "cardiac surgery", "vascular medicine"] },
    { name: "City General Hospital", address: "1500 Main St", distance: 2.1, qualityScore: 78, specialties: ["cardiology", "internal medicine", "emergency medicine"] },
    { name: "Community Health Medical Center", address: "800 Oak Ave", distance: 4.5, qualityScore: 72, specialties: ["cardiology", "family medicine"] },
  ],
  "orthopedics": [
    { name: "Hospital for Special Surgery", address: "535 E 70th St, New York, NY", distance: 3.1, qualityScore: 96, specialties: ["orthopedic surgery", "sports medicine", "rheumatology"] },
    { name: "Rothman Orthopaedic Institute", address: "925 Chestnut St, Philadelphia, PA", distance: 8.4, qualityScore: 91, specialties: ["orthopedic surgery", "spine surgery", "joint replacement"] },
    { name: "City General Hospital", address: "1500 Main St", distance: 2.1, qualityScore: 74, specialties: ["orthopedics", "physical therapy"] },
  ],
  "general": [
    { name: "City General Hospital", address: "1500 Main St", distance: 2.1, qualityScore: 78, specialties: ["internal medicine", "emergency", "cardiology", "orthopedics"] },
    { name: "University Medical Center", address: "500 College Blvd", distance: 6.3, qualityScore: 85, specialties: ["internal medicine", "surgery", "oncology", "neurology"] },
    { name: "Community Health Medical Center", address: "800 Oak Ave", distance: 4.5, qualityScore: 72, specialties: ["family medicine", "pediatrics"] },
  ],
}

const AVG_COST_BY_TREATMENT: Record<string, { cashPrice: number; inNetworkPrice: number }> = {
  "knee replacement": { cashPrice: 35000, inNetworkPrice: 18500 },
  "hip replacement": { cashPrice: 40000, inNetworkPrice: 22000 },
  "mri": { cashPrice: 2500, inNetworkPrice: 500 },
  "ct scan": { cashPrice: 1500, inNetworkPrice: 350 },
  "colonoscopy": { cashPrice: 3500, inNetworkPrice: 800 },
  "cataract surgery": { cashPrice: 5000, inNetworkPrice: 1500 },
  "appendectomy": { cashPrice: 25000, inNetworkPrice: 9500 },
  "childbirth delivery": { cashPrice: 30000, inNetworkPrice: 10000 },
  "generic prescription": { cashPrice: 100, inNetworkPrice: 15 },
  "brand name prescription": { cashPrice: 400, inNetworkPrice: 60 },
  "primary care visit": { cashPrice: 200, inNetworkPrice: 30 },
  "specialist visit": { cashPrice: 350, inNetworkPrice: 60 },
  "urgent care visit": { cashPrice: 250, inNetworkPrice: 75 },
  "er visit": { cashPrice: 2500, inNetworkPrice: 500 },
  "physical therapy session": { cashPrice: 150, inNetworkPrice: 30 },
}

function analyzeInsurancePlan(plan: InsurancePlan): InsuranceAnalysis {
  const warnings: string[] = []
  if (plan.deductible > 3000) warnings.push("High deductible plan — most costs paid out-of-pocket until $${plan.deductible} is met")
  if (plan.coinsurance > 20) warnings.push(`Coinsurance of ${plan.coinsurance}% is above average — you pay a larger share after deductible`)
  if (plan.copaySpecialist > plan.copayPrimary * 2) warnings.push("Specialist copay is significantly higher than primary care — try to get referrals")
  if (!plan.inNetwork) warnings.push("This plan has limited in-network coverage — out-of-network costs will be much higher")

  const needsMet = plan.deductible - plan.deductibleRemaining
  const needsMetStr = needsMet <= 0
    ? "Deductible already met for the year"
    : `$${needsMet.toLocaleString()} remaining before insurance starts covering`

  return {
    planSummary: `${plan.provider} ${plan.planName} (${plan.planType.toUpperCase()})`,
    remainingDeductible: plan.deductibleRemaining,
    needsMetBeforeDeductible: needsMetStr,
    coverageWarnings: warnings,
    estimatedCostForTreatment: (treatmentCost: number) => {
      if (treatmentCost <= plan.deductibleRemaining) {
        return { insurancePays: 0, patientPays: treatmentCost, afterDiscount: treatmentCost }
      }
      const afterDeductible = treatmentCost - plan.deductibleRemaining
      const insurancePays = afterDeductible * ((100 - plan.coinsurance) / 100)
      const patientPays = plan.deductibleRemaining + (afterDeductible * (plan.coinsurance / 100))
      const capped = Math.min(patientPays, plan.outOfPocketMax - (plan.outOfPocketMax - plan.oopRemaining))
      return { insurancePays, patientPays: capped, afterDiscount: Math.min(treatmentCost, capped) }
    },
  }
}

export async function findBestHospitals(
  userId: string,
  treatment: string,
  zipCode: string,
  maxDistance: number = 50
): Promise<CostNavigatorResult> {
  const plans = store.insurance.findByUser(userId)
  const plan = plans.length > 0 ? plans[0] : null
  const normalizedTreatment = treatment.toLowerCase()

  if (isDemoMode()) {
    return getDemoCostNavigation(plan, normalizedTreatment, zipCode)
  }

  let specialtyKey = "general"
  if (normalizedTreatment.includes("heart") || normalizedTreatment.includes("cardiac") || normalizedTreatment.includes("cardio")) specialtyKey = "cardiology"
  else if (normalizedTreatment.includes("knee") || normalizedTreatment.includes("hip") || normalizedTreatment.includes("bone") || normalizedTreatment.includes("joint") || normalizedTreatment.includes("ortho")) specialtyKey = "orthopedics"

  const candidateHospitals = DEMO_HOSPITALS[specialtyKey] || DEMO_HOSPITALS["general"]
  const costData = Object.entries(AVG_COST_BY_TREATMENT).find(([key]) =>
    normalizedTreatment.includes(key) || key.includes(normalizedTreatment)
  )?.[1] || { cashPrice: 2000, inNetworkPrice: 500 }

  const hospitals: HospitalMatch[] = candidateHospitals
    .filter(h => h.distance <= maxDistance)
    .map(h => ({
      ...h,
      estimatedCost: plan?.inNetwork ? costData.inNetworkPrice : costData.cashPrice,
      inNetwork: plan?.inNetwork ?? false,
      estimatedOOP: plan ? (plan.deductibleRemaining > 0 ? costData.inNetworkPrice : costData.cashPrice) : costData.cashPrice,
      cashPrice: costData.cashPrice,
      matchedSpecialty: specialtyKey === "general" ? "General" : specialtyKey.charAt(0).toUpperCase() + specialtyKey.slice(1),
    }))
    .sort((a, b) => b.qualityScore - a.qualityScore)

  const insuranceAnalysis = plan ? analyzeInsurancePlan(plan) : null

  const estimatedSavings = {
    inNetwork: costData.cashPrice - costData.inNetworkPrice,
    shopping: hospitals.length > 1 ? Math.round((hospitals[0].estimatedCost - hospitals[hospitals.length - 1].estimatedCost) * 0.8) : 0,
    withCoupons: plan ? Math.round(costData.inNetworkPrice * 0.15) : 0,
  }

  return {
    treatment,
    zipCode,
    plan,
    hospitals,
    insuranceAnalysis,
    estimatedSavings,
    summary: `Found ${hospitals.length} hospitals for "${treatment}" within ${maxDistance} miles of ${zipCode}. ${
      plan ? `Your ${plan.provider} plan could save you up to $${estimatedSavings.inNetwork.toLocaleString()} by staying in-network.` : "No insurance plan on file — cash prices shown."
    }`,
  }
}

function getDemoCostNavigation(plan: InsurancePlan | null, treatment: string, zipCode: string): CostNavigatorResult {
  const costData = Object.entries(AVG_COST_BY_TREATMENT).find(([key]) =>
    treatment.includes(key) || key.includes(treatment)
  )?.[1] || { cashPrice: 2000, inNetworkPrice: 500 }

  let specialtyKey = "general"
  if (treatment.includes("heart") || treatment.includes("cardiac") || treatment.includes("cardio")) specialtyKey = "cardiology"
  else if (treatment.includes("knee") || treatment.includes("hip") || treatment.includes("joint") || treatment.includes("ortho")) specialtyKey = "orthopedics"

  const candidateHospitals = DEMO_HOSPITALS[specialtyKey] || DEMO_HOSPITALS["general"]

  const hospitals: HospitalMatch[] = candidateHospitals
    .slice(0, 3)
    .map(h => ({
      ...h,
      estimatedCost: costData.inNetworkPrice,
      inNetwork: true,
      estimatedOOP: Math.round(costData.inNetworkPrice * 0.2),
      cashPrice: costData.cashPrice,
      matchedSpecialty: specialtyKey === "general" ? "General" : specialtyKey.charAt(0).toUpperCase() + specialtyKey.slice(1),
    }))

  const analysis = plan ? analyzeInsurancePlan(plan) : null

  return {
    treatment,
    zipCode,
    plan,
    hospitals,
    insuranceAnalysis: analysis,
    estimatedSavings: { inNetwork: costData.cashPrice - costData.inNetworkPrice, shopping: Math.round(costData.inNetworkPrice * 0.3), withCoupons: Math.round(costData.inNetworkPrice * 0.15) },
    summary: `Here are top hospitals for "${treatment}" near ${zipCode}. ${
      plan ? `Your ${plan.provider} plan could save $${(costData.cashPrice - costData.inNetworkPrice).toLocaleString()} vs cash price.` : "Add insurance info for cost estimates."
    }`,
  }
}
