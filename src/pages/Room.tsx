import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { QrCode } from "lucide-react"
import { toast } from "sonner"
import { ChatBottomSheet } from "@/components/chat/ChatBottomSheet"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ActiveGameButton } from "@/components/games/ActiveGameButton"
import { GamesListModal } from "@/components/games/GamesListModal"
import { HostGamesButton } from "@/components/games/HostGamesButton"
import { TebakKataModal } from "@/components/games/tebakkata/TebakKataModal"
import { useTebakKata } from "@/components/games/tebakkata/useTebakKata"
import { TicTacToeModal } from "@/components/games/tictactoe/TicTacToeModal"
import { TicTacToeSetupModal } from "@/components/games/tictactoe/TicTacToeSetupModal"
import { useTicTacToe } from "@/components/games/tictactoe/useTicTacToe"
import { QrModal } from "@/components/room/QrModal"
import { RoomControls } from "@/components/room/RoomControls"
import { RoomHeader } from "@/components/room/RoomHeader"
import { VideoTile, type Tile } from "@/components/room/VideoTile"
import { Button } from "@/components/ui/button"
import { joinLink } from "@/lib/crypto"
import { acquireUserMedia, requestMediaTrack } from "@/lib/media"
import { navigate } from "@/lib/router"
import type { SignalData } from "@/lib/rtc"
import { Meeting } from "@/lib/rtc"
import { clearSession, getSession } from "@/lib/session"
import { SignalingClient, type ServerMessage } from "@/lib/signaling"
import type { ChatMessage } from "@/types/chat"
import type { GameParticipant, GameSyncMessage, TicTacToePlayers } from "@/types/game"
import type { WordCategory } from "@/types/wordguess"

const Room = ({ roomId }: { roomId: string }) => {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(true)
  const [camOff, setCamOff] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showQr, setShowQr] = useState(false)
  const [isGameListOpen, setIsGameListOpen] = useState(false)
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [isGameModalOpen, setIsGameModalOpen] = useState(false)
  const isGameModalOpenRef = useRef(false)
  useEffect(() => {
    isGameModalOpenRef.current = isGameModalOpen
  })

  const ttt = useTicTacToe()
  const tttRef = useRef(ttt)
  useEffect(() => {
    tttRef.current = ttt
  })

  const tk = useTebakKata()
  const tkRef = useRef(tk)
  useEffect(() => {
    tkRef.current = tk
  })

  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const meetingRef = useRef<Meeting | null>(null)
  const [session] = useState(() => getSession(roomId))
  const sessionRef = useRef(session)
  const isChatOpenRef = useRef(false)

  const participants = useMemo<GameParticipant[]>(() => {
    return tiles
      .filter((t) => !t.isScreen)
      .map((t) => ({
        id: t.peerId,
        name: t.name,
        isSelf: t.isSelf,
      }))
  }, [tiles])

  const myRole = useMemo<"X" | "O" | "spectator">(() => {
    if (!ttt.players) return "spectator"
    const myName = session?.name
    if (ttt.players.X.name === myName || (ttt.players.X.id === "self" && session?.isHost)) {
      return "X"
    }
    if (ttt.players.O.name === myName || (ttt.players.O.id === "self" && session?.isHost)) {
      return "O"
    }
    return "spectator"
  }, [ttt.players, session?.name, session?.isHost])

  const myRoleRef = useRef(myRole)
  useEffect(() => {
    myRoleRef.current = myRole
  })

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

  const toggleMute = async () => {
    const stream = localStreamRef.current
    if (!stream) return

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      try {
        const newTrack = await requestMediaTrack("audio")
        if (newTrack) {
          meetingRef.current?.addLocalTrack(newTrack)
          meetingRef.current?.setLocalMediaState(camOff, false)
          setMuted(false)
          setTiles((prev) =>
            prev.map((t) => (t.isSelf && !t.isScreen ? { ...t, muted: false } : t)),
          )
          toast.success("Microphone connected")
        } else {
          toast.error("Microphone not available")
        }
      } catch {
        toast.error("Could not access microphone")
      }
      return
    }

    const next = !muted
    audioTracks.forEach((t) => (t.enabled = !next))
    meetingRef.current?.setLocalMediaState(camOff, next)
    setMuted(next)
    setTiles((prev) =>
      prev.map((t) => (t.isSelf && !t.isScreen ? { ...t, muted: next } : t)),
    )
  }

  const toggleCamera = async () => {
    const stream = localStreamRef.current
    if (!stream) return

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0) {
      try {
        const newTrack = await requestMediaTrack("video")
        if (newTrack) {
          meetingRef.current?.addLocalTrack(newTrack)
          meetingRef.current?.setLocalMediaState(false, muted)
          setCamOff(false)
          setTiles((prev) =>
            prev.map((t) => (t.isSelf && !t.isScreen ? { ...t, camOff: false } : t)),
          )
          toast.success("Camera connected")
        } else {
          toast.error("Camera not available")
        }
      } catch {
        toast.error("Could not access camera")
      }
      return
    }

    const next = !camOff
    videoTracks.forEach((t) => (t.enabled = !next))
    meetingRef.current?.setLocalMediaState(next, muted)
    setCamOff(next)
    setTiles((prev) =>
      prev.map((t) => (t.isSelf && !t.isScreen ? { ...t, camOff: next } : t)),
    )
  }

  const handleToggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev
      isChatOpenRef.current = next
      if (next) setUnreadCount(0)
      return next
    })
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    isChatOpenRef.current = false
  }

  const handleSendMessage = (text: string) => {
    const currentSession = sessionRef.current
    const senderName = currentSession?.name ?? "You"
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: currentSession?.name ?? "self",
      senderName,
      text,
      timestamp: Date.now(),
    }

    meetingRef.current?.sendChatMessage(message)
    setMessages((prev) => [...prev, { ...message, isSelf: true }])
  }

  const sendGameSync = useCallback((data: Partial<GameSyncMessage>) => {
    const currentSession = sessionRef.current
    const payload: GameSyncMessage = {
      __nanomeeter_game__: true,
      gameId: "tictactoe",
      type: "move",
      ...data,
    }
    meetingRef.current?.sendChatMessage({
      id: `game-${Date.now()}`,
      senderId: currentSession?.name ?? "self",
      senderName: currentSession?.name ?? "Player",
      text: JSON.stringify(payload),
      timestamp: Date.now(),
    })
  }, [])

  const handleSelectGame = (gameId: string) => {
    setIsGameListOpen(false)
    if (gameId === "tictactoe") {
      setIsSetupOpen(true)
    } else if (gameId === "tebakkata") {
      const newPuzzle = tk.initRound()
      setActiveGame("tebakkata")
      setIsGameModalOpen(true)
      sendGameSync({
        type: "launch",
        gameId: "tebakkata",
        tebakKata: {
          puzzle: newPuzzle,
          round: 1,
          scores: {},
        },
      })
      toast.success("Game Tebak Kata dimulai!")
    }
  }

  const handleSelectChoice = (choiceIndex: number) => {
    const result = tk.selectChoice(choiceIndex)
    if (result?.solved) {
      const myName = sessionRef.current?.name ?? "Player"
      tk.markSolvedBy(myName)
      sendGameSync({
        type: "solve",
        gameId: "tebakkata",
        solvedBy: myName,
      })
      toast.success(`🎉 Hebat! Kamu berhasil menebak kata: ${result.word}!`)
    }
  }

  const handleNextWord = (category?: WordCategory) => {
    const nextPuzzle = tk.initRound(category)
    sendGameSync({
      type: "next",
      gameId: "tebakkata",
      tebakKata: {
        puzzle: nextPuzzle,
        round: tk.round + 1,
        scores: tk.scores,
      },
    })
    toast.info(`Kata baru kategori ${nextPuzzle.category} siap ditebak!`)
  }

  const handleStartWithPlayers = (players: TicTacToePlayers) => {
    setIsSetupOpen(false)
    ttt.setPlayers(players)
    ttt.resetGame("X")
    setActiveGame("tictactoe")
    setIsGameModalOpen(true)
    sendGameSync({
      type: "launch",
      gameId: "tictactoe",
      players,
      board: Array(9).fill(null),
      turn: "X",
      winner: null,
      winningLine: null,
    })
    toast.success(`Match started: ${players.X.name} (X) vs ${players.O.name} (O)`)
  }

  const handlePlayerMove = (index: number) => {
    if (myRole !== ttt.turn) return
    const result = ttt.makeMove(index)
    if (result) {
      sendGameSync({ type: "move", index, player: myRole })
    }
  }

  const handleResetGame = () => {
    const nextTurn = ttt.resetGame()
    sendGameSync({
      type: "reset",
      turn: nextTurn,
      board: Array(9).fill(null),
      winner: null,
      winningLine: null,
    })
  }

  const handleCloseModal = () => {
    setIsGameModalOpen(false)
  }

  const handleOpenGameModal = () => {
    setIsGameModalOpen(true)
  }

  const handleEndGameSession = () => {
    setActiveGame(null)
    setIsGameModalOpen(false)
    if (sessionRef.current?.isHost) {
      sendGameSync({ type: "close" })
      toast.info("Game session ended")
    }
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
    const currentSession = getSession(roomId)
    if (!currentSession) {
      navigate(`/join/${roomId}`)
      return
    }
    sessionRef.current = currentSession

    let disposed = false
    let sig: SignalingClient | null = null
    let meeting: Meeting | null = null
    let localStream: MediaStream | null = null
    let initialMuted = true
    let initialCamOff = true
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
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }

    const addPeer = (peerId: string, name: string, polite: boolean) => {
      names.set(peerId, name)
      meeting?.addPeer(peerId, polite)
      const stream = meeting?.getPeerStream(peerId) ?? new MediaStream()
      const peerMedia = meeting?.getPeerMediaState(peerId)

      setTiles((prev) => {
        if (prev.some((t) => t.peerId === peerId)) return prev
        return [
          ...prev,
          {
            peerId,
            name,
            stream,
            isSelf: false,
            isScreen: false,
            camOff: peerMedia?.camOff ?? true,
            muted: peerMedia?.muted ?? true,
          },
        ]
      })
    }

    const onMessage = (msg: ServerMessage) => {
      switch (msg.type) {
        case "created":
        case "joined":
          setTiles([
            {
              peerId: "self",
              name: currentSession.name,
              stream: localStream as MediaStream,
              isSelf: true,
              isScreen: false,
              camOff: initialCamOff,
              muted: initialMuted,
            },
          ])
          for (const peer of msg.peers) addPeer(peer.peerId, peer.name, false)
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
          if (currentSession.isHost && msg.message === "room already exists" && !retriedAsJoin) {
            retriedAsJoin = true
            sig?.send({
              type: "join",
              roomId,
              password: currentSession.passwordHash,
              name: currentSession.name,
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
      const wantAudio = currentSession.audioEnabled ?? false
      const wantVideo = currentSession.videoEnabled ?? false

      const mediaResult = await acquireUserMedia({ wantAudio, wantVideo })
      if (disposed) {
        mediaResult.stream.getTracks().forEach((t) => t.stop())
        return
      }

      localStream = mediaResult.stream
      localStreamRef.current = localStream

      initialMuted = !mediaResult.hasAudio || !wantAudio
      initialCamOff = !mediaResult.hasVideo || !wantVideo

      if (initialMuted) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = false))
      }
      if (initialCamOff) {
        localStream.getVideoTracks().forEach((t) => (t.enabled = false))
      }

      setMuted(initialMuted)
      setCamOff(initialCamOff)

      mediaResult.warnings.forEach((warning) => toast.info(warning))

      sig = new SignalingClient()
      meeting = new Meeting(localStream, (to, data) => sig?.send({ type: "signal", to, data }))
      meetingRef.current = meeting
      meeting.setLocalMediaState(initialCamOff, initialMuted)

      meeting.onChatMessage = (message) => {
        try {
          const parsed = JSON.parse(message.text)
          if (parsed.__nanomeeter_game__) {
            const gameMsg = parsed as GameSyncMessage
            if (gameMsg.type === "launch") {
              setActiveGame(gameMsg.gameId)
              setIsGameModalOpen(true)
              if (gameMsg.gameId === "tictactoe" && gameMsg.players) {
                tttRef.current.syncState({
                  players: gameMsg.players,
                  board: gameMsg.board ?? Array(9).fill(null),
                  turn: gameMsg.turn ?? "X",
                  roundStarter: gameMsg.turn ?? "X",
                  winner: null,
                  winningLine: null,
                })
                const pX = gameMsg.players?.X.name || "Player X"
                const pO = gameMsg.players?.O.name || "Player O"
                toast.info(`Tic Tac Toe: ${pX} vs ${pO}`)
              } else if (gameMsg.gameId === "tebakkata" && gameMsg.tebakKata) {
                tkRef.current.syncState(gameMsg.tebakKata)
                toast.info("Host memulai game Tebak Kata!")
              }
            } else if (gameMsg.type === "solve") {
              if (gameMsg.gameId === "tebakkata" && gameMsg.solvedBy) {
                tkRef.current.markSolvedBy(gameMsg.solvedBy)
                toast.success(`🎉 ${gameMsg.solvedBy} berhasil menebak kata!`)
              }
            } else if (gameMsg.type === "next") {
              if (gameMsg.gameId === "tebakkata" && gameMsg.tebakKata) {
                tkRef.current.syncState(gameMsg.tebakKata)
                toast.info(`Kata baru kategori ${gameMsg.tebakKata.puzzle.category}!`)
              }
            } else if (gameMsg.type === "move") {
              if (gameMsg.index !== undefined) {
                const moveResult = tttRef.current.makeMove(gameMsg.index)
                if (
                  moveResult &&
                  !isGameModalOpenRef.current &&
                  moveResult.turn === myRoleRef.current
                ) {
                  toast.info("It's your turn in Tic Tac Toe!")
                }
              }
            } else if (gameMsg.type === "reset") {
              tttRef.current.resetGame(gameMsg.turn)
            } else if (gameMsg.type === "close") {
              setActiveGame(null)
              setIsGameModalOpen(false)
              toast.info("Game session ended by host")
            }
            return
          }
        } catch {}

        setMessages((prev) => [...prev, { ...message, isSelf: false }])
        if (!isChatOpenRef.current) {
          setUnreadCount((prev) => prev + 1)
        }
      }

      meeting.onPeerMediaState = (peerId, state) => {
        setTiles((prev) =>
          prev.map((t) => {
            if (t.peerId === peerId) {
              return {
                ...t,
                camOff: state.camOff !== undefined ? state.camOff : t.camOff,
                muted: state.muted !== undefined ? state.muted : t.muted,
              }
            }
            return t
          }),
        )
      }

      meeting.onRemoteStream = (peerId, stream, isScreen) => {
        const tileId = isScreen ? `${peerId}-screen` : peerId
        const peerName = names.get(peerId) ?? "Guest"
        const displayName = isScreen ? `${peerName}'s screen` : peerName
        const peerMedia = meeting?.getPeerMediaState(peerId)

        setTiles((prev) => {
          const exists = prev.some((t) => t.peerId === tileId)
          if (exists) {
            return prev.map((t) =>
              t.peerId === tileId
                ? {
                    ...t,
                    stream,
                    camOff: isScreen ? false : peerMedia?.camOff ?? t.camOff,
                    muted: isScreen ? false : peerMedia?.muted ?? t.muted,
                  }
                : t,
            )
          }
          return [
            ...prev,
            {
              peerId: tileId,
              name: displayName,
              stream,
              isSelf: false,
              isScreen,
              camOff: isScreen ? false : peerMedia?.camOff,
              muted: isScreen ? false : peerMedia?.muted,
            },
          ]
        })
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
        currentSession.isHost
          ? { type: "create", roomId, password: currentSession.passwordHash, name: currentSession.name }
          : { type: "join", roomId, password: currentSession.passwordHash, name: currentSession.name },
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
    <div className="flex h-svh flex-col overflow-hidden">
      <RoomHeader
        roomId={roomId}
        onCopyLink={() => void copyLink()}
        onShowQr={() => setShowQr(true)}
        onLeave={leave}
      />

      {/* Sticky Host Create Games Button (only visible to host) */}
      {session?.isHost && (
        <HostGamesButton onOpen={() => setIsGameListOpen(true)} />
      )}

      {/* Active Ongoing Game Button (visible to everyone when game is active but modal is closed) */}
      {activeGame && !isGameModalOpen && (
        <ActiveGameButton
          gameId={activeGame}
          players={ttt.players}
          turn={ttt.turn}
          winner={ttt.winner}
          myRole={myRole}
          isHost={!!session?.isHost}
          extraInfo={activeGame === "tebakkata" ? tk.puzzle?.category : undefined}
          onOpen={handleOpenGameModal}
          onEndGame={session?.isHost ? handleEndGameSession : undefined}
        />
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tiles.map((tile) => (
              <VideoTile key={tile.peerId} tile={tile} />
            ))}
          </div>
          {tiles.length === 1 && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                You are the only one here. Share the link or scan the QR code to invite others.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQr(true)} className="gap-1.5">
                  <QrCode className="size-3.5" />
                  <span>Show QRIS / QR</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copyLink()}>
                  Copy link
                </Button>
              </div>
            </div>
          )}
        </main>

        {isChatOpen && (
          <ChatSidebar
            messages={messages}
            onSend={handleSendMessage}
            onClose={handleCloseChat}
          />
        )}
      </div>

      <ChatBottomSheet
        isOpen={isChatOpen}
        messages={messages}
        onSend={handleSendMessage}
        onClose={handleCloseChat}
      />

      <QrModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        roomId={roomId}
        link={joinLink(roomId)}
      />

      <GamesListModal
        isOpen={isGameListOpen}
        onClose={() => setIsGameListOpen(false)}
        onSelectGame={handleSelectGame}
      />

      <TicTacToeSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        participants={participants}
        onStart={handleStartWithPlayers}
      />

      <TicTacToeModal
        isOpen={activeGame === "tictactoe" && isGameModalOpen}
        onClose={handleCloseModal}
        onEndGame={session?.isHost ? handleEndGameSession : undefined}
        board={ttt.board}
        turn={ttt.turn}
        winner={ttt.winner}
        winningLine={ttt.winningLine}
        scores={ttt.scores}
        players={ttt.players}
        myRole={myRole}
        isHost={!!session?.isHost}
        onMove={handlePlayerMove}
        onReset={handleResetGame}
        onChangePlayers={session?.isHost ? () => { setIsGameModalOpen(false); setIsSetupOpen(true); } : undefined}
      />

      <TebakKataModal
        isOpen={activeGame === "tebakkata" && isGameModalOpen}
        onClose={handleCloseModal}
        onEndGame={session?.isHost ? handleEndGameSession : undefined}
        puzzle={tk.puzzle}
        placedLetters={tk.placedLetters}
        usedChoiceIndices={tk.usedChoiceIndices}
        isSolved={tk.isSolved}
        isIncorrect={tk.isIncorrect}
        solvedBy={tk.solvedBy}
        scores={tk.scores}
        round={tk.round}
        isHost={!!session?.isHost}
        currentUserName={session?.name ?? "You"}
        onSelectChoice={handleSelectChoice}
        onRemoveLetter={tk.removeLetter}
        onResetPlaced={tk.resetPlaced}
        onNextWord={session?.isHost ? handleNextWord : undefined}
      />

      <RoomControls
        muted={muted}
        camOff={camOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        onToggleMute={() => void toggleMute()}
        onToggleCamera={() => void toggleCamera()}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleToggleChat}
      />
    </div>
  )
}

export default Room
