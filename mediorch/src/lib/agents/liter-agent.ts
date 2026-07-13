"use server"

import { ChatOpenAI } from "@langchain/openai"
import { prisma } from "@/lib/db"
import { isDemoMode } from "@/lib/ai-config"
import { getLiteratureDemoResponse, getSearchDemoResponse } from "@/lib/demo-responses"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.4,
})

export async function findRelevantResearch(userId: string) {
  const conditions = await prisma.condition.findMany({
    where: { userId },
  })

  if (isDemoMode()) {
    return getLiteratureDemoResponse(conditions.map((c) => c.name))
  }

  if (conditions.length === 0) {
    return {
      response: "You haven't added any medical conditions yet. Add conditions to your profile so I can find relevant research for you!",
      plainLanguage: "No conditions to search for. Please add your conditions first.",
    }
  }

  const conditionNames = conditions.map((c) => c.name).join(", ")

  const prompt = `You are LiterAgent, an AI medical literature specialist. Based on the patient's conditions, find and summarize RECENT medical research that could be relevant.

PATIENT'S CONDITIONS: ${conditionNames}

For each condition, provide:
1. 🔬 **Recent Research** - Describe a real or highly plausible recent study (2024-2026)
2. 💡 **What This Means** - How this research could affect the patient's care
3. ❓ **Questions to Ask Doctor** - Specific questions based on this research

IMPORTANT: Clearly label speculative research. Focus on practical, actionable information.
Format with emoji headers for each condition. End with a Plain Language Summary.`

  const result = await model.invoke(prompt)
  const content = result.content.toString()

  const plainPrompt = `Simplify this medical research summary into extremely basic language:\n\n${content}`

  const plainResult = await model.invoke(plainPrompt)
  const plainLanguage = plainResult.content.toString()

  return { response: content, plainLanguage }
}

export async function searchTopic(topic: string) {
  if (isDemoMode()) {
    return getSearchDemoResponse(topic)
  }

  const prompt = `You are LiterAgent. Provide a brief, clear summary of recent developments in "${topic}" that would be useful for a patient.

Cover:
1. What's new in research
2. How this might affect treatment options
3. Questions to ask a doctor about this
4. Plain language summary

Keep it practical and patient-focused.`

  const result = await model.invoke(prompt)
  return { response: result.content.toString() }
}
