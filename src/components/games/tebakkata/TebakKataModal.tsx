import { useEffect } from "react"
import { Award, ChevronRight, HelpCircle, RotateCcw, Sparkles, Square, Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WordCategory, WordPuzzle } from "@/types/wordguess"
import { CATEGORIES } from "./wordBank"
import { TebakKataChoices } from "./TebakKataChoices"
import { TebakKataSlots } from "./TebakKataSlots"

interface TebakKataModalProps {
  isOpen: boolean
  onClose: () => void
  onEndGame?: () => void
  puzzle: WordPuzzle | null
  placedLetters: Record<number, { letter: string; choiceIndex: number }>
  usedChoiceIndices: number[]
  isSolved: boolean
  isIncorrect: boolean
  solvedBy: string | null
  scores: Record<string, number>
  round: number
  isHost: boolean
  currentUserName: string
  onSelectChoice: (choiceIndex: number) => void
  onRemoveLetter: (blankIndex: number) => void
  onResetPlaced: () => void
  onNextWord?: (category?: WordCategory) => void
}

export const TebakKataModal = ({
  isOpen,
  onClose,
  onEndGame,
  puzzle,
  placedLetters,
  usedChoiceIndices,
  isSolved,
  isIncorrect,
  solvedBy,
  scores,
  round,
  isHost,
  currentUserName,
  onSelectChoice,
  onRemoveLetter,
  onResetPlaced,
  onNextWord,
}: TebakKataModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !puzzle) return null

  const categoryMeta = CATEGORIES.find((c) => c.id === puzzle.category) ?? {
    id: puzzle.category,
    label: puzzle.category,
    icon: "🎯",
  }

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])

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
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Ronde #{round}
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

        {/* Category Pill and Word Hint */}
        <div className="my-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-foreground">
            <span className="text-sm">{categoryMeta.icon}</span>
            <span>Kategori:</span>
            <span className="text-cyan-400 capitalize">{categoryMeta.label}</span>
          </div>

          {isHost && onNextWord && (
            <div className="flex items-center gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onNextWord(cat.id)}
                  title={`Ganti kata ke kategori ${cat.label}`}
                  className={`size-7 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer ${
                    puzzle.category === cat.id
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Word Display Slots */}
        <TebakKataSlots
          puzzle={puzzle}
          placedLetters={placedLetters}
          isSolved={isSolved}
          isIncorrect={isIncorrect}
          onRemoveLetter={onRemoveLetter}
        />

        {/* Status / Feedback Banner */}
        <div className="mb-2 flex items-center justify-center rounded-xl bg-muted/50 py-2 px-3 text-center text-xs font-medium">
          {isSolved ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold animate-bounce">
              <Trophy className="size-4 text-amber-400" />
              <span>
                {solvedBy === currentUserName
                  ? "Hebat! Kamu berhasil menebak dengan benar!"
                  : `🎉 ${solvedBy || "Seseorang"} berhasil menebak: ${puzzle.word}!`}
              </span>
            </div>
          ) : isIncorrect ? (
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <span>Kata belum tepat. Tap huruf di kotak untuk mengganti!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
              <Sparkles className="size-3 text-amber-400 shrink-0" />
              <span>Pilih dari 6 huruf di bawah untuk melengkapi huruf kosong.</span>
            </div>
          )}
        </div>

        {/* 6 Choices */}
        <TebakKataChoices
          choices={puzzle.choices}
          usedChoiceIndices={usedChoiceIndices}
          disabled={isSolved}
          onSelectChoice={onSelectChoice}
        />

        {/* Mini Leaderboard if any scores */}
        {scoreEntries.length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-[11px]">
            <Award className="size-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-muted-foreground shrink-0">Skor:</span>
            <div className="flex items-center gap-3">
              {scoreEntries.map(([name, score]) => (
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
            {!isSolved && Object.keys(placedLetters).length > 0 && (
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

            {isHost && onNextWord && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNextWord()}
                className="h-8 gap-1.5 text-xs border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
              >
                <span>Kata Berikutnya</span>
                <ChevronRight className="size-3.5" />
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
