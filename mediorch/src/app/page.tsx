"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

const words = ["medications", "appointments", "research", "insurance", "health"]

export default function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % words.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              🫀
            </div>
            <span className="font-bold text-xl">
              <span className="gradient-text">MediOrch</span>
            </span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="gradient-button">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-36 text-center px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-teal-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-float">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Health Assistant
            </div>

            <h1 className="text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-[1.1]">
              Orchestrate your{" "}
              <span className="relative">
                <span
                  className={`gradient-text transition-all duration-300 ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  {words[wordIdx]}
                </span>
              </span>
              <br />
              with AI agents
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
              MediOrch puts <strong className="text-foreground">you</strong> in control.
              Four specialist AI agents work together to coordinate your care —{" "}
              <span className="gradient-text font-medium">no hospital required.</span>
            </p>

            <div className="mt-10 flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button size="lg" className="gradient-button text-lg px-8 py-6 rounded-xl">
                  Start Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Meet your health team</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Four AI agents, one mission: make your healthcare simple
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { emoji: "💊", title: "MedAgent", desc: "Analyzes medications for interactions, side effects, and adherence", gradient: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
                { emoji: "🏥", title: "VisitAgent", desc: "Prepares you for appointments with personalized talking points", gradient: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20" },
                { emoji: "📚", title: "LiterAgent", desc: "Finds recent research relevant to your conditions", gradient: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20" },
                { emoji: "🧭", title: "NavAgent", desc: "Translates medical jargon and navigates insurance and referrals", gradient: "from-orange-500/10 to-amber-500/10", border: "border-orange-500/20" },
              ].map((agent, i) => (
                <Card key={agent.title} className={`glass-card group hover:-translate-y-2 ${agent.border}`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardContent className="pt-8 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      {agent.emoji}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{agent.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{agent.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">What makes MediOrch different</h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Built for patients, not hospitals
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "Patient-owned", icon: "👤", desc: "You control your data. Not a hospital. Not an insurance company. You.", gradient: "from-cyan-500 to-teal-500" },
                { title: "Multi-agent AI", icon: "🤖", desc: "Four specialist agents collaborate to give you comprehensive, coordinated care.", gradient: "from-violet-500 to-purple-500" },
                { title: "Health literacy first", icon: "📖", desc: "Every output has a plain language version. No jargon. No confusion.", gradient: "from-emerald-500 to-teal-500" },
                { title: "Proactive, not reactive", icon: "⚡", desc: "Agents suggest actions before problems arise — interactions, prep, research.", gradient: "from-amber-500 to-orange-500" },
              ].map((item) => (
                <div key={item.title} className="glass-card rounded-2xl p-6 flex gap-5 group hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 text-center px-4">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 rounded-3xl blur-3xl" />
            <div className="relative glass-card rounded-3xl p-10 md:p-14">
              <div className="text-5xl mb-6">🫀</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to take control?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Join MediOrch and let AI orchestrate your health journey.
              </p>
              <Link href="/register">
                <Button size="lg" className="gradient-button text-lg px-10 py-6 rounded-xl">
                  Get started free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-muted-foreground glass">
        <p>MediOrch — Making healthcare understandable and actionable for everyone.</p>
      </footer>
    </div>
  )
}
