"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/actions/auth"
import { toast } from "sonner"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/profile", label: "Health Profile", icon: "👤" },
  { href: "/dashboard/agents", label: "AI Agents", icon: "🤖" },
  { href: "/dashboard/visits", label: "Visit Prep", icon: "🏥" },
  { href: "/dashboard/insights", label: "Insights", icon: "📚" },
]

export function DashboardNav({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    await logout()
    toast.success("Logged out")
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-base">🫀</div>
          <span className="font-bold gradient-text">MediOrch</span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl p-1">
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="fixed left-0 top-14 bottom-0 w-64 glass border-r border-white/10 p-4 animate-in slide-in-from-left" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? "gradient-primary text-white font-medium shadow-lg shadow-cyan-500/20"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                🚪 Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 glass border-r border-white/10 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              🫀
            </div>
            <span className="font-bold text-lg gradient-text">MediOrch</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "gradient-primary text-white font-medium shadow-lg shadow-cyan-500/20"
                    : "hover:bg-muted/50 text-foreground hover:translate-x-1"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted/50 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white group-hover:scale-110 transition-transform">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </div>
              <div className="text-left truncate flex-1">
                <div className="font-medium truncate text-sm">{user.name || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <span className="text-muted-foreground text-xs">▾</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-white/10">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                🚪 Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
