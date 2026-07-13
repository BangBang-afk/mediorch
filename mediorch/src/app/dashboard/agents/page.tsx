"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant" | "agent"
  content: string
  agentType?: string
}

const AGENT_INFO: Record<string, { name: string; emoji: string; gradient: string }> = {
  medication: { name: "MedAgent", emoji: "💊", gradient: "from-blue-500 to-cyan-500" },
  visit: { name: "VisitAgent", emoji: "🏥", gradient: "from-emerald-500 to-teal-500" },
  literature: { name: "LiterAgent", emoji: "📚", gradient: "from-violet-500 to-purple-500" },
  navigation: { name: "NavAgent", emoji: "🧭", gradient: "from-amber-500 to-orange-500" },
  orchestrator: { name: "Orchestrator", emoji: "🫀", gradient: "from-cyan-500 to-teal-500" },
}

const QUICK_ACTIONS = [
  { label: "💊 Check my medications", msg: "Can you check my medications for interactions?" },
  { label: "🏥 Prepare for next visit", msg: "Help me prepare for my next doctor visit" },
  { label: "📚 Find relevant research", msg: "Find recent research for my conditions" },
  { label: "🧭 Explain a medical term", msg: "What does this medical term mean?" },
]

export default function AgentsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your MediOrch AI assistant. I have four specialist agents ready to help:\n\n💊 **MedAgent** — Check your medications for interactions\n🏥 **VisitAgent** — Prepare for upcoming appointments\n📚 **LiterAgent** — Find research relevant to your conditions\n🧭 **NavAgent** — Explain medical terms and navigate healthcare\n\nWhat would you like help with?",
      agentType: "orchestrator",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPlain, setShowPlain] = useState(false)
  const [lastPlain, setLastPlain] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(msg?: string) {
    const text = msg || input
    if (!text.trim() || loading) return

    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setLastPlain(null)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })

      if (!res.ok) throw new Error("Failed")

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, agentType: data.agentType }])

      if (data.plainLanguage) setLastPlain(data.plainLanguage)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again.", agentType: "orchestrator" },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6 h-[calc(100vh-5rem)] flex flex-col pt-0 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">AI Agents</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Talk to your personal health AI team
          </p>
        </div>
        <div className="hidden md:flex gap-1">
          {Object.entries(AGENT_INFO).map(([key, agent]) => (
            key !== "orchestrator" && (
              <Badge key={key} variant="secondary" className={`bg-gradient-to-r ${agent.gradient} bg-clip-text text-transparent font-medium`}>
                {agent.emoji} {agent.name}
              </Badge>
            )
          ))}
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 glass-card border-white/10 overflow-hidden">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pb-4 justify-center">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.msg}
                    onClick={() => sendMessage(action.msg)}
                    className="px-4 py-2 rounded-xl text-sm border border-white/10 bg-muted/30 hover:bg-muted/50 transition-all hover:-translate-y-0.5"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => {
              const agent = msg.agentType ? AGENT_INFO[msg.agentType] : null
              return (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "gradient-primary text-white shadow-lg shadow-cyan-500/20"
                        : "bg-muted/50 border border-white/10"
                    }`}
                  >
                    {agent && msg.role !== "user" && (
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${agent.gradient} text-white text-xs font-medium mb-2`}>
                        <span>{agent.emoji}</span>
                        <span>{agent.name}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed [&_strong]:font-semibold">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}

            {lastPlain && showPlain && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium mb-2">
                    <span>🧾</span>
                    <span>Plain Language</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{lastPlain}</div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-white/10 rounded-2xl p-5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {lastPlain && (
          <div className="px-4 md:px-6 pb-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPlain(!showPlain)} className="text-xs text-muted-foreground">
              {showPlain ? "Hide" : "Show"} plain language version
            </Button>
          </div>
        )}

        <div className="p-4 md:p-6 border-t border-white/10 bg-gradient-to-t from-background/50 to-transparent">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage() }}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your medications, prep for a visit, research conditions..."
              disabled={loading}
              className="flex-1 glass border-white/10 rounded-xl h-12 text-sm"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="gradient-button rounded-xl h-12 px-6"
            >
              {loading ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
