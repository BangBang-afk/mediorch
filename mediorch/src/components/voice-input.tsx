"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface VoiceInputProps {
  onResult: (text: string) => void
  label?: string
  variant?: "default" | "fab"
}

export function VoiceInput({ onResult, label = "🎤 Voice Log", variant = "default" }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listeningRef = useRef(false)
  const transcriptRef = useRef("")
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const SpeechRecognitionAPI = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
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
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1]
      const text = current[0].transcript
      transcriptRef.current = text
      setTranscript(text)

      if (current.isFinal) {
        recognition.stop()
        listeningRef.current = false
        setListening(false)
        if (text.trim()) {
          onResultRef.current(text.trim())
          setTranscript("")
          transcriptRef.current = ""
        }
      }
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
      const text = transcriptRef.current
      if (text.trim()) {
        onResultRef.current(text.trim())
        setTranscript("")
        transcriptRef.current = ""
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      listeningRef.current = true
      setListening(true)
      setTranscript("")
      transcriptRef.current = ""

      timeoutRef.current = setTimeout(() => {
        if (listeningRef.current) {
          stopListening()
          const text = transcriptRef.current
          if (text.trim()) {
            onResultRef.current(text.trim())
            setTranscript("")
            transcriptRef.current = ""
          }
        }
      }, 15000)
    } catch {
      toast.error("Failed to start voice input")
      setListening(false)
      listeningRef.current = false
    }
  }, [SpeechRecognitionAPI, stopListening])

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  if (variant === "fab") {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {listening && (
          <div className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl max-w-xs animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium">Listening...</span>
            </div>
            {transcript && (
              <p className="text-sm text-muted-foreground italic">&ldquo;{transcript}&rdquo;</p>
            )}
            <div className="flex gap-2 mt-2">
              <div className="flex gap-1">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:100ms]" />
                <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:200ms]" />
              </div>
              <button onClick={stopListening} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}
        <Button
          onClick={listening ? stopListening : startListening}
          size="icon"
          className={`w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
            listening
              ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse"
              : "gradient-primary hover:scale-105"
          }`}
        >
          <span className="text-2xl">{listening ? "⬤" : "🎤"}</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={listening ? stopListening : startListening}
        variant={listening ? "destructive" : "outline"}
        className={listening ? "animate-pulse" : "border-white/10"}
        disabled={!SpeechRecognitionAPI}
      >
        <span className="flex items-center gap-2">
          {listening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening...
            </>
          ) : label}
        </span>
      </Button>
      {transcript && !listening && (
        <span className="text-sm text-muted-foreground italic max-w-[200px] truncate">
          &ldquo;{transcript}&rdquo;
        </span>
      )}
    </div>
  )
}
