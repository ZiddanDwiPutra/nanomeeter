import { useEffect, useRef } from "react"

export interface Tile {
  peerId: string
  name: string
  stream: MediaStream
  isSelf: boolean
  isScreen?: boolean
}

interface VideoTileProps {
  tile: Tile
}

export const VideoTile = ({ tile }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== tile.stream) {
      videoRef.current.srcObject = tile.stream
    }
  }, [tile.stream])

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-lg border bg-black ${
        tile.isScreen ? "sm:col-span-2 xl:col-span-2" : ""
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={tile.isSelf}
        className={`h-full w-full ${tile.isScreen ? "object-contain bg-zinc-950" : "object-cover"}`}
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        <span>{tile.name}</span>
        {tile.isSelf && <span className="text-zinc-400">(you)</span>}
        {tile.isScreen && (
          <span className="rounded bg-primary/80 px-1 py-0.2 text-[10px] uppercase font-semibold">
            Screen
          </span>
        )}
      </div>
    </div>
  )
}
