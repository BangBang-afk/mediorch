export type StoredUser = {
  id: string
  name: string | null
  email: string
  password: string
  image: string | null
  createdAt: Date
}

export type StoredCondition = { id: string; userId: string; name: string; diagnosedAt: string | null | undefined; notes: string | null; severity: string | null; createdAt: Date }
export type StoredMedication = { id: string; userId: string; name: string; dosage: string | null; frequency: string | null; prescribedBy: string | null; startedAt: string | null; endDate: string | null; isActive: boolean; notes: string | null; createdAt: Date }
export type StoredProvider = { id: string; userId: string; name: string; specialty: string | null; phone: string | null; address: string | null; notes: string | null; createdAt: Date }
export type StoredAppointment = { id: string; userId: string; providerId: string | null; providerName: string | null; title: string; date: string; reason: string | null; status: string; notes: string | null; prepNotes: string | null; followUp: string | null; createdAt: Date }

export type TimelineEventType = "symptom" | "medication_change" | "diagnosis" | "lab_result" | "doctor_visit" | "reaction" | "food_log" | "supplement" | "exercise" | "sleep" | "mood" | "procedure" | "vaccination" | "insurance_change" | "appeal"
export type TimelineSeverity = "mild" | "moderate" | "severe" | "informational"

export type TimelineEvent = {
  id: string
  userId: string
  type: TimelineEventType
  title: string
  description: string | null
  date: string
  severity: TimelineSeverity
  relatedTo: string[]  // ids of related conditions/medications/etc.
  metadata: Record<string, string>
  createdAt: Date
}

export type InsurancePlan = {
  id: string
  userId: string
  provider: string
  planName: string
  planType: "hmo" | "ppo" | "epo" | "pos" | "hdhp" | "other"
  deductible: number
  deductibleRemaining: number
  outOfPocketMax: number
  oopRemaining: number
  copayPrimary: number
  copaySpecialist: number
  copayUrgentCare: number
  copayER: number
  coinsurance: number
  prescriptionTiers: { tier: number; copay: number }[]
  inNetwork: boolean
  annualIncome: number
  notes: string | null
  createdAt: Date
}

export type SymptomLog = {
  id: string
  userId: string
  symptom: string
  severity: number // 0-10
  duration: string | null // e.g. "3 days", "2 hours"
  notes: string | null
  date: string
  relatedCondition: string | null
  createdAt: Date
}

export type AppealRequest = {
  id: string
  userId: string
  claimNumber: string
  insuranceProvider: string
  amount: number
  deniedReason: string
  status: "draft" | "submitted" | "approved" | "denied" | "appealing"
  letter: string | null
  clinicalEvidence: string[] | null
  outcome: string | null
  createdAt: Date
}

const users = new Map<string, StoredUser>()
const conditions = new Map<string, StoredCondition>()
const medications = new Map<string, StoredMedication>()
const providers = new Map<string, StoredProvider>()
const appointments = new Map<string, StoredAppointment>()
const timelineEvents = new Map<string, TimelineEvent>()
const insurancePlans = new Map<string, InsurancePlan>()
const symptomLogs = new Map<string, SymptomLog>()
const appealRequests = new Map<string, AppealRequest>()

function uid() {
  return crypto.randomUUID()
}

export const store = {
  user: {
    findUniqueByEmail(email: string): StoredUser | null {
      for (const u of users.values()) {
        if (u.email === email) return u
      }
      return null
    },
    findUnique(id: string): StoredUser | null {
      return users.get(id) ?? null
    },
    create(data: { email: string; password: string; name?: string | null }): StoredUser {
      const user: StoredUser = {
        id: uid(),
        name: data.name ?? null,
        email: data.email,
        password: data.password,
        image: null,
        createdAt: new Date(),
      }
      users.set(user.id, user)
      return user
    },
  },
  condition: {
    findByUser(userId: string): StoredCondition[] {
      return Array.from(conditions.values()).filter(c => c.userId === userId)
    },
    create(data: Partial<Omit<StoredCondition, "id" | "createdAt">> & Pick<StoredCondition, "userId" | "name">): StoredCondition {
      const item: StoredCondition = { diagnosedAt: null, notes: null, severity: null, ...data, id: uid(), createdAt: new Date() }
      conditions.set(item.id, item)
      return item
    },
    delete(id: string): void { conditions.delete(id) },
  },
  medication: {
    findByUser(userId: string): StoredMedication[] {
      return Array.from(medications.values()).filter(m => m.userId === userId)
    },
    create(data: Partial<Omit<StoredMedication, "id" | "createdAt">> & Pick<StoredMedication, "userId" | "name">): StoredMedication {
      const item: StoredMedication = { dosage: null, frequency: null, prescribedBy: null, startedAt: null, endDate: null, isActive: true, notes: null, ...data, id: uid(), createdAt: new Date() }
      medications.set(item.id, item)
      return item
    },
    delete(id: string): void { medications.delete(id) },
  },
  provider: {
    findByUser(userId: string): StoredProvider[] {
      return Array.from(providers.values()).filter(p => p.userId === userId)
    },
    create(data: Partial<Omit<StoredProvider, "id" | "createdAt">> & Pick<StoredProvider, "userId" | "name">): StoredProvider {
      const item: StoredProvider = { specialty: null, phone: null, address: null, notes: null, ...data, id: uid(), createdAt: new Date() }
      providers.set(item.id, item)
      return item
    },
    delete(id: string): void { providers.delete(id) },
  },
  appointment: {
    findByUser(userId: string): StoredAppointment[] {
      return Array.from(appointments.values()).filter(a => a.userId === userId)
    },
    create(data: Partial<Omit<StoredAppointment, "id" | "createdAt">> & Pick<StoredAppointment, "userId" | "title" | "date">): StoredAppointment {
      const item: StoredAppointment = { providerId: null, providerName: null, reason: null, status: "upcoming", notes: null, prepNotes: null, followUp: null, ...data, id: uid(), createdAt: new Date() }
      appointments.set(item.id, item)
      return item
    },
    delete(id: string): void { appointments.delete(id) },
  },
  timeline: {
    findByUser(userId: string): TimelineEvent[] {
      return Array.from(timelineEvents.values())
        .filter(e => e.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    findRecent(userId: string, days: number): TimelineEvent[] {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return Array.from(timelineEvents.values())
        .filter(e => e.userId === userId && new Date(e.date) >= cutoff)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    findByType(userId: string, type: TimelineEventType): TimelineEvent[] {
      return Array.from(timelineEvents.values())
        .filter(e => e.userId === userId && e.type === type)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    create(data: Partial<Omit<TimelineEvent, "id" | "createdAt">> & Pick<TimelineEvent, "userId" | "type" | "title" | "date">): TimelineEvent {
      const item: TimelineEvent = { description: null, severity: "informational", relatedTo: [], metadata: {}, ...data, id: uid(), createdAt: new Date() }
      timelineEvents.set(item.id, item)
      return item
    },
    delete(id: string): void { timelineEvents.delete(id) },
  },
  insurance: {
    findByUser(userId: string): InsurancePlan[] {
      return Array.from(insurancePlans.values()).filter(p => p.userId === userId)
    },
    findActive(userId: string): InsurancePlan | null {
      return Array.from(insurancePlans.values()).find(p => p.userId === userId && p.inNetwork) ?? null
    },
    create(data: Partial<Omit<InsurancePlan, "id" | "createdAt">> & Pick<InsurancePlan, "userId" | "provider" | "planName" | "planType">): InsurancePlan {
      const item: InsurancePlan = { deductible: 0, deductibleRemaining: 0, outOfPocketMax: 0, oopRemaining: 0, copayPrimary: 0, copaySpecialist: 0, copayUrgentCare: 0, copayER: 0, coinsurance: 0, prescriptionTiers: [], inNetwork: true, annualIncome: 0, notes: null, ...data, id: uid(), createdAt: new Date() }
      insurancePlans.set(item.id, item)
      return item
    },
    update(id: string, data: Partial<InsurancePlan>): InsurancePlan | null {
      const existing = insurancePlans.get(id)
      if (!existing) return null
      const updated = { ...existing, ...data, id: existing.id, createdAt: existing.createdAt }
      insurancePlans.set(id, updated)
      return updated
    },
    delete(id: string): void { insurancePlans.delete(id) },
  },
  symptom: {
    findByUser(userId: string): SymptomLog[] {
      return Array.from(symptomLogs.values())
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    findRecent(userId: string, days: number): SymptomLog[] {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return Array.from(symptomLogs.values())
        .filter(s => s.userId === userId && new Date(s.date) >= cutoff)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    create(data: Partial<Omit<SymptomLog, "id" | "createdAt">> & Pick<SymptomLog, "userId" | "symptom" | "severity" | "date">): SymptomLog {
      const item: SymptomLog = { duration: null, notes: null, relatedCondition: null, ...data, id: uid(), createdAt: new Date() }
      symptomLogs.set(item.id, item)
      return item
    },
    delete(id: string): void { symptomLogs.delete(id) },
  },
  appeal: {
    findByUser(userId: string): AppealRequest[] {
      return Array.from(appealRequests.values())
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    create(data: Partial<Omit<AppealRequest, "id" | "createdAt">> & Pick<AppealRequest, "userId" | "claimNumber" | "insuranceProvider" | "amount" | "deniedReason">): AppealRequest {
      const item: AppealRequest = { status: "draft", letter: null, clinicalEvidence: null, outcome: null, ...data, id: uid(), createdAt: new Date() }
      appealRequests.set(item.id, item)
      return item
    },
    update(id: string, data: Partial<AppealRequest>): AppealRequest | null {
      const existing = appealRequests.get(id)
      if (!existing) return null
      const updated = { ...existing, ...data, id: existing.id, createdAt: existing.createdAt }
      appealRequests.set(id, updated)
      return updated
    },
    delete(id: string): void { appealRequests.delete(id) },
  },
}
