import { Gamepad2 } from "lucide-react"

interface HostGamesButtonProps {
  onOpen: () => void
}

export const HostGamesButton = ({ onOpen }: HostGamesButtonProps) => {
  return (
    <aside
      aria-label="Host game tools"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-30"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex items-center gap-2 rounded-r-xl border border-l-0 border-primary/30 bg-background/90 px-3 py-3 text-xs font-semibold shadow-xl backdrop-blur-md transition-all hover:bg-accent hover:pl-4 hover:shadow-primary/20 hover:border-primary/50 cursor-pointer"
        title="Create games for meeting participants"
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:scale-110 transition-transform">
          <Gamepad2 className="size-4 text-primary" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Host</span>
          <span className="text-xs font-semibold text-foreground">Create games</span>
        </div>
      </button>
    </aside>
  )
}
