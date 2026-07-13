export function getMedicationDemoResponse(
  medications: { name: string; dosage?: string | null; frequency?: string | null }[]
) {
  if (medications.length === 0) {
    return {
      response:
        "You haven't added any active medications yet. Add medications to your profile so I can help analyze them!",
      plainLanguage:
        "No medications to analyze. Please add your medications first.",
    }
  }

  const medNames = medications.map((m) => m.name).join(", ")

  return {
    response:
      "\uD83D\uDC8A **Medication Analysis Report**\n\n**Your Medications:** " +
      medNames +
      "\n\n---\n\n" +
      "### \u2705 Drug-Drug Interactions\n\nBased on common clinical knowledge of your medications, here's what I found:\n\n" +
      "**No major interactions detected** between your current medications. However, it's always good to monitor how you feel when starting any new medication.\n\n" +
      "### \uD83D\uDCCB Adherence Tips\n\n- Set a daily alarm or use a pill organizer to stay on track\n- If you miss a dose, check the medication instructions - don't double up\n- Keep a list of all medications (including OTC and supplements) to show your doctor\n\n" +
      "### \u2753 Questions to Ask Your Doctor\n\n1. Are there any foods or supplements I should avoid with these medications?\n2. Should I get any routine blood work to monitor these medications?\n3. Are these still the best options for my current health status?\n\n" +
      "### \uD83D\uDEE1\uFE0F Overall Safety Assessment\n\nYour current medication regimen appears safe based on what you've shared. Always consult your doctor or pharmacist before making changes.\n\n---\n\n" +
      "\uD83E\uDDEA **Plain Language Summary:** Your medications are safe to take together. Set a daily reminder to take them, and ask your doctor at your next visit if any adjustments are needed.",
    plainLanguage:
      "Your medications are safe to take together. Set a daily reminder, use a pill organizer, and ask your doctor at your next visit if anything needs to change.",
  }
}

export function getInteractionDemoResponse(currentMeds: string, newMed: string) {
  return {
    response:
      "\uD83D\uDD0D **Checking: " +
      newMed +
      "**\n\n**Current medications:** " +
      (currentMeds || "None") +
      "\n\n---\n\n### Known Interactions\n\nBased on common clinical guidelines:\n\n- **" +
      newMed +
      "** is generally safe with your current medications\n- No significant interactions reported in standard drug databases\n- Always monitor for any new or unusual symptoms when starting a new medication\n\n" +
      "### \u26A0\uFE0F Side Effects to Watch For\n\nCommon side effects may include:\n- Nausea or upset stomach (often improves after first few days)\n- Dizziness, especially when standing up quickly\n- Fatigue or drowsiness\n\n" +
      "### \uD83D\uDCCB Recommended Monitoring\n\n- Keep a symptom diary for the first 2 weeks\n- Note any changes in how you feel\n- Report anything unusual to your doctor\n\n" +
      "### \u2753 Questions for Your Doctor\n\n1. How long does it take for this medication to start working?\n2. Are there any activities I should avoid while taking this?\n3. What should I do if I miss a dose?\n\n---\n\n**Bottom line:** " +
      newMed +
      " appears safe with your current regimen, but always consult your doctor before starting.",
  }
}

export function getVisitPrepDemoResponse(
  aptTitle: string,
  providerName: string,
  date: string,
  conditions: { name: string; notes?: string | null }[],
  medNames: string[]
) {
  const conditionList = conditions.map((c) => c.name).join(", ") || "your health concerns"
  const medList = medNames.join(", ") || "none listed"

  return {
    response:
      "\uD83C\uDFE5 **Visit Prep Guide: " +
      aptTitle +
      "**\n\n**Provider:** " +
      (providerName || "Your doctor") +
      "\n**Date:** " +
      (date || "Upcoming") +
      "\n**Your Conditions:** " +
      conditionList +
      "\n**Your Medications:** " +
      medList +
      "\n\n---\n\n### \uD83C\uDFAF Key Concerns to Discuss\n\n1. **Current symptom status** - How have you been feeling since your last visit?\n2. **Medication effectiveness** - Are your current medications working well?\n3. **Any new symptoms** - Have you noticed anything different or concerning?\n\n" +
      "### \u2753 Questions to Ask\n\n1. Based on my current health, are there any changes I should make to my medications?\n2. What symptoms should I watch for that would warrant a call or sooner visit?\n3. Are there any lifestyle changes that could improve my health right now?\n\n" +
      "### \uD83D\uDCCB Information to Bring\n\n- List of all current medications with dosages\n- Any recent lab results or test reports\n- A notebook to write down answers\n- Your insurance card and ID\n\n" +
      "### \uD83D\uDCDD Pre-Visit Symptom Tracker\n\nOver the next few days before your appointment, note:\n- Any pain or discomfort (rate 1-10)\n- Energy levels throughout the day\n- Sleep quality\n- Any changes in appetite\n\n---\n\n" +
      "\uD83E\uDDEA **Simple Summary:** Write down your top 3 concerns before the visit. Bring your medication list and a notebook. Don't hesitate to ask questions - your visit is for you.",
    appointment: null,
  }
}

export function getPostVisitDemoResponse(notes: string) {
  return {
    response:
      "\uD83D\uDCDD **Post-Visit Summary**\n\n**Original Notes:** " +
      notes.substring(0, 200) +
      (notes.length > 200 ? "..." : "") +
      "\n\n---\n\n### Simple Summary\n\nHere's what happened during your visit, explained simply:\n\n" +
      "Your doctor listened to your concerns and reviewed your health information. They likely checked your vital signs and discussed your current treatment plan. Any changes or recommendations are outlined below.\n\n" +
      "### Key Takeaways\n\n- Follow the plan your doctor discussed with you\n- Take any new medications as prescribed\n- Complete any recommended tests or labs\n\n" +
      "### \u2705 Follow-up Steps\n\n1. Schedule any recommended follow-up appointments\n2. Pick up any new prescriptions from the pharmacy\n3. Start any recommended lifestyle changes gradually\n4. Mark your calendar for any future appointments\n\n" +
      "### \uD83D\uDEA9 When to Call the Doctor\n\nContact your doctor if you experience:\n- New or worsening symptoms\n- Side effects from any new medication\n- Fever or signs of infection\n- Any concerns that come up after reviewing this summary\n\n" +
      "### \uD83D\uDCC5 Next Steps\n\nKeep tracking your symptoms and bring this summary to your next visit. You're doing a great job staying on top of your health!",
  }
}

export function getLiteratureDemoResponse(conditionNames: string[]) {
  if (conditionNames.length === 0) {
    return {
      response:
        "You haven't added any medical conditions yet. Add conditions to your profile so I can find relevant research for you!",
      plainLanguage:
        "No conditions to search for. Please add your conditions first.",
    }
  }

  const conditions = conditionNames.join(", ")

  return {
    response:
      "\uD83D\uDCDA **Research Update for Your Conditions**\n\n**Conditions:** " +
      conditions +
      "\n\n---\n\n### \uD83D\uDD2C Recent Developments\n\n**1. New Insights in Treatment Approaches**\n\n" +
      "Recent studies have highlighted the importance of personalized treatment plans. Researchers are increasingly finding that tailoring medications and lifestyle recommendations to individual patient profiles leads to better outcomes.\n\n" +
      "**What this means for you:** Your doctor may consider your specific health profile when making treatment recommendations.\n\n" +
      "**2. Lifestyle and Management**\n\n" +
      "Multiple studies reinforce that small, consistent lifestyle changes - like a 15-minute daily walk, staying hydrated, and prioritizing sleep - can significantly impact overall health outcomes.\n\n" +
      "**What this means for you:** Even small changes add up. Pick one small health goal to focus on this week.\n\n" +
      "**3. Medication Updates**\n\n" +
      "Research continues to explore optimal dosing and combinations. Some studies suggest that regular medication reviews (every 6-12 months) can improve safety and effectiveness.\n\n" +
      "**What this means for you:** Ask your doctor if a medication review is appropriate at your next visit.\n\n---\n\n" +
      "### \u2753 Questions to Ask Your Doctor\n\n- Are there any new treatment options available for my condition?\n- Should I be aware of any recent research findings?\n- Is my current treatment plan still the best option?\n\n---\n\n" +
      "\uD83E\uDDEA **Plain Language Summary:** New research shows that personalized care works best. Small lifestyle changes help a lot. Ask your doctor about any new treatments at your next visit.",
    plainLanguage:
      "New research shows personalized treatment plans work best. Small daily habits like walking and good sleep make a real difference. Ask your doctor about any new options at your next visit.",
  }
}

export function getSearchDemoResponse(topic: string) {
  return {
    response:
      "\uD83D\uDD0D **Research Results: \"" +
      topic +
      "\"**\n\n---\n\n### Current Understanding\n\n**" +
      topic +
      "** is an active area of medical research. Here's what's currently understood:\n\n" +
      "**What We Know:**\n- Ongoing studies continue to explore optimal approaches\n- Treatment decisions should be personalized to each patient\n- Early detection and consistent management lead to better outcomes\n\n" +
      "**Recent Trends:**\n- There's growing emphasis on combining medication with lifestyle changes\n- Digital health tools are playing a bigger role in monitoring and management\n- Patient-reported outcomes are increasingly valued in research\n\n" +
      "### \uD83D\uDCA1 Practical Takeaways\n\n- Stay consistent with your current treatment plan\n- Discuss any new research findings with your doctor\n- Keep a log of your symptoms to share trends with your healthcare team\n\n" +
      "### \u2753 Questions for Your Doctor\n\n1. What's the latest thinking on treating " +
      topic +
      "?\n2. Are there any clinical trials I should consider?\n3. What should I be reading or researching to stay informed?\n\n---\n\n" +
      "**Remember:** Medical research evolves quickly. What you read online should always be discussed with your doctor before making any changes.",
  }
}

export function getNavTranslationDemoResponse(text: string) {
  return {
    response:
      "\uD83E\uDDED **Plain Language Translation**\n\n---\n\n**Here's what that text means in simple words:**\n\n> " +
      text.substring(0, 200) +
      (text.length > 200 ? "..." : "") +
      "\n\n---\n\n### Simple Explanation\n\nThis text contains medical or healthcare language. Here's what's important to understand:\n\n" +
      "- **Medical terms explained:** Any complex terms in the text generally refer to your health condition, treatment options, or administrative processes.\n" +
      "- **What to do next:** If this is from your doctor, follow their recommendations. If it's from insurance, keep it for your records and note any deadlines.\n" +
      "- **When in doubt:** Ask your doctor or the office that sent this to explain anything unclear. That's their job!\n\n" +
      "### \uD83D\uDCA1 Tips for Understanding Medical Information\n\n- Don't be afraid to ask for clarification\n- Bring a family member or friend to appointments if helpful\n- Take notes or ask for written summaries\n- Use the Translate feature on this page for any text you receive\n\n---\n\n" +
      "\uD83E\uDDEA **Bottom Line:** Medical language can be confusing. Always ask questions until you understand. Your health team is there to help.",
  }
}

export function getInsuranceExplanationDemoResponse(term: string) {
  return {
    response:
      "\uD83E\uDDED **Understanding: \"" +
      term +
      "\"**\n\n---\n\n### What It Means in Plain English\n\n**" +
      term +
      "** is a healthcare term that can be confusing. Here's a simple explanation:\n\n" +
      "In simple terms, this is a part of how healthcare billing and insurance works. Different plans handle it differently, and the specific details affect what you pay and what's covered.\n\n" +
      "### A Simple Analogy\n\nThink of it like a restaurant menu - some items are included in the meal deal (covered by insurance), and others cost extra (out-of-pocket). Knowing the terms helps you choose wisely.\n\n" +
      "### Why It Matters to You\n\nUnderstanding this term helps you:\n- Know what your insurance will and won't cover\n- Avoid surprise bills\n- Make informed decisions about your care\n- Ask the right questions when scheduling appointments\n\n" +
      "### \uD83D\uDCA1 Tip\n\nWhen you hear a term you don't understand, ask your doctor's office or insurance company: 'Can you explain this like I'm 5 years old?' Most will be happy to help.",
  }
}

export function getNavQuestionDemoResponse(query: string) {
  return {
    response:
      "\uD83E\uDDED **Healthcare Navigation**\n\n**Your Question:** " +
      query +
      "\n\n---\n\n### Here's What To Do\n\nGreat question! Here are some practical steps:\n\n" +
      "**Step 1:** Start by contacting your doctor's office directly. They can answer most questions about appointments, referrals, and what to expect.\n\n" +
      "**Step 2:** If it's about insurance, call the number on the back of your insurance card. Write down the date, time, and name of who you spoke with.\n\n" +
      "**Step 3:** Keep a folder (physical or digital) with:\n- Your insurance card (front and back)\n- Important medical records\n- Notes from doctor visits\n- A list of your medications\n\n" +
      "### \uD83D\uDCA1 Helpful Tips\n\n- Always ask for estimated costs before procedures\n- You can request a payment plan if needed\n- Many hospitals have patient advocates who can help navigate complex situations\n- Don't be afraid to get a second opinion\n\n" +
      "### \uD83D\uDCDE Who to Call\n\n| Question | Who to Contact |\n|---|---|\n| About a bill | Billing department at your doctor/hospital |\n| About coverage | Your insurance company |\n| About treatment | Your doctor's office |\n| About referrals | Your primary care doctor |\n\n---\n\n" +
      "\uD83E\uDDEA **Bottom Line:** Healthcare navigation takes patience. Start with one phone call, keep good records, and don't give up. You've got this.",
  }
}

export function getOrchestratorDemoResponse(
  message: string,
  conditionSummary: string,
  medSummary: string,
  apptSummary: string
) {
  if (
    message.toLowerCase().includes("medication") ||
    message.toLowerCase().includes("drug") ||
    message.toLowerCase().includes("pill") ||
    message.toLowerCase().includes("prescription") ||
    message.toLowerCase().includes("side effect") ||
    message.toLowerCase().includes("interaction")
  ) {
    return {
      response:
        "I understand you're asking about medications. Let me connect you with **MedAgent \uD83D\uDC8A** - my medication specialist.\n\n" +
        "MedAgent can:\n- Check your medications for potential interactions\n- Provide adherence tips and reminders\n- Suggest questions to ask your doctor about your prescriptions\n\n" +
        "Would you like me to run a full medication analysis now? Or do you have a specific medication question?",
    }
  }

  if (
    message.toLowerCase().includes("appointment") ||
    message.toLowerCase().includes("visit") ||
    message.toLowerCase().includes("doctor") ||
    message.toLowerCase().includes("prepare") ||
    message.toLowerCase().includes("prep")
  ) {
    return {
      response:
        "Sounds like you need **VisitAgent \uD83C\uDFE5**! I'll help you prepare for your upcoming appointment.\n\n" +
        "**Your upcoming visits:** " +
        (apptSummary || "None scheduled") +
        "\n\nVisitAgent can generate:\n- Personalized talking points based on your conditions\n- Questions to ask your doctor\n- A symptom tracker to fill out beforehand\n- A simple post-visit summary\n\n" +
        "Would you like me to prepare a full guide for your next visit?",
    }
  }

  if (
    message.toLowerCase().includes("research") ||
    message.toLowerCase().includes("study") ||
    message.toLowerCase().includes("new treatment") ||
    message.toLowerCase().includes("recent") ||
    message.toLowerCase().includes("literature") ||
    message.toLowerCase().includes("cure")
  ) {
    return {
      response:
        "Great question! Let me bring in **LiterAgent \uD83D\uDCDA** - my research specialist.\n\n**Your conditions:** " +
        (conditionSummary || "None yet - add conditions to your profile for personalized research") +
        "\n\nLiterAgent can:\n- Find recent research relevant to your conditions\n- Explain new studies in plain language\n- Suggest questions to ask your doctor based on new findings\n\n" +
        "Want me to search for the latest research now?",
    }
  }

  if (
    message.toLowerCase().includes("insurance") ||
    message.toLowerCase().includes("bill") ||
    message.toLowerCase().includes("term") ||
    message.toLowerCase().includes("meaning") ||
    message.toLowerCase().includes("explain") ||
    message.toLowerCase().includes("what is") ||
    message.toLowerCase().includes("what does") ||
    message.toLowerCase().includes("jargon") ||
    message.toLowerCase().includes("translate")
  ) {
    return {
      response:
        "I'll get **NavAgent \uD83E\uDDED** to help with that! NavAgent specializes in making healthcare easy to understand.\n\n" +
        "NavAgent can:\n- Translate medical jargon into plain English\n- Explain insurance terms and billing\n- Help you navigate referrals and finding the right specialist\n- Give step-by-step advice for healthcare situations\n\n" +
        "What specifically would you like explained?",
    }
  }

  return {
    response:
      "Hi! I'm your MediOrch health assistant. Here's how I can help:\n\n" +
      "\uD83D\uDC8A **MedAgent** - Analyzes your medications for interactions and side effects\n" +
      "\uD83C\uDFE5 **VisitAgent** - Prepares you for doctor appointments with personalized questions\n" +
      "\uD83D\uDCDA **LiterAgent** - Finds recent medical research relevant to your conditions\n" +
      "\uD83E\uDDED **NavAgent** - Translates medical jargon and helps navigate healthcare\n\n" +
      "**Your Health Summary:**\n- **Conditions:** " +
      (conditionSummary || "None added yet") +
      "\n- **Active Medications:** " +
      (medSummary || "None added yet") +
      "\n- **Upcoming Appointments:** " +
      (apptSummary || "None scheduled") +
      "\n\nTo get started, just tell me what you need help with - or try one of the specialists above!",
  }
}
