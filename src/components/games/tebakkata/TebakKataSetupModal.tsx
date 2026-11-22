import { useEffect, useState } from "react"
import { Clock, HelpCircle, Layers, Play, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TebakKataConfig, WordCategory } from "@/types/wordguess"
import { CATEGORIES } from "./wordBank"

interface TebakKataSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: TebakKataConfig) => void
}

const ROUND_OPTIONS = [5, 10, 15, 20]
const TIMER_OPTIONS = [5, 10, 15, 20, 30]

export const TebakKataSetupModal = ({
  isOpen,
  onClose,
  onStart,
}: TebakKataSetupModalProps) => {
  const [category, setCategory] = useState<WordCategory | "auto">("auto")
  const [totalRounds, setTotalRounds] = useState(10)
  const [roundDuration, setRoundDuration] = useState(10)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleStartGame = () => {
    onStart({
      category,
      totalRounds,
      roundDuration,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Setup Sesi Tebak Kata</h3>
              <p className="text-xs text-muted-foreground">Atur aturan permainan sebelum memulai</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="my-5 space-y-4">
          {/* Pilihan Kategori */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <span>Pilih Kategori Kata</span>
              <span className="text-muted-foreground text-[11px]">(Default: Auto)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("auto")}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer ${
                  category === "auto"
                    ? "border-amber-500 bg-amber-500/15 text-foreground shadow-xs font-semibold"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="text-base">🎯</span>
                <div className="text-left leading-tight">
                  <div>Auto</div>
                  <div className="text-[10px] text-muted-foreground">Semua Kategori</div>
                </div>
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer ${
                    category === cat.id
                      ? "border-amber-500 bg-amber-500/15 text-foreground shadow-xs font-semibold"
                      : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <div className="text-left leading-tight">
                    <div className="capitalize">{cat.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah Babak */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Layers className="size-3.5 text-cyan-400" />
                <span>Jumlah Babak</span>
              </label>
              <span className="text-xs font-bold text-cyan-400">{totalRounds} Babak</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ROUND_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalRounds(num)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                    totalRounds === num
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-400"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {num} Babak
                </button>
              ))}
            </div>
          </div>

          {/* Countdown Timer */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Clock className="size-3.5 text-amber-400" />
                <span>Waktu Countdown per Babak</span>
              </label>
              <span className="text-xs font-bold text-amber-400">{roundDuration} Detik</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TIMER_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setRoundDuration(sec)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                    roundDuration === sec
                      ? "border-amber-500 bg-amber-500/15 text-amber-400"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Tips Info Box */}
          <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground border border-border/50">
            <Sparkles className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Aturan Skor:</strong> Setiap babak bernilai poin dasar + bonus kecepatan. Semakin cepat Anda menjawab dengan benar, semakin banyak poin yang didapatkan!
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleStartGame}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <Play className="size-3.5 fill-current" />
            <span>Mulai Permainan ({totalRounds} Babak)</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
