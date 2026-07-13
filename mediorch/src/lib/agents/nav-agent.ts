"use server"

import { ChatOpenAI } from "@langchain/openai"
import { isDemoMode } from "@/lib/ai-config"
import { getNavTranslationDemoResponse, getInsuranceExplanationDemoResponse, getNavQuestionDemoResponse } from "@/lib/demo-responses"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
})

export async function translateToPlainLanguage(medicalText: string) {
  if (isDemoMode()) {
    return getNavTranslationDemoResponse(medicalText)
  }

  const prompt = `You are NavAgent, a health literacy specialist. Translate the following medical text into extremely simple language that someone without any medical training can understand.

MEDICAL TEXT:
${medicalText}

Requirements:
- Use short sentences (under 15 words where possible)
- Explain every medical term in parentheses or simpler words
- Use analogies from everyday life
- Break into small sections with plain English headers
- End with a "Bottom Line" of 1-2 sentences

TRANSLATION:`

  const result = await model.invoke(prompt)
  return { response: result.content.toString() }
}

export async function explainInsuranceTerm(term: string) {
  if (isDemoMode()) {
    return getInsuranceExplanationDemoResponse(term)
  }

  const prompt = `You are NavAgent. Explain the following health insurance or medical billing term in extremely simple language.

TERM: "${term}"

Provide:
1. What it means in plain English (1-2 sentences)
2. A simple analogy
3. Why it matters to the patient
4. A tip for dealing with it

Keep it very simple. No jargon.`

  const result = await model.invoke(prompt)
  return { response: result.content.toString() }
}

export async function navigateQuestion(query: string) {
  if (isDemoMode()) {
    return getNavQuestionDemoResponse(query)
  }

  const prompt = `You are NavAgent, a healthcare navigation assistant. Answer the following question about healthcare navigation in simple, actionable terms.

QUESTION: "${query}"

Provide practical, step-by-step advice. Include:
- What the patient needs to do first
- Who to contact
- What to say
- What documents they might need
- Estimated timeframes if applicable

Assume the patient has no medical background. Be warm and encouraging.`

  const result = await model.invoke(prompt)
  return { response: result.content.toString() }
}
