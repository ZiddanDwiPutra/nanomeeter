import { useEffect, useState } from "react"
import { Clock, Zap } from "lucide-react"

interface TebakKataTimerProps {
  roundDuration: number
  roundStartedAt: number
  isActive: boolean
  hasAnswered: boolean
  onTimeout: () => void
}

export const TebakKataTimer = ({
  roundDuration,
  roundStartedAt,
  isActive,
  hasAnswered,
  onTimeout,
}: TebakKataTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - roundStartedAt) / 1000)
    return Math.max(0, roundDuration - elapsed)
  })

  useEffect(() => {
    if (!isActive || hasAnswered) return

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - roundStartedAt) / 1000)
      const remaining = Math.max(0, roundDuration - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        onTimeout()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 250)
    return () => clearInterval(interval)
  }, [hasAnswered, isActive, onTimeout, roundDuration, roundStartedAt])

  const percentage = Math.max(0, Math.min(100, (timeLeft / roundDuration) * 100))
  const isUrgent = timeLeft <= 3
  const isWarning = timeLeft <= 5 && timeLeft > 3

  const currentPointsPreview = 100 + Math.max(0, timeLeft) * 10

  return (
    <div className="w-full space-y-1.5 my-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-semibold">
          <Clock
            className={`size-3.5 ${
              isUrgent
                ? "text-destructive animate-pulse"
                : isWarning
                  ? "text-amber-400"
                  : "text-cyan-400"
            }`}
          />
          <span
            className={
              isUrgent
                ? "text-destructive font-black"
                : isWarning
                  ? "text-amber-400 font-bold"
                  : "text-foreground font-medium"
            }
          >
            {hasAnswered ? "Jawaban Terkirim" : `Sisa Waktu: ${timeLeft}s`}
          </span>
        </div>

        {!hasAnswered && (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Zap className="size-3 fill-current" />
            <span>Poin Saat Ini: +{currentPointsPreview}</span>
          </div>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            hasAnswered
              ? "bg-muted-foreground/30"
              : isUrgent
                ? "bg-destructive animate-pulse"
                : isWarning
                  ? "bg-amber-400"
                  : "bg-gradient-to-r from-cyan-400 to-emerald-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
