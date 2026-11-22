import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { QrCode } from "lucide-react"

interface QrCardProps {
  roomId: string
  link: string
}

export const QrCard = ({ roomId, link }: QrCardProps) => {
  const [qrUrl, setQrUrl] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(link, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [link])

  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm dark:border-zinc-800">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 w-full justify-between">
        <div className="flex items-center gap-1.5">
          <QrCode className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">QRIS / Scan to Join</span>
        </div>
        <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-600">
          {roomId}
        </span>
      </div>

      <div className="my-4 flex size-56 items-center justify-center overflow-hidden rounded-lg border border-zinc-100 bg-white p-2 shadow-inner">
        {qrUrl ? (
          <img src={qrUrl} alt={`QR Code for room ${roomId}`} className="h-full w-full object-contain" />
        ) : (
          <div className="size-full animate-pulse rounded bg-zinc-100" />
        )}
      </div>

      <p className="text-center text-xs text-zinc-500">
        Scan with any mobile camera or QR reader to join this meeting directly.
      </p>
    </div>
  )
}
