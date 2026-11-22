import { useEffect } from "react"
import { ChatPanel } from "@/components/chat/ChatPanel"
import type { ChatMessage } from "@/types/chat"

interface ChatBottomSheetProps {
  isOpen: boolean
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClose: () => void
}

export const ChatBottomSheet = ({
  isOpen,
  messages,
  onSend,
  onClose,
}: ChatBottomSheetProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-[75vh] max-h-[85vh] w-full flex-col rounded-t-2xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-zinc-600/60" />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel messages={messages} onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
