import type { WordPuzzle } from "@/types/wordguess"

interface TebakKataSlotsProps {
  puzzle: WordPuzzle
  placedLetters: Record<number, { letter: string; choiceIndex: number }>
  isSolved: boolean
  isIncorrect: boolean
  onRemoveLetter: (blankIndex: number) => void
}

export const TebakKataSlots = ({
  puzzle,
  placedLetters,
  isSolved,
  isIncorrect,
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
        return (
          <button
            key={index}
            type="button"
            disabled={!hasValue || isSolved}
            onClick={() => onRemoveLetter(index)}
            className={`group relative flex size-11 items-center justify-center rounded-xl font-black text-lg sm:size-12 sm:text-xl transition-all select-none ${
              isSolved
                ? "border-2 border-emerald-500 bg-emerald-500/20 text-emerald-400 scale-105"
                : isIncorrect
                ? "border-2 border-destructive bg-destructive/20 text-destructive animate-shake"
                : hasValue
                ? "border-2 border-cyan-500 bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 cursor-pointer shadow-md"
                : "border-2 border-dashed border-primary/40 bg-background/50 text-transparent animate-pulse"
            }`}
            title={hasValue && !isSolved ? "Hapus huruf ini" : undefined}
          >
            {hasValue ? placed.letter : "_"}
            {hasValue && !isSolved && (
              <span className="absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white group-hover:flex">
                ×
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
