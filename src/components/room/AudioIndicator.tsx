import { Mic, MicOff } from "lucide-react"

interface AudioIndicatorProps {
  muted: boolean
}

export const AudioIndicator = ({ muted }: AudioIndicatorProps) => {
  if (muted) {
    return <MicOff className="size-3 text-red-400" />
  }

  return <Mic className="size-3 text-emerald-400" />
}
