"use server"

import { ChatOpenAI } from "@langchain/openai"
import { prisma } from "@/lib/db"
import { isDemoMode } from "@/lib/ai-config"
import { getVisitPrepDemoResponse, getPostVisitDemoResponse } from "@/lib/demo-responses"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.4,
})

export async function prepareForVisit(
  userId: string,
  appointmentId?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      conditions: true,
      medications: { where: { isActive: true } },
      providers: true,
    },
  })

  if (!user) throw new Error("User not found")

  if (isDemoMode()) {
    const appointment = appointmentId
      ? await prisma.appointment.findUnique({ where: { id: appointmentId } })
      : null

    const condNames = user.conditions.map((c) => ({ name: c.name, notes: c.notes }))
    const medNames = user.medications.map((m) => m.name)

    return getVisitPrepDemoResponse(
      appointment?.title || "General checkup",
      appointment?.providerName || "Your doctor",
      appointment?.date ? new Date(appointment.date).toLocaleDateString() : "Upcoming",
      condNames,
      medNames
    )
  }

  const appointment = appointmentId
    ? await prisma.appointment.findUnique({ where: { id: appointmentId } })
    : null

  const conditionList = user.conditions
    .map((c) => `- ${c.name}${c.severity ? ` (${c.severity})` : ""}${c.notes ? `: ${c.notes}` : ""}`)
    .join("\n")

  const medList = user.medications
    .map((m) => `- ${m.name} ${m.dosage || ""} ${m.frequency || ""}`)
    .join("\n")

  const provider = appointment?.providerId
    ? user.providers.find((p) => p.id === appointment.providerId)
    : null

  const prompt = `You are VisitAgent, an AI assistant that helps patients prepare for medical appointments.

APPOINTMENT DETAILS:
- Title: ${appointment?.title || "General checkup"}
- Provider: ${provider?.name || appointment?.providerName || "Your doctor"}
- Reason: ${appointment?.reason || "Regular visit"}
- Date: ${appointment?.date?.toISOString() || "Upcoming"}

PATIENT PROFILE:
Conditions:
${conditionList || "None listed"}

Active Medications:
${medList || "None listed"}

Generate a personalized visit preparation guide including:
1. 🎯 **Key Concerns to Discuss** - Top 3 things to bring up
2. ❓ **Questions to Ask** - Specific questions for this provider about conditions and medications
3. 📋 **Information to Bring** - What the patient should have ready
4. 📝 **Symptom Tracker** - What symptoms to note beforehand
5. 🔍 **Things to Watch For** - Post-visit monitoring

Format clearly with emoji headers. End with a simple summary.`

  const result = await model.invoke(prompt)
  const content = result.content.toString()

  if (appointmentId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { prepNotes: content },
    })
  }

  return { response: content, appointment }
}

export async function summarizeAfterVisit(
  userId: string,
  appointmentId: string,
  doctorNotes: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) throw new Error("Appointment not found")

  if (isDemoMode()) {
    return getPostVisitDemoResponse(doctorNotes)
  }

  const prompt = `You are VisitAgent. Translate these doctor's visit notes into plain language the patient can understand and act on.

DOCTOR'S NOTES:
${doctorNotes}

APPOINTMENT: ${appointment.title}
PROVIDER: ${appointment.providerName}

Generate:
1. 📝 **Simple Summary** - What happened in plain language
2. 💊 **Medication Changes** - Any changes explained simply
3. ✅ **Follow-up Steps** - Action items with clear instructions
4. 🚩 **When to Call the Doctor** - Warning signs
5. 📅 **Next Steps** - Follow-up appointments or tests

Use extremely simple language. Avoid all medical jargon without explanation.`

  const result = await model.invoke(prompt)
  const content = result.content.toString()

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { followUp: content, status: "completed" },
  })

  return { response: content }
}
