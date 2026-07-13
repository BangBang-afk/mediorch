"use server"

import { ChatOpenAI } from "@langchain/openai"
import { analyzeMedications, checkMedicationInteraction } from "./med-agent"
import { prepareForVisit, summarizeAfterVisit } from "./visit-agent"
import { translateToPlainLanguage, explainInsuranceTerm, navigateQuestion } from "./nav-agent"
import { findRelevantResearch, searchTopic } from "./liter-agent"
import { store } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"
import { getOrchestratorDemoResponse } from "@/lib/demo-responses"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
})

type AgentType = "medication" | "visit" | "literature" | "navigation" | "orchestrator"

export async function orchestrate(
  userId: string,
  message: string,
  history: { role: string; content: string }[]
) {
  if (isDemoMode()) {
    if (message.startsWith("SUMMARIZE_AFTER_VISIT:")) {
      const parts = message.split(":")
      const notes = parts.slice(2).join(":")
      const { getPostVisitDemoResponse } = await import("@/lib/demo-responses")
      const demoRes = getPostVisitDemoResponse(notes)
      return { response: demoRes.response, agentType: "visit" }
    }

    if (message.startsWith("TRANSLATE_MEDICAL_TEXT:")) {
      const text = message.replace("TRANSLATE_MEDICAL_TEXT:", "").trim()
      const { getNavTranslationDemoResponse } = await import("@/lib/demo-responses")
      const demoRes = getNavTranslationDemoResponse(text)
      return { response: demoRes.response, agentType: "navigation" }
    }

    if (message.toLowerCase().includes("prepare me for my upcoming appointment")) {
      const { getVisitPrepDemoResponse } = await import("@/lib/demo-responses")
      const demoRes = getVisitPrepDemoResponse("Your upcoming appointment", "Your doctor", "Upcoming", [], [])
      return { response: demoRes.response, agentType: "visit" }
    }

    if (message.toLowerCase().includes("find recent research relevant to my conditions")) {
      const userConditions = store.condition.findByUser(userId)
      const condNames = userConditions.map((c) => c.name)
      const { getLiteratureDemoResponse } = await import("@/lib/demo-responses")
      const demoRes = getLiteratureDemoResponse(condNames)
      return { response: demoRes.response, plainLanguage: demoRes.plainLanguage, agentType: "literature" }
    }

    if (message.toLowerCase().includes("search for recent research about:")) {
      const topic = message.replace(/search for recent research about:/i, "").trim()
      const { getSearchDemoResponse } = await import("@/lib/demo-responses")
      const demoRes = getSearchDemoResponse(topic)
      return { response: demoRes.response, agentType: "literature" }
    }

    const userConditions = store.condition.findByUser(userId)
    const userMedications = store.medication.findByUser(userId).filter(m => m.isActive)
    const userAppointments = store.appointment.findByUser(userId)
      .filter(a => a.status === "upcoming")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)

    const conditionSummary = userConditions.map((c) => c.name).join(", ") || "none listed"
    const medSummary = userMedications.map((m) => m.name).join(", ") || "none"
    const apptSummary = userAppointments.map((a) => `${a.title} on ${new Date(a.date).toLocaleDateString()}`).join(", ") || "none"

    const demoResult = getOrchestratorDemoResponse(message, conditionSummary, medSummary, apptSummary)
    return {
      response: demoResult.response,
      agentType: "orchestrator",
    }
  }

  const classificationPrompt = `Classify this patient message into the most relevant agent type. Reply with ONLY one word.

Patient message: "${message}"

Options:
- medication: Questions about drugs, interactions, side effects, prescriptions
- visit: Questions about doctor appointments, visit prep, what to ask doctor
- literature: Questions about medical research, new treatments, studies
- navigation: Questions about insurance, billing, medical terms, finding doctors
- orchestrator: Anything else, general questions, or when multiple agents are needed`

  const classification = await model.invoke(classificationPrompt)
  const agentType = classification.content.toString().trim().toLowerCase() as AgentType

  let result: { response: string; plainLanguage?: string; data?: Record<string, unknown> }

  switch (agentType) {
    case "medication": {
      const medResult = await analyzeMedications(userId)
      result = {
        response: medResult.response,
        plainLanguage: medResult.plainLanguage,
        data: { agentType: "medication" },
      }
      break
    }
    case "visit": {
      const upcoming = store.appointment.findByUser(userId)
        .filter(a => a.status === "upcoming")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
      const visitResult = await prepareForVisit(userId, upcoming?.id)
      result = {
        response: visitResult.response,
        data: { agentType: "visit", appointment: upcoming },
      }
      break
    }
    case "literature": {
      const litResult = await findRelevantResearch(userId)
      result = {
        response: litResult.response,
        plainLanguage: litResult.plainLanguage,
        data: { agentType: "literature" },
      }
      break
    }
    case "navigation": {
      const navResult = await navigateQuestion(message)
      result = {
        response: navResult.response,
        data: { agentType: "navigation" },
      }
      break
    }
    default: {
      const userConditions = store.condition.findByUser(userId)
      const userMedications = store.medication.findByUser(userId).filter(m => m.isActive)
      const userAppointments = store.appointment.findByUser(userId)
        .filter(a => a.status === "upcoming")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)

      const conditionSummary = userConditions.map((c) => c.name).join(", ") || "none listed"
      const medSummary = userMedications.map((m) => m.name).join(", ") || "none"
      const apptSummary = userAppointments.map((a) => `${a.title} on ${new Date(a.date).toLocaleDateString()}`).join(", ") || "none"

      const contextPrompt = `You are MediOrch, the main orchestrator AI for a patient-controlled health management system. You coordinate multiple specialist AI agents to help patients manage their health.

PATIENT'S HEALTH SUMMARY:
- Conditions: ${conditionSummary}
- Active Medications: ${medSummary}
- Upcoming Appointments: ${apptSummary}

PATIENT'S QUESTION: "${message}"

CONVERSATION HISTORY:
${history.slice(-4).map((h) => `${h.role}: ${h.content}`).join("\n")}

Respond helpfully. If the patient needs medication analysis, suggest activating MedAgent. If they need visit prep, suggest VisitAgent. If they want research, suggest LiterAgent. If they need terms explained, suggest NavAgent.

Keep your response warm, clear, and actionable.`

      const response = await model.invoke(contextPrompt)
      result = {
        response: response.content.toString(),
        data: { agentType: "orchestrator" },
      }
    }
  }

  // Chat history is not persisted in demo mode (in-memory only)

  return {
    response: result.response,
    plainLanguage: result.plainLanguage,
    agentType,
  }
}
