import { useEffect, useRef } from "react"
import { MessageSquare, X } from "lucide-react"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatMessageItem } from "@/components/chat/ChatMessageItem"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/types/chat"

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClose: () => void
}

export const ChatPanel = ({ messages, onSend, onClose }: ChatPanelProps) => {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">In-call messages</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-7 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Close chat"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
            <MessageSquare className="size-8 mb-2 opacity-30" />
            <p className="font-medium">No messages yet</p>
            <p className="mt-0.5 text-[11px]">Messages are only visible to active participants.</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}
        <div ref={endRef} />
      </div>

      <ChatInput onSend={onSend} />
    </div>
  )
}
