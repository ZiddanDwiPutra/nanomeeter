import { useState } from "react"
import { Circle, Eye, Play, Swords, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GameParticipant, TicTacToePlayers } from "@/types/game"

interface TicTacToeSetupModalProps {
  isOpen: boolean
  onClose: () => void
  participants: GameParticipant[]
  onStart: (players: TicTacToePlayers) => void
}

export const TicTacToeSetupModal = ({
  isOpen,
  onClose,
  participants,
  onStart,
}: TicTacToeSetupModalProps) => {
  const defaultX = participants[0]?.id || ""
  const defaultO = participants.length > 1 ? participants[1]?.id || "" : defaultX

  const [playerXId, setPlayerXId] = useState<string>("")
  const [playerOId, setPlayerOId] = useState<string>("")

  if (!isOpen) return null

  const currentX = playerXId || defaultX
  const currentO = playerOId || defaultO

  const handleStart = () => {
    const pX = participants.find((p) => p.id === currentX) || participants[0]
    const pO = participants.find((p) => p.id === currentO) || participants[1] || participants[0]

    if (!pX || !pO) return

    onStart({
      X: { id: pX.id, name: pX.name },
      O: { id: pO.id, name: pO.name },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-background p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
              <Swords className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Select Players</h3>
              <p className="text-[11px] text-muted-foreground">Tic Tac Toe is a 2-player showdown</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="my-4 space-y-4">
          {/* Player X Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <X className="size-3.5 stroke-[3]" />
              <span>Player X (First Move)</span>
            </label>
            <select
              value={currentX}
              onChange={(e) => setPlayerXId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 p-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            >
              {participants.map((p) => (
                <option key={`x-${p.id}`} value={p.id}>
                  {p.name} {p.isSelf ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Player O Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <Circle className="size-3.5 stroke-[3]" />
              <span>Player O (Second Move)</span>
            </label>
            <select
              value={currentO}
              onChange={(e) => setPlayerOId(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 p-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            >
              {participants.map((p) => (
                <option key={`o-${p.id}`} value={p.id}>
                  {p.name} {p.isSelf ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Spectator Notice */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground border">
            <Eye className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              All other participants in the meeting will join as <strong>spectators</strong> to watch the match live in real-time.
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="default" className="flex-1 gap-1.5 text-xs" onClick={handleStart}>
            <Play className="size-3.5" />
            <span>Start Match</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
