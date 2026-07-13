type StoredUser = {
  id: string
  name: string | null
  email: string
  password: string
  image: string | null
  createdAt: Date
}

type StoredCondition = { id: string; userId: string; name: string; diagnosedAt: string | null | undefined; notes: string | null; severity: string | null; createdAt: Date }
type StoredMedication = { id: string; userId: string; name: string; dosage: string | null; frequency: string | null; prescribedBy: string | null; startedAt: string | null; endDate: string | null; isActive: boolean; notes: string | null; createdAt: Date }
type StoredProvider = { id: string; userId: string; name: string; specialty: string | null; phone: string | null; address: string | null; notes: string | null; createdAt: Date }
type StoredAppointment = { id: string; userId: string; providerId: string | null; providerName: string | null; title: string; date: string; reason: string | null; status: string; notes: string | null; prepNotes: string | null; followUp: string | null; createdAt: Date }

const users = new Map<string, StoredUser>()
const conditions = new Map<string, StoredCondition>()
const medications = new Map<string, StoredMedication>()
const providers = new Map<string, StoredProvider>()
const appointments = new Map<string, StoredAppointment>()

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
}
