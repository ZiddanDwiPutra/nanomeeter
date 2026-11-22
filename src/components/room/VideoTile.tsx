import { useCallback, useEffect, useRef, useState } from "react"
import { AudioIndicator } from "@/components/room/AudioIndicator"
import { VideoPlaceholder } from "@/components/room/VideoPlaceholder"
import { Maximize2, Minimize2 } from "lucide-react"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch {
      // ignore fullscreen errors if denied by browser
    }
  }, [])

  const checkVideoActive = useCallback(() => {
    if (tile.camOff) return false
    const tracks = tile.stream.getVideoTracks()
    if (tracks.length === 0) return false
    return tracks.some((t) => t.readyState === "live" && (tile.isSelf ? t.enabled : true))
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
    const cleanups: (() => void)[] = []

    const attachTrack = (track: MediaStreamTrack) => {
      const onEvent = () => updateTracksState()
      track.addEventListener("mute", onEvent)
      track.addEventListener("unmute", onEvent)
      track.addEventListener("ended", onEvent)
      cleanups.push(() => {
        track.removeEventListener("mute", onEvent)
        track.removeEventListener("unmute", onEvent)
        track.removeEventListener("ended", onEvent)
      })
    }

    stream.getTracks().forEach(attachTrack)

    const onAddTrack = (e: MediaStreamTrackEvent) => {
      attachTrack(e.track)
      updateTracksState()
    }

    const onRemoveTrack = () => {
      updateTracksState()
    }

    stream.addEventListener("addtrack", onAddTrack)
    stream.addEventListener("removetrack", onRemoveTrack)

    return () => {
      stream.removeEventListener("addtrack", onAddTrack)
      stream.removeEventListener("removetrack", onRemoveTrack)
      cleanups.forEach((c) => c())
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

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [showVideo])

  return (
    <div
      ref={containerRef}
      onDoubleClick={tile.isScreen ? () => void toggleFullscreen() : undefined}
      className={`group relative aspect-video overflow-hidden rounded-lg border bg-black ${
        tile.isScreen ? "sm:col-span-2 xl:col-span-2" : ""
      } ${isFullscreen ? "!aspect-auto !fixed !inset-0 !z-50 !h-screen !w-screen !rounded-none !border-none" : ""}`}
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

      {tile.isScreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void toggleFullscreen()
          }}
          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-black/75 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/95 transition-opacity backdrop-blur-xs cursor-pointer shadow-md border border-white/20 opacity-80 group-hover:opacity-100"
          title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Keluar Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      )}

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
