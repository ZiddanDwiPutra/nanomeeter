import type { ChatMessage } from "@/types/chat"

interface ChatMessageItemProps {
  message: ChatMessage
}

export const ChatMessageItem = ({ message }: ChatMessageItemProps) => {
  const isSelf = !!message.isSelf
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={`flex flex-col gap-1 ${isSelf ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
        <span className="font-medium text-foreground">{isSelf ? "You" : message.senderName}</span>
        <span>•</span>
        <span>{time}</span>
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
          isSelf
            ? "bg-primary text-primary-foreground rounded-tr-xs"
            : "bg-muted text-foreground rounded-tl-xs"
        }`}
      >
        {message.text}
      </div>
    </div>
  )
}
