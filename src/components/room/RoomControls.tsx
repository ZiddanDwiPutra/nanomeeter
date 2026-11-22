import { Camera, CameraOff, MessageSquare, Mic, MicOff, Monitor, MonitorOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoomControlsProps {
  muted: boolean
  camOff: boolean
  isScreenSharing: boolean
  isChatOpen: boolean
  unreadCount?: number
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
}

export const RoomControls = ({
  muted,
  camOff,
  isScreenSharing,
  isChatOpen,
  unreadCount = 0,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
}: RoomControlsProps) => {
  return (
    <footer className="flex flex-wrap justify-center gap-3 border-t p-4 bg-background">
      <Button
        variant={muted ? "secondary" : "default"}
        onClick={onToggleMute}
        className="gap-2"
      >
        {muted ? <MicOff className="size-4 text-red-500" /> : <Mic className="size-4" />}
        <span>{muted ? "Unmute" : "Mute"}</span>
      </Button>

      <Button
        variant={camOff ? "secondary" : "default"}
        onClick={onToggleCamera}
        className="gap-2"
      >
        {camOff ? <CameraOff className="size-4 text-red-500" /> : <Camera className="size-4" />}
        <span>{camOff ? "Camera on" : "Camera off"}</span>
      </Button>

      <Button
        variant={isScreenSharing ? "default" : "outline"}
        onClick={onToggleScreenShare}
        className="gap-2"
      >
        {isScreenSharing ? <MonitorOff className="size-4" /> : <Monitor className="size-4" />}
        <span>{isScreenSharing ? "Stop sharing" : "Share screen"}</span>
      </Button>

      <Button
        variant={isChatOpen ? "default" : "outline"}
        onClick={onToggleChat}
        className="relative gap-2"
      >
        <MessageSquare className="size-4" />
        <span>Chat</span>
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </footer>
  )
}
