import { useEffect } from "react"
import { Circle, Eye, RotateCcw, Square, Swords, Trophy, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BoardState, PlayerMark, TicTacToePlayers } from "@/types/game"

interface TicTacToeModalProps {
  isOpen: boolean
  onClose: () => void
  onEndGame?: () => void
  board: BoardState
  turn: PlayerMark
  winner: PlayerMark | "draw" | null
  winningLine: number[] | null
  scores: { X: number; O: number; ties: number }
  players: TicTacToePlayers | null
  myRole: "X" | "O" | "spectator"
  isHost: boolean
  onMove: (index: number) => void
  onReset: () => void
  onChangePlayers?: () => void
}

export const TicTacToeModal = ({
  isOpen,
  onClose,
  onEndGame,
  board,
  turn,
  winner,
  winningLine,
  scores,
  players,
  myRole,
  isHost,
  onMove,
  onReset,
  onChangePlayers,
}: TicTacToeModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isMyTurn = myRole === turn && !winner
  const nameX = players?.X.name || "Player X"
  const nameO = players?.O.name || "Player O"
  const hasGameStarted = board.some((cell) => cell !== null) || !!winner
  const showPlayAgain = isHost && hasGameStarted

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-background p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
              <Swords className="size-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Tic Tac Toe</h3>
          </div>

          <div className="flex items-center gap-2">
            {myRole === "spectator" ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                <Eye className="size-3" />
                <span>Spectating</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <span>You: {myRole}</span>
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-7 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Tutup popup"
              title="Tutup popup (sesi game tetap aktif)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Scoreboard with Player Names */}
        <div className="my-3 grid grid-cols-3 gap-2 text-center">
          <div
            className={`flex flex-col items-center rounded-xl p-2 border transition-all ${
              turn === "X" && !winner
                ? "border-cyan-500/60 bg-cyan-500/10 shadow-sm ring-1 ring-cyan-500/30"
                : "border-border bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs truncate max-w-full">
              <X className="size-3.5 stroke-[3] shrink-0" />
              <span className="truncate">{nameX}</span>
            </div>
            {myRole === "X" && <span className="text-[10px] text-cyan-400 font-medium">(You)</span>}
            <span className="mt-0.5 text-lg font-black">{scores.X}</span>
          </div>

          <div className="flex flex-col items-center rounded-xl p-2 border border-border bg-muted/40">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Ties</span>
            <span className="mt-0.5 text-lg font-black">{scores.ties}</span>
          </div>

          <div
            className={`flex flex-col items-center rounded-xl p-2 border transition-all ${
              turn === "O" && !winner
                ? "border-rose-500/60 bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                : "border-border bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-1 text-rose-400 font-bold text-xs truncate max-w-full">
              <Circle className="size-3.5 stroke-[3] shrink-0" />
              <span className="truncate">{nameO}</span>
            </div>
            {myRole === "O" && <span className="text-[10px] text-rose-400 font-medium">(You)</span>}
            <span className="mt-0.5 text-lg font-black">{scores.O}</span>
          </div>
        </div>

        {/* Status / Turn Banner */}
        <div className="mb-3 flex items-center justify-center rounded-lg bg-muted/60 py-2 text-xs font-medium px-2 text-center">
          {winner === "X" && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold animate-bounce">
              <Trophy className="size-4 text-amber-400" />
              <span>{nameX} Wins the Match!</span>
            </div>
          )}
          {winner === "O" && (
            <div className="flex items-center gap-1.5 text-rose-400 font-bold animate-bounce">
              <Trophy className="size-4 text-amber-400" />
              <span>{nameO} Wins the Match!</span>
            </div>
          )}
          {winner === "draw" && (
            <span className="text-muted-foreground font-semibold">Match Draw!</span>
          )}
          {!winner && (
            <>
              {myRole === "spectator" ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="size-3.5 text-amber-400" />
                  <span>
                    Waiting for <strong className="text-foreground">{currentTurnPlayerPlayer(turn, nameX, nameO)}</strong>'s move...
                  </span>
                </div>
              ) : isMyTurn ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold animate-pulse">
                  <span>It's your turn! Place your {myRole}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Waiting for {turn === "X" ? nameX : nameO}'s move...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-1">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index)
            const canClickCell = isMyTurn && !cell && !winner

            return (
              <button
                key={index}
                type="button"
                disabled={!canClickCell}
                onClick={() => onMove(index)}
                className={`relative flex aspect-square items-center justify-center rounded-xl border border-border/80 transition-all font-bold select-none ${
                  isWinningCell
                    ? "bg-amber-400/20 border-amber-400 shadow-md scale-102"
                    : cell
                    ? "bg-muted/50 cursor-default"
                    : canClickCell
                    ? "bg-muted/20 hover:bg-muted/60 hover:scale-102 active:scale-95 cursor-pointer"
                    : "bg-muted/10 opacity-70 cursor-not-allowed"
                }`}
                aria-label={`Cell ${index + 1}`}
              >
                {cell === "X" && (
                  <X className="size-11 stroke-[3] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] animate-in zoom-in-50 duration-150" />
                )}
                {cell === "O" && (
                  <Circle className="size-10 stroke-[3] text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.4)] animate-in zoom-in-50 duration-150" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {showPlayAgain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Play Again</span>
                </Button>
              )}

              {isHost && onChangePlayers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangePlayers}
                  className="gap-1.5 text-xs"
                >
                  <Users className="size-3.5" />
                  <span>Change Players</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {isHost && onEndGame && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onEndGame}
                  className="gap-1.5 text-xs bg-destructive/80 hover:bg-destructive"
                  title="Akhiri sesi permainan untuk seluruh peserta"
                >
                  <Square className="size-3" />
                  <span>Akhiri Game</span>
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-xs px-3"
                title="Tutup tampilan popup sementara"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function currentTurnPlayerPlayer(turn: PlayerMark, nameX: string, nameO: string): string {
  return turn === "X" ? `${nameX} (X)` : `${nameO} (O)`
}
