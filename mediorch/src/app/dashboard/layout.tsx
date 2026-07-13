import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/30">
      <DashboardNav user={session.user} />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
