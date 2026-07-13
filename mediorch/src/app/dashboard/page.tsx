import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [conditions, medications, providers, appointments] = await Promise.all([
    prisma.condition.count({ where: { userId: session.user.id } }),
    prisma.medication.count({ where: { userId: session.user.id, isActive: true } }),
    prisma.provider.count({ where: { userId: session.user.id } }),
    prisma.appointment.findMany({
      where: { userId: session.user.id, status: "upcoming" },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ])

  const stats = [
    { label: "Conditions", value: conditions, icon: "🩺", gradient: "from-blue-500 to-cyan-500" },
    { label: "Active Medications", value: medications, icon: "💊", gradient: "from-emerald-500 to-teal-500" },
    { label: "Providers", value: providers, icon: "👨‍⚕️", gradient: "from-violet-500 to-purple-500" },
    { label: "Upcoming Visits", value: appointments.length, icon: "🏥", gradient: "from-amber-500 to-orange-500" },
  ]

  return (
    <div className="space-y-8 pt-0 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back,{" "}
            <span className="gradient-text">{session.user.name || "let's check your health"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Your health overview at a glance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card border-white/10 group hover:-translate-y-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-base group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Link href="/dashboard/profile" className="text-sm text-primary hover:underline mt-1 inline-block">
                  Add one in Health Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 group hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center text-lg">
                        🏥
                      </div>
                      <div>
                        <p className="font-medium text-sm">{apt.title}</p>
                        <p className="text-xs text-muted-foreground">{apt.providerName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                      {new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/dashboard/profile", emoji: "📄", title: "Scan a prescription", desc: "Upload a photo or PDF to auto-fill your profile" },
              { href: "/dashboard/agents", emoji: "🤖", title: "Talk to your AI agents", desc: "Check medications, prep for visits, or research conditions" },
              { href: "/dashboard/visits", emoji: "🏥", title: "Prepare for a visit", desc: "Generate talking points and questions for your doctor" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 p-3 rounded-xl border border-white/10 hover:bg-muted/30 transition-all group hover:-translate-x-0.5"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  {action.emoji}
                </div>
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <span className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
