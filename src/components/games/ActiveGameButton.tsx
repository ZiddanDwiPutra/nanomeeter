import { HelpCircle, Maximize2, Square, Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PlayerMark, TicTacToePlayers } from "@/types/game"

interface ActiveGameButtonProps {
  gameId: string
  players: TicTacToePlayers | null
  turn: PlayerMark
  winner: PlayerMark | "draw" | null
  myRole: "X" | "O" | "spectator"
  isHost: boolean
  extraInfo?: string
  onOpen: () => void
  onEndGame?: () => void
}

export const ActiveGameButton = ({
  gameId,
  players,
  turn,
  winner,
  myRole,
  isHost,
  extraInfo,
  onOpen,
  onEndGame,
}: ActiveGameButtonProps) => {
  const isTicTacToe = gameId === "tictactoe"
  const isTebakKata = gameId === "tebakkata"

  const isMyTurn = isTicTacToe && myRole === turn && !winner
  const nameX = players?.X.name || "Player X"
  const nameO = players?.O.name || "Player O"
  const currentTurnName = turn === "X" ? nameX : nameO

  return (
    <aside
      aria-label="Ongoing game session"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-35 max-w-[94vw] animate-in slide-in-from-top-3 duration-200"
    >
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3 py-1.5 shadow-xl backdrop-blur-md">
        <div
          className={`flex size-7 items-center justify-center rounded-full ${
            isTebakKata
              ? "bg-amber-500/15 text-amber-400"
              : "bg-cyan-500/15 text-cyan-400"
          }`}
        >
          {isTebakKata ? (
            <HelpCircle className="size-3.5 animate-pulse text-amber-400" />
          ) : (
            <Swords className={`size-3.5 ${isMyTurn ? "animate-bounce text-emerald-400" : ""}`} />
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span>
              {isTebakKata
                ? "Tebak Kata"
                : isTicTacToe
                ? "Tic Tac Toe"
                : "Mini Game"}
            </span>
            {isTicTacToe && (
              <span className="text-muted-foreground font-normal hidden sm:inline">
                ({nameX} vs {nameO})
              </span>
            )}
            {isTebakKata && extraInfo && (
              <span className="text-amber-400 font-normal hidden sm:inline">
                ({extraInfo})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            {isTebakKata ? (
              <span className="text-muted-foreground truncate max-w-[140px] sm:max-w-none">
                {extraInfo ? `Kategori: ${extraInfo}` : "Tebak huruf yang hilang"}
              </span>
            ) : winner ? (
              <span className="font-semibold text-amber-400">
                {winner === "draw" ? "Match Draw" : `${winner === "X" ? nameX : nameO} Wins!`}
              </span>
            ) : isMyTurn ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-ping" />
                Giliran Anda!
              </span>
            ) : (
              <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                Giliran: {currentTurnName} ({turn})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          <Button
            size="sm"
            onClick={onOpen}
            className="h-7 gap-1 rounded-full px-2.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Maximize2 className="size-3" />
            <span className="hidden sm:inline">Buka Game</span>
            <span className="sm:hidden">Buka</span>
          </Button>

          {isHost && onEndGame && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEndGame}
              className="h-7 gap-1 rounded-full px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              title="Akhiri sesi game untuk semua orang"
            >
              <Square className="size-3" />
              <span className="hidden sm:inline">Akhiri</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
