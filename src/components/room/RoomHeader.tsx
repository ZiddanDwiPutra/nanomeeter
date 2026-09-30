import { Button } from "@/components/ui/button"

interface RoomHeaderProps {
  roomId: string
  onCopyLink: () => void
  onLeave: () => void
}

export const RoomHeader = ({ roomId, onCopyLink, onLeave }: RoomHeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="text-lg font-semibold tracking-tight">nanomeeter</span>
      <div className="flex items-center gap-2">
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {roomId}
        </span>
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
