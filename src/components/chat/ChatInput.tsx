import { useState, type FormEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputProps {
  onSend: (text: string) => void
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
  const [text, setText] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3 bg-background">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Send a message…"
        className="flex-1 text-sm"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!text.trim()}
        className="size-9 shrink-0"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
