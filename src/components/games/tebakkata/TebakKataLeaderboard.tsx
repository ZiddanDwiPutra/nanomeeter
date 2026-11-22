import { Award, Crown, RotateCcw, Trophy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Confetti } from "@/components/ui/Confetti"

interface TebakKataLeaderboardProps {
  scores: Record<string, number>
  totalRounds: number
  isHost: boolean
  onPlayAgain?: () => void
  onClose: () => void
}

export const TebakKataLeaderboard = ({
  scores,
  totalRounds,
  isHost,
  onPlayAgain,
  onClose,
}: TebakKataLeaderboardProps) => {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const winner = ranked[0]

  return (
    <div className="relative">
      <Confetti />

      <div className="text-center mb-5">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 ring-8 ring-amber-500/10 animate-bounce">
          <Trophy className="size-8" />
        </div>
        <h3 className="text-xl font-extrabold tracking-tight">Permainan Selesai!</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Klasemen akhir setelah {totalRounds} babak
        </p>
      </div>

      {/* Winner Spotlight */}
      {winner && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-transparent p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Crown className="size-4" />
            <span>Pemenang Utama</span>
          </div>
          <div className="text-lg font-black text-foreground truncate">{winner[0]}</div>
          <div className="text-xs font-semibold text-amber-400 mt-0.5">
            {winner[1]} Total Poin
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 mb-5">
        {ranked.map(([name, score], idx) => {
          const rank = idx + 1
          return (
            <div
              key={name}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                rank === 1
                  ? "bg-amber-500/15 border border-amber-500/30 font-semibold"
                  : rank === 2
                    ? "bg-slate-400/10 border border-slate-400/20"
                    : rank === 3
                      ? "bg-amber-700/10 border border-amber-700/20"
                      : "bg-muted/40 border border-border/40 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    rank === 1
                      ? "bg-amber-500 text-black"
                      : rank === 2
                        ? "bg-slate-300 text-black dark:bg-slate-600 dark:text-white"
                        : rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {rank}
                </span>
                <span className="truncate text-foreground font-medium">{name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">{score}</span>
                <span className="text-[10px] text-muted-foreground">pts</span>
              </div>
            </div>
          )
        })}

        {ranked.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Belum ada skor yang tercatat
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        {isHost && onPlayAgain ? (
          <Button
            size="sm"
            onClick={onPlayAgain}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RotateCcw className="size-3.5" />
            <span>Main Sesi Baru</span>
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Award className="size-3.5 text-amber-400" />
            <span>Terima kasih sudah bermain!</span>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="text-xs px-4"
        >
          <X className="size-3.5 mr-1" />
          <span>Tutup</span>
        </Button>
      </div>
    </div>
  )
}
