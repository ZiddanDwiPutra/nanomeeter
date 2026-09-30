import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { RoomControls } from "@/components/room/RoomControls"
import { RoomHeader } from "@/components/room/RoomHeader"
import { VideoTile, type Tile } from "@/components/room/VideoTile"
import { joinLink } from "@/lib/crypto"
import { navigate } from "@/lib/router"
import type { SignalData } from "@/lib/rtc"
import { Meeting } from "@/lib/rtc"
import { clearSession, getSession } from "@/lib/session"
import { SignalingClient, type ServerMessage } from "@/lib/signaling"

const Room = ({ roomId }: { roomId: string }) => {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const meetingRef = useRef<Meeting | null>(null)
  const sessionRef = useRef(getSession(roomId))

  const stopScreenShare = useCallback(() => {
    meetingRef.current?.setScreenStream(null)

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    setTiles((prev) => prev.filter((t) => t.peerId !== "self-screen"))
    setIsScreenSharing(false)
  }, [])

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Screen sharing is not supported in this browser")
      return
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      const screenTrack = screenStream.getVideoTracks()[0]
      if (!screenTrack) return

      screenStreamRef.current = screenStream

      screenTrack.onended = () => {
        stopScreenShare()
      }

      meetingRef.current?.setScreenStream(screenStream)

      const selfName = sessionRef.current?.name ?? "You"
      setTiles((prev) => [
        ...prev.filter((t) => t.peerId !== "self-screen"),
        {
          peerId: "self-screen",
          name: `${selfName}'s screen`,
          stream: screenStream,
          isSelf: true,
          isScreen: true,
        },
      ])

      setIsScreenSharing(true)
    } catch (error) {
      if (error instanceof Error && error.name !== "NotAllowedError") {
        toast.error("Failed to share screen")
      }
    }
  }, [stopScreenShare])

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      void startScreenShare()
    }
  }

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
    stopScreenShare()
    clearSession(roomId)
    navigate("/")
  }

  useEffect(() => {
    const session = getSession(roomId)
    if (!session) {
      navigate(`/join/${roomId}`)
      return
    }
    sessionRef.current = session

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
      meetingRef.current = null
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
      localStream?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
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
            {
              peerId: "self",
              name: session.name,
              stream: localStream as MediaStream,
              isSelf: true,
              isScreen: false,
            },
            ...prev.filter((t) => t.peerId !== "self"),
          ])
          setJoined(true)
          break
        case "peer-joined":
          addPeer(msg.peerId, msg.name, true)
          break
        case "peer-left":
          meeting?.removePeer(msg.peerId)
          setTiles((prev) =>
            prev.filter((t) => t.peerId !== msg.peerId && t.peerId !== `${msg.peerId}-screen`),
          )
          break
        case "signal":
          void meeting?.handleSignal(msg.from, msg.data as SignalData)
          break
        case "error":
          if (session.isHost && msg.message === "room already exists" && !retriedAsJoin) {
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
          clearSession(roomId)
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
        clearSession(roomId)
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
      meetingRef.current = meeting

      meeting.onRemoteStream = (peerId, stream, isScreen) => {
        const tileId = isScreen ? `${peerId}-screen` : peerId
        const peerName = names.get(peerId) ?? "Guest"
        const displayName = isScreen ? `${peerName}'s screen` : peerName

        setTiles((prev) =>
          prev.some((t) => t.peerId === tileId)
            ? prev
            : [...prev, { peerId: tileId, name: displayName, stream, isSelf: false, isScreen }],
        )
      }

      meeting.onRemoteStreamRemoved = (peerId, isScreen) => {
        const tileId = isScreen ? `${peerId}-screen` : peerId
        setTiles((prev) => prev.filter((t) => t.peerId !== tileId))
      }

      meeting.onPeerRemoved = (peerId) => {
        setTiles((prev) =>
          prev.filter((t) => t.peerId !== peerId && t.peerId !== `${peerId}-screen`),
        )
      }

      sig.onMessage(onMessage)

      try {
        await sig.ready
      } catch {
        toast.error("Could not reach the signaling server")
        clearSession(roomId)
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

  if (!joined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Joining meeting…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <RoomHeader roomId={roomId} onCopyLink={() => void copyLink()} onLeave={leave} />

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

      <RoomControls
        muted={muted}
        camOff={camOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
      />
    </div>
  )
}

export default Room
