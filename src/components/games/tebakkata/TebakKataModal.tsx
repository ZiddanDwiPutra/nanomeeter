import { useEffect } from "react"
import { CheckCircle2, HelpCircle, RotateCcw, Sparkles, Square, X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  TebakKataPlayerAnswer,
  TebakKataStatus,
  WordPuzzle,
} from "@/types/wordguess"
import { CATEGORIES } from "./wordBank"
import { TebakKataChoices } from "./TebakKataChoices"
import { TebakKataLeaderboard } from "./TebakKataLeaderboard"
import { TebakKataSlots } from "./TebakKataSlots"
import { TebakKataTimer } from "./TebakKataTimer"

interface TebakKataModalProps {
  isOpen: boolean
  onClose: () => void
  onEndGame?: () => void
  onPlayAgain?: () => void
  puzzle: WordPuzzle | null
  placedLetters: Record<number, { letter: string; choiceIndex: number }>
  usedChoiceIndices: number[]
  isSolved: boolean
  isIncorrect: boolean
  hasAnswered: boolean
  myAnswer: TebakKataPlayerAnswer | null
  answeredPlayers: Record<string, TebakKataPlayerAnswer>
  scores: Record<string, number>
  round: number
  totalRounds: number
  roundDuration: number
  roundStartedAt: number
  status: TebakKataStatus
  isHost: boolean
  currentUserName: string
  totalActivePlayers: number
  onSelectChoice: (choiceIndex: number) => void
  onRemoveLetter: (blankIndex: number) => void
  onResetPlaced: () => void
  onTimeout: () => void
}

export const TebakKataModal = ({
  isOpen,
  onClose,
  onEndGame,
  onPlayAgain,
  puzzle,
  placedLetters,
  usedChoiceIndices,
  isSolved,
  isIncorrect,
  hasAnswered,
  myAnswer,
  answeredPlayers,
  scores,
  round,
  totalRounds,
  roundDuration,
  roundStartedAt,
  status,
  isHost,
  totalActivePlayers,
  onSelectChoice,
  onRemoveLetter,
  onResetPlaced,
  onTimeout,
}: TebakKataModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // If game is over, render the final leaderboard with confetti!
  if (status === "game_over") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <TebakKataLeaderboard
            scores={scores}
            totalRounds={totalRounds}
            isHost={isHost}
            onPlayAgain={onPlayAgain}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (!puzzle) return null

  const categoryMeta = CATEGORIES.find((c) => c.id === puzzle.category) ?? {
    id: puzzle.category,
    label: puzzle.category,
    icon: "🎯",
  }

  const answeredCount = Object.keys(answeredPlayers).length
  const isRoundResult = status === "round_result"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <HelpCircle className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Tebak Kata</h3>
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  Babak {round} / {totalRounds}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Lengkapi huruf yang hilang</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Countdown Timer */}
        <TebakKataTimer
          roundDuration={roundDuration}
          roundStartedAt={roundStartedAt}
          isActive={status === "playing"}
          hasAnswered={hasAnswered}
          onTimeout={onTimeout}
        />

        {/* Category Pill and Answered Counter */}
        <div className="my-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-foreground">
            <span className="text-sm">{categoryMeta.icon}</span>
            <span>Kategori:</span>
            <span className="text-cyan-400 capitalize">{categoryMeta.label}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-full border border-border/40">
            <span>Sudah jawab:</span>
            <strong className="text-foreground">
              {answeredCount}/{Math.max(1, totalActivePlayers)}
            </strong>
          </div>
        </div>

        {/* Word Display Slots */}
        <TebakKataSlots
          puzzle={puzzle}
          placedLetters={placedLetters}
          isSolved={isSolved}
          isIncorrect={isIncorrect}
          revealWord={isRoundResult}
          onRemoveLetter={onRemoveLetter}
        />

        {/* Status / Feedback Banner ("anda salah / benar") */}
        <div className="mb-2.5 flex items-center justify-center rounded-xl p-3 text-center text-xs font-medium transition-all">
          {isRoundResult ? (
            <div className="space-y-1">
              <div className="font-bold text-foreground flex items-center justify-center gap-1.5">
                <span>Babak {round} Selesai! Kata yang benar:</span>
                <span className="text-amber-400 uppercase tracking-wider">{puzzle.word}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Melanjutkan ke babak berikutnya...
              </div>
            </div>
          ) : hasAnswered ? (
            myAnswer?.isCorrect ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl w-full justify-center">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Anda Benar! (+{myAnswer.pointsEarned} Poin)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive font-bold bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl w-full justify-center">
                <XCircle className="size-4 shrink-0" />
                <span>Anda Salah! (0 Poin)</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40">
              <Sparkles className="size-3 text-amber-400 shrink-0" />
              <span>Semakin cepat menjawab, semakin besar poin yang didapat!</span>
            </div>
          )}
        </div>

        {/* 6 Choices */}
        <TebakKataChoices
          choices={puzzle.choices}
          usedChoiceIndices={usedChoiceIndices}
          disabled={hasAnswered || isRoundResult}
          onSelectChoice={onSelectChoice}
        />

        {/* Mini Scores Ribbon */}
        {Object.keys(scores).length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-[11px]">
            <span className="font-bold text-muted-foreground shrink-0">Skor Sementara:</span>
            <div className="flex items-center gap-3">
              {Object.entries(scores)
                .sort((a, b) => b[1] - a[1])
                .map(([name, score]) => (
                  <span key={name} className="truncate">
                    <strong className="text-foreground">{name}:</strong>{" "}
                    <span className="text-cyan-400 font-bold">{score}</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-1.5">
            {!hasAnswered && !isRoundResult && Object.keys(placedLetters).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetPlaced}
                className="h-8 gap-1 text-xs"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {isHost && onEndGame && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onEndGame}
                className="h-8 gap-1.5 text-xs bg-destructive/80 hover:bg-destructive"
                title="Akhiri sesi permainan untuk seluruh peserta"
              >
                <Square className="size-3" />
                <span>Akhiri Sesi</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs px-3"
              title="Tutup tampilan popup sementara"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
