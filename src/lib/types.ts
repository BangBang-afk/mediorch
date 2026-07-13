export interface HealthProfile {
  conditions: Condition[]
  medications: Medication[]
  providers: Provider[]
  appointments: Appointment[]
}

export interface Condition {
  id: string
  name: string
  diagnosedAt: string | null
  notes: string | null
  severity: string | null
}

export interface Medication {
  id: string
  name: string
  dosage: string | null
  frequency: string | null
  prescribedBy: string | null
  startedAt: string | null
  endDate: string | null
  isActive: boolean
  notes: string | null
}

export interface Provider {
  id: string
  name: string
  specialty: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

export interface Appointment {
  id: string
  providerId: string | null
  providerName: string | null
  title: string
  date: string
  reason: string | null
  status: string
  notes: string | null
  prepNotes: string | null
  followUp: string | null
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "agent"
  content: string
  agentType?: string
  createdAt: string
}

export interface AgentResult {
  agentType: string
  response: string
  data?: Record<string, unknown>
  suggestions?: string[]
  plainLanguage?: string
}
