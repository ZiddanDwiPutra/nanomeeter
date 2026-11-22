import type { WordPuzzle } from "@/types/wordguess"

interface TebakKataSlotsProps {
  puzzle: WordPuzzle
  placedLetters: Record<number, { letter: string; choiceIndex: number }>
  isSolved: boolean
  isIncorrect: boolean
  revealWord?: boolean
  onRemoveLetter: (blankIndex: number) => void
}

export const TebakKataSlots = ({
  puzzle,
  placedLetters,
  isSolved,
  isIncorrect,
  revealWord,
  onRemoveLetter,
}: TebakKataSlotsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
      {puzzle.word.split("").map((actualLetter, index) => {
        if (actualLetter === " ") {
          return <div key={index} className="w-4" />
        }

        const isFixed = puzzle.maskedLetters[index] !== null
        const placed = placedLetters[index]

        if (isFixed) {
          return (
            <div
              key={index}
              className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-muted/60 text-lg font-black text-foreground shadow-xs select-none sm:size-12 sm:text-xl"
            >
              {actualLetter}
            </div>
          )
        }

        const hasValue = !!placed
        const displayLetter = revealWord && !hasValue ? actualLetter : placed?.letter

        return (
          <button
            key={index}
            type="button"
            disabled={!hasValue || isSolved || revealWord}
            onClick={() => onRemoveLetter(index)}
            className={`group relative flex size-11 items-center justify-center rounded-xl font-black text-lg sm:size-12 sm:text-xl transition-all select-none ${
              isSolved
                ? "border-2 border-emerald-500 bg-emerald-500/20 text-emerald-400 scale-105"
                : isIncorrect
                  ? "border-2 border-destructive bg-destructive/20 text-destructive animate-shake"
                  : revealWord
                    ? "border-2 border-amber-500/60 bg-amber-500/15 text-amber-400"
                    : hasValue
                      ? "border-2 border-primary/70 bg-primary/10 text-primary hover:border-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      : "border-2 border-dashed border-border/80 bg-muted/20 text-muted-foreground/40"
            }`}
            title={hasValue && !isSolved && !revealWord ? "Tap untuk menghapus huruf" : undefined}
          >
            {displayLetter ?? ""}
            {hasValue && !isSolved && !revealWord && (
              <span className="absolute -top-1 -right-1 hidden size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white group-hover:flex">
                ×
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
