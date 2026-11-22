import { useEffect, useState } from "react"
import { Check, Copy, X } from "lucide-react"
import { toast } from "sonner"
import { QrCard } from "@/components/room/QrCard"
import { Button } from "@/components/ui/button"

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  link: string
}

export const QrModal = ({ isOpen, onClose, roomId, link }: QrModalProps) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Invite link copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-background p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-base font-semibold tracking-tight">Meeting QR Code</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <QrCard roomId={roomId} link={link} />

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => void handleCopy()}>
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied" : "Copy link"}</span>
          </Button>
          <Button variant="default" className="flex-1 text-xs" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
