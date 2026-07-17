"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface VoiceInputProps {
  onResult: (text: string) => void | Promise<void>
}

export function VoiceInput({ onResult }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const listeningRef = useRef(false)
  const onResultRef = useRef<VoiceInputProps["onResult"]>(onResult)
  onResultRef.current = onResult

  const SpeechRecognitionAPI = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    listeningRef.current = false
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = ""
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript
      }
      setText(full)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Allow microphone access and try again.")
      } else if (event.error === "no-speech") {
        toast.error("No speech detected. Try again.")
      } else if (event.error !== "aborted") {
        toast.error(`Voice input error: ${event.error}`)
      }
      stopListening()
    }

    recognition.onend = () => {
      listeningRef.current = false
      setListening(false)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      listeningRef.current = true
      setListening(true)
      setShowInput(true)
    } catch {
      toast.error("Failed to start voice input")
      setListening(false)
      listeningRef.current = false
    }
  }, [SpeechRecognitionAPI, stopListening])

  const toggleMic = useCallback(() => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }, [listening, startListening, stopListening])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    try {
      await onResultRef.current(trimmed)
      setText("")
      setShowInput(false)
    } finally {
      setSending(false)
    }
  }, [text])

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {showInput && (
        <div className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl max-w-sm w-80 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-2">
            {listening && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium">Recording... tap mic to stop</span>
              </>
            )}
            {!listening && (
              <span className="text-xs text-muted-foreground">Review and send, or tap mic to re-record</span>
            )}
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Speak or type what happened..."
            className="min-h-[80px] text-sm border-white/10 resize-none mb-2"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={listening ? "destructive" : "outline"}
              onClick={toggleMic}
              className={listening ? "animate-pulse" : "border-white/10"}
            >
              {listening ? "⏹ Stop" : "🎤 Record"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="gradient-button flex-1"
            >
              {sending ? "Sending..." : "Send →"}
            </Button>
            <button
              onClick={() => { stopListening(); setShowInput(false); setText("") }}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!showInput && (
        <Button
          onClick={() => setShowInput(true)}
          size="icon"
          className="w-14 h-14 rounded-full shadow-xl gradient-primary hover:scale-105 transition-all"
        >
          <span className="text-2xl">🎤</span>
        </Button>
      )}
    </div>
  )
}
