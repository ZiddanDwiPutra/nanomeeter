import { ChatPanel } from "@/components/chat/ChatPanel"
import type { ChatMessage } from "@/types/chat"

interface ChatSidebarProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClose: () => void
}

export const ChatSidebar = ({ messages, onSend, onClose }: ChatSidebarProps) => {
  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col border-l bg-background md:flex lg:w-96">
      <ChatPanel messages={messages} onSend={onSend} onClose={onClose} />
    </aside>
  )
}
