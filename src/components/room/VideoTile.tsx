import { useCallback, useEffect, useRef, useState } from "react"
import { AudioIndicator } from "@/components/room/AudioIndicator"
import { VideoPlaceholder } from "@/components/room/VideoPlaceholder"

export interface Tile {
  peerId: string
  name: string
  stream: MediaStream
  isSelf: boolean
  isScreen?: boolean
  camOff?: boolean
  muted?: boolean
}

interface VideoTileProps {
  tile: Tile
}

export const VideoTile = ({ tile }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const checkVideoActive = useCallback(() => {
    if (tile.camOff) return false
    const tracks = tile.stream.getVideoTracks()
    if (tracks.length === 0) return false
    return tracks.some((t) => t.readyState === "live" && (tile.isSelf ? t.enabled : !t.muted))
  }, [tile.camOff, tile.isSelf, tile.stream])

  const checkAudioMuted = useCallback(() => {
    if (tile.muted) return true
    const tracks = tile.stream.getAudioTracks()
    if (tracks.length === 0) return true
    return tracks.every((t) => (tile.isSelf ? !t.enabled : t.muted || t.readyState === "ended"))
  }, [tile.isSelf, tile.muted, tile.stream])

  const [hasVideo, setHasVideo] = useState(checkVideoActive)
  const [isAudioMuted, setIsAudioMuted] = useState(checkAudioMuted)

  useEffect(() => {
    const updateTracksState = () => {
      setHasVideo(checkVideoActive())
      setIsAudioMuted(checkAudioMuted())
    }

    updateTracksState()

    const stream = tile.stream
    stream.addEventListener("addtrack", updateTracksState)
    stream.addEventListener("removetrack", updateTracksState)

    const tracks = stream.getTracks()
    tracks.forEach((track) => {
      track.addEventListener("mute", updateTracksState)
      track.addEventListener("unmute", updateTracksState)
      track.addEventListener("ended", updateTracksState)
    })

    return () => {
      stream.removeEventListener("addtrack", updateTracksState)
      stream.removeEventListener("removetrack", updateTracksState)
      tracks.forEach((track) => {
        track.removeEventListener("mute", updateTracksState)
        track.removeEventListener("unmute", updateTracksState)
        track.removeEventListener("ended", updateTracksState)
      })
    }
  }, [checkAudioMuted, checkVideoActive, tile.stream])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (video.srcObject !== tile.stream) {
      video.srcObject = tile.stream
    }

    const playVideo = () => {
      video.play().catch(() => {})
    }

    playVideo()
    video.addEventListener("loadedmetadata", playVideo)

    return () => {
      video.removeEventListener("loadedmetadata", playVideo)
    }
  }, [tile.stream])

  const showVideo = tile.isScreen || hasVideo

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
        className={`h-full w-full ${tile.isScreen ? "object-contain bg-zinc-950" : "object-cover"} ${
          showVideo ? "block" : "hidden"
        }`}
      />

      {!showVideo && <VideoPlaceholder name={tile.name} isSelf={tile.isSelf} />}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-xs">
        {!tile.isScreen && <AudioIndicator muted={isAudioMuted} />}
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
