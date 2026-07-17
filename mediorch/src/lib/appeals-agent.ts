"use server"

import { store, type AppealRequest, type InsurancePlan } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

type AppealLetter = {
  patientName: string
  patientAddress: string
  insuranceProvider: string
  claimNumber: string
  dateOfService: string
  amountDenied: number
  reasonGiven: string
  letterBody: string
  supportingCitations: string[]
  submissionInstructions: string
}

const APPEAL_REASONS: Record<string, { counterArgument: string; citations: string[] }> = {
  "not medically necessary": {
    counterArgument: "The requested service meets standard medical criteria as supported by CMS National Coverage Determinations and specialty society guidelines. Denial based on medical necessity should include a specific rationale and alternative treatment pathway.",
    citations: [
      "CMS Medicare Benefit Policy Manual Chapter 15 - Covered Medical and Other Health Services",
      "Patient Protection and Affordable Care Act: Internal claims and appeals regulations (45 CFR §147.136)",
    ],
  },
  "experimental": {
    counterArgument: "The treatment in question is supported by peer-reviewed literature and is listed in established medical compendia. Under ERISA Section 502(a)(1)(B), experimental treatment denials must be based on specific evidence standards.",
    citations: [
      "ERISA Section 502(a)(1)(B) - Enforcement of plan benefits",
      "FDA clearance/approval documentation for the specified treatment",
    ],
  },
  "out of network": {
    counterArgument: "When no in-network provider with appropriate expertise is available within a reasonable distance, or when emergency services are required, out-of-network coverage must be provided at in-network cost-sharing levels.",
    citations: [
      "ACA Section 2719 - Internal claims and appeals",
      "No Surprises Act (HHS Final Rule 45 CFR Part 149)",
    ],
  },
  "pre-existing condition": {
    counterArgument: "Under the Affordable Care Act, group health plans and insurers cannot deny coverage or impose waiting periods for pre-existing conditions for any plan year beginning on or after January 1, 2014.",
    citations: [
      "ACA Section 2704 - Prohibition of pre-existing condition exclusions",
      "45 CFR §147.108 - Prohibition of pre-existing condition exclusions",
    ],
  },
  "prior authorization": {
    counterArgument: "While prior authorization is a standard utilization management tool, retrospective denial of a service that was not pre-authorized must consider whether a reasonable patient would have known authorization was required, and whether delay would have caused harm.",
    citations: [
      "ERISA Section 503 - Claims procedure",
      "29 CFR §2560.503-1 - Claims procedure standards",
    ],
  },
  "frequency": {
    counterArgument: "The frequency of service is within accepted medical standards for the patient's specific diagnosis and clinical presentation. Denials based on frequency limits should consider individual patient variation and medical necessity.",
    citations: [
      "CMS Medicare National Coverage Determinations Manual",
      "21st Century Cures Act - Patient-focused drug development guidance",
    ],
  },
}

function matchDenialReason(reason: string): string {
  const lower = reason.toLowerCase()
  if (lower.includes("not medically necessary") || lower.includes("medical necessity")) return "not medically necessary"
  if (lower.includes("experimental") || lower.includes("investigational")) return "experimental"
  if (lower.includes("out of network") || lower.includes("out-of-network") || lower.includes("non-network")) return "out of network"
  if (lower.includes("pre-existing") || lower.includes("preexisting")) return "pre-existing condition"
  if (lower.includes("prior authorization") || lower.includes("pre-authorization") || lower.includes("preauthorization")) return "prior authorization"
  if (lower.includes("frequency") || lower.includes("too soon") || lower.includes("too many")) return "frequency"
  return "not medically necessary"
}

function generateAppealLetter(
  appeal: AppealRequest,
  plan: InsurancePlan | null,
  conditions: { name: string }[],
  medications: { name: string }[],
): AppealLetter {
  const matchKey = matchDenialReason(appeal.deniedReason)
  const template = APPEAL_REASONS[matchKey]

  const conditionList = conditions.map(c => c.name).join(", ") || "the specified condition"
  const medList = medications.map(m => m.name).join(", ") || "as recommended"

  const letterBody = `To the Appeals Department at ${appeal.insuranceProvider},

RE: Claim #${appeal.claimNumber} — Appeal of Denial for $${appeal.amount.toLocaleString()}

I am writing to formally appeal the denial of the above-referenced claim. The reason provided for denial was: "${appeal.deniedReason}."

My treating provider(s) have recommended this care based on my diagnosis of ${conditionList} and current treatment plan including ${medList}. The requested service is consistent with standard medical practice for my condition.

${template.counterArgument}

I respectfully request a full and fair review of this decision under your internal appeals process. I am prepared to provide any additional documentation, including my medical records and a letter of support from my treating physician.

Please respond in writing within the timeframe required by law (30 days for prospective services, 15 days for urgent/critical care). You may contact me directly with any questions.

Sincerely,
[Patient Name]
[Patient Signature]

Enclosures: Supporting medical records, physician letter (attached separately)`

  return {
    patientName: "[Patient Name — Update before submitting]",
    patientAddress: "[Your Address]",
    insuranceProvider: appeal.insuranceProvider,
    claimNumber: appeal.claimNumber,
    dateOfService: appeal.createdAt.toISOString().split("T")[0],
    amountDenied: appeal.amount,
    reasonGiven: appeal.deniedReason,
    letterBody,
    supportingCitations: template.citations,
    submissionInstructions: `
HOW TO SUBMIT: Mail to the appeals address on your insurance card (NOT the claims address). Keep a copy for your records.

TIMELINE: Insurers have 30 days to respond to non-urgent appeals. You have 180 days from denial date to file.

ESCALATION: If internal appeal is denied, you have the right to an external review by an independent third party. This is binding on the insurer.`,
  }
}

export async function generateAppeal(userId: string, appealId: string): Promise<AppealLetter | null> {
  const plans = store.insurance.findByUser(userId)
  const plan = plans.length > 0 ? plans[0] : null
  const conditions = store.condition.findByUser(userId)
  const medications = store.medication.findByUser(userId).filter(m => m.isActive)

  if (isDemoMode()) {
    return getDemoAppealLetter(userId, appealId, plan, conditions, medications)
  }

  const appeal = store.appeal.findByUser(userId).find(a => a.id === appealId)
  if (!appeal) return null

  const letter = generateAppealLetter(appeal, plan, conditions, medications)
  store.appeal.update(appealId, { letter: letter.letterBody, clinicalEvidence: letter.supportingCitations })
  return letter
}

export async function createAppealRequest(
  userId: string,
  data: { claimNumber: string; insuranceProvider: string; amount: number; deniedReason: string }
) {
  const appeal = store.appeal.create({ ...data, userId })
  return appeal
}

function getDemoAppealLetter(
  _userId: string,
  _appealId: string,
  plan: InsurancePlan | null,
  conditions: { name: string }[],
  medications: { name: string }[]
): AppealLetter {
  const conditionList = conditions.map(c => c.name).join(", ") || "the specified medical condition"
  const insurerName = plan?.provider || "your insurance company"

  return {
    patientName: "[Patient Name]",
    patientAddress: "[Your Address]",
    insuranceProvider: insurerName,
    claimNumber: "CLAIM-12345",
    dateOfService: new Date().toISOString().split("T")[0],
    amountDenied: 2500,
    reasonGiven: "not medically necessary",
    letterBody: `To the Appeals Department at ${insurerName},

RE: Claim #CLAIM-12345 — Appeal of Denial for $2,500.00

I am writing to formally appeal the denial of the above-referenced claim. The reason provided was: "not medically necessary."

My treating provider recommended this care based on my diagnosis of ${conditionList} and current treatment plan including ${(medications.map(m => m.name).join(", ") || "as recommended")}. This service is consistent with standard medical practice.

The denial does not specify which alternative treatment was considered appropriate, nor does it provide clinical evidence supporting the conclusion that this care is not necessary. Under federal claims processing regulations, denials must include: (1) the specific reason, (2) reference to the plan provision, and (3) a description of additional information needed.

The requested service meets established medical criteria. I respectfully request a full review.

Sincerely,
[Patient Name]`,
    supportingCitations: [
      "CMS Medicare Benefit Policy Manual Chapter 15 - Covered Medical and Other Health Services",
      "ACA Section 2719 - Internal claims and appeals regulations (45 CFR §147.136)",
      "ERISA Section 503 - Claims procedure requirements",
    ],
    submissionInstructions: `
HOW TO SUBMIT: Mail to the appeals address on your insurance card (NOT the claims address). Keep a copy.

TIMELINE: Insurers have 30 days to respond to non-urgent appeals. You have 180 days from denial to file.

ESCALATION: If internal appeal is denied, you have the right to an external review by an independent third party. This is binding on the insurer.`,
  }
}
