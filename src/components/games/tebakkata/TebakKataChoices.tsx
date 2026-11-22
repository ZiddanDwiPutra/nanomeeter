interface TebakKataChoicesProps {
  choices: string[]
  usedChoiceIndices: number[]
  disabled: boolean
  onSelectChoice: (choiceIndex: number) => void
}

export const TebakKataChoices = ({
  choices,
  usedChoiceIndices,
  disabled,
  onSelectChoice,
}: TebakKataChoicesProps) => {
  return (
    <div className="mt-3 flex flex-col items-center">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Pilihan Huruf (Pilih untuk melengkapi)
      </span>
      <div className="grid grid-cols-6 gap-2 w-full max-w-xs sm:max-w-sm">
        {choices.map((letter, index) => {
          const isUsed = usedChoiceIndices.includes(index)
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || isUsed}
              onClick={() => onSelectChoice(index)}
              className={`flex aspect-square items-center justify-center rounded-xl border font-black text-lg transition-all select-none ${
                isUsed
                  ? "border-border/40 bg-muted/20 text-muted-foreground/30 cursor-not-allowed scale-90"
                  : disabled
                  ? "border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed"
                  : "border-border/80 bg-background hover:bg-cyan-500/10 hover:border-cyan-500/60 hover:text-cyan-400 hover:scale-105 active:scale-95 cursor-pointer shadow-sm text-foreground"
              }`}
              aria-label={`Pilih huruf ${letter}`}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
