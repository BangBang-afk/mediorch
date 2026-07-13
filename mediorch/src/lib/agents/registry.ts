export interface AgentConfig {
  type: string
  name: string
  description: string
  icon: string
}

export const AGENT_REGISTRY: AgentConfig[] = [
  {
    type: "medication",
    name: "MedAgent",
    description: "Analyzes your medications for interactions, side effects, and adherence",
    icon: "💊",
  },
  {
    type: "visit",
    name: "VisitAgent",
    description: "Prepares you for doctor appointments with personalized questions and summaries",
    icon: "🏥",
  },
  {
    type: "literature",
    name: "LiterAgent",
    description: "Finds and explains recent medical research relevant to your conditions",
    icon: "📚",
  },
  {
    type: "navigation",
    name: "NavAgent",
    description: "Translates medical jargon and helps navigate insurance, referrals, and costs",
    icon: "🧭",
  },
]
