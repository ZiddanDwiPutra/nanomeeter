import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SignalData } from "@/lib/rtc"
import { Meeting } from "@/lib/rtc"
import { joinLink } from "@/lib/crypto"
import { navigate } from "@/lib/router"
import { clearSession, getSession } from "@/lib/session"
import { SignalingClient, type ServerMessage } from "@/lib/signaling"

interface Tile {
  peerId: string
  name: string
  stream: MediaStream
  isSelf: boolean
}

function VideoTile({ tile }: { tile: Tile }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== tile.stream) {
      videoRef.current.srcObject = tile.stream
    }
  }, [tile.stream])

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={tile.isSelf}
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {tile.name}
        {tile.isSelf ? " (you)" : ""}
      </div>
    </div>
  )
}

export default function Room({ roomId }: { roomId: string }) {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const session = getSession(roomId)
    if (!session) {
      navigate(`/join/${roomId}`)
      return
    }

    let disposed = false
    let sig: SignalingClient | null = null
    let meeting: Meeting | null = null
    let localStream: MediaStream | null = null
    let retriedAsJoin = false
    const names = new Map<string, string>()

    const cleanup = () => {
      disposed = true
      sig?.close()
      meeting?.close()
      localStream?.getTracks().forEach((t) => t.stop())
      clearSession(roomId)
    }

    const addPeer = (peerId: string, name: string, polite: boolean) => {
      names.set(peerId, name)
      meeting?.addPeer(peerId, polite)
    }

    const onMessage = (msg: ServerMessage) => {
      switch (msg.type) {
        case "created":
        case "joined":
          for (const peer of msg.peers) addPeer(peer.peerId, peer.name, false)
          setTiles((prev) => [
            { peerId: "self", name: session.name, stream: localStream as MediaStream, isSelf: true },
            ...prev.filter((t) => t.peerId !== "self"),
          ])
          setJoined(true)
          break
        case "peer-joined":
          addPeer(msg.peerId, msg.name, true)
          break
        case "peer-left":
          meeting?.removePeer(msg.peerId)
          setTiles((prev) => prev.filter((t) => t.peerId !== msg.peerId))
          break
        case "signal":
          void meeting?.handleSignal(msg.from, msg.data as SignalData)
          break
        case "error":
          if (session.isHost && msg.message === "room already exists" && !retriedAsJoin) {
            // a ghost room from a cancelled first mount (e.g. StrictMode) still holds the id
            retriedAsJoin = true
            sig?.send({
              type: "join",
              roomId,
              password: session.passwordHash,
              name: session.name,
            })
            break
          }
          toast.error(msg.message)
          navigate("/")
          break
      }
    }

    const start = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
      } catch {
        toast.error("Camera and microphone access is required")
        navigate("/")
        return
      }
      if (disposed) {
        localStream.getTracks().forEach((t) => t.stop())
        return
      }
      localStreamRef.current = localStream

      sig = new SignalingClient()
      meeting = new Meeting(localStream, (to, data) => sig?.send({ type: "signal", to, data }))
      meeting.onRemoteStream = (peerId, stream) => {
        setTiles((prev) =>
          prev.some((t) => t.peerId === peerId)
            ? prev
            : [...prev, { peerId, name: names.get(peerId) ?? "Guest", stream, isSelf: false }],
        )
      }
      sig.onMessage(onMessage)

      try {
        await sig.ready
      } catch {
        toast.error("Could not reach the signaling server")
        navigate("/")
        return
      }
      if (disposed) return

      sig.send(
        session.isHost
          ? { type: "create", roomId, password: session.passwordHash, name: session.name }
          : { type: "join", roomId, password: session.passwordHash, name: session.name },
      )
    }

    void start()
    return cleanup
  }, [roomId])

  const toggleMute = () => {
    const stream = localStreamRef.current
    if (!stream) return
    const next = !muted
    stream.getAudioTracks().forEach((t) => (t.enabled = !next))
    setMuted(next)
  }

  const toggleCamera = () => {
    const stream = localStreamRef.current
    if (!stream) return
    const next = !camOff
    stream.getVideoTracks().forEach((t) => (t.enabled = !next))
    setCamOff(next)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinLink(roomId))
    toast.success("Invite link copied")
  }

  const leave = () => {
    navigate("/")
  }

  if (!joined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Joining meeting…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-semibold tracking-tight">meetu</span>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {roomId}
          </span>
          <Button variant="outline" size="sm" onClick={() => void copyLink()}>
            Copy link
          </Button>
          <Button variant="destructive" size="sm" onClick={leave}>
            Leave
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => (
            <VideoTile key={tile.peerId} tile={tile} />
          ))}
        </div>
        {tiles.length === 1 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            You are the only one here. Share the link to invite others.
          </p>
        )}
      </main>

      <footer className="flex justify-center gap-2 border-t p-4">
        <Button variant={muted ? "default" : "outline"} onClick={toggleMute}>
          {muted ? "Unmute" : "Mute"}
        </Button>
        <Button variant={camOff ? "default" : "outline"} onClick={toggleCamera}>
          {camOff ? "Camera on" : "Camera off"}
        </Button>
      </footer>
    </div>
  )
}
