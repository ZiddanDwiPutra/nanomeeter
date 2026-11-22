import { QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RoomHeaderProps {
  roomId: string
  onCopyLink: () => void
  onShowQr: () => void
  onLeave: () => void
}

export const RoomHeader = ({ roomId, onCopyLink, onShowQr, onLeave }: RoomHeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="text-lg font-semibold tracking-tight">nanomeeter</span>
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {roomId}
        </span>
        <Button variant="outline" size="sm" onClick={onShowQr} className="gap-1.5">
          <QrCode className="size-3.5" />
          <span>QRIS / QR</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyLink}>
          Copy link
        </Button>
        <Button variant="destructive" size="sm" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </header>
  )
}
