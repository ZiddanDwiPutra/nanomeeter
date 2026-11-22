import { useEffect } from "react"
import { Gamepad2, HelpCircle, Play, Sparkles, Swords, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GamesListModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectGame: (gameId: string) => void
}

export const GamesListModal = ({
  isOpen,
  onClose,
  onSelectGame,
}: GamesListModalProps) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">Meeting Games</h3>
              <p className="text-xs text-muted-foreground">Select a game to play together with participants</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="my-5 space-y-3">
          {/* Tic Tac Toe Card */}
          <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-105 transition-transform">
                  <Swords className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Tic Tac Toe</h4>
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                      Realtime 2P
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Classic X & O battle! Claim three squares in a row, column, or diagonal to win.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Turn-based & interactive</span>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectGame("tictactoe")}
                className="gap-1.5"
              >
                <Play className="size-3.5" />
                <span>Play Now</span>
              </Button>
            </div>
          </div>

          {/* Tebak Kata Card */}
          <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-amber-500/50 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                  <HelpCircle className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Tebak Kata</h4>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      Semua Peserta
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lengkapi huruf yang hilang dari 6 huruf acak. Kategori: Benda, Hewan, Negara, & Transportasi!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Realtime multiplayer quiz</span>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectGame("tebakkata")}
                className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
              >
                <Play className="size-3.5" />
                <span>Play Now</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
          Games run directly inside the meeting over peer-to-peer connection.
        </div>
      </div>
    </div>
  )
}
