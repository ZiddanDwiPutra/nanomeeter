import { CameraOff } from "lucide-react"

interface VideoPlaceholderProps {
  name: string
  isSelf?: boolean
}

export const VideoPlaceholder = ({ name, isSelf }: VideoPlaceholderProps) => {
  const initial = (name.trim()[0] || "?").toUpperCase()

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-400">
      <div className="flex size-16 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-200 shadow-inner">
        {initial}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
        <CameraOff className="size-3.5" />
        <span>{isSelf ? "Your camera is off" : "Camera off"}</span>
      </div>
    </div>
  )
}
