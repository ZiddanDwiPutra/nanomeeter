import { Button } from "@/components/ui/button"

interface RoomControlsProps {
  muted: boolean
  camOff: boolean
  isScreenSharing: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
}

export const RoomControls = ({
  muted,
  camOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}: RoomControlsProps) => {
  return (
    <footer className="flex flex-wrap justify-center gap-2 border-t p-4">
      <Button variant={muted ? "default" : "outline"} onClick={onToggleMute}>
        {muted ? "Unmute" : "Mute"}
      </Button>
      <Button variant={camOff ? "default" : "outline"} onClick={onToggleCamera}>
        {camOff ? "Camera on" : "Camera off"}
      </Button>
      <Button
        variant={isScreenSharing ? "default" : "outline"}
        onClick={onToggleScreenShare}
      >
        {isScreenSharing ? "Stop sharing" : "Share screen"}
      </Button>
    </footer>
  )
}
