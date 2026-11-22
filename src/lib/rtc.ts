import type { ChatMessage } from "@/types/chat"

export type SignalData = {
  description?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  screenShare?: boolean
  camOff?: boolean
  muted?: boolean
}

type PeerState = {
  pc: RTCPeerConnection
  makingOffer: boolean
  ignoreOffer: boolean
  polite: boolean
  mainStream: MediaStream
  mainStreamId: string | null
  screenStream: MediaStream | null
  screenStreamId: string | null
  dataChannel: RTCDataChannel | null
  pendingCandidates: RTCIceCandidateInit[]
}

export class Meeting {
  private peers = new Map<string, PeerState>()
  private peerMediaStates = new Map<string, { camOff?: boolean; muted?: boolean }>()
  private localCamOff = false
  private localMuted = false
  private localStream: MediaStream
  private screenStream: MediaStream | null = null
  private sendSignal: (to: string, data: SignalData) => void

  onRemoteStream: (peerId: string, stream: MediaStream, isScreen: boolean) => void = () => {}
  onRemoteStreamRemoved: (peerId: string, isScreen: boolean) => void = () => {}
  onPeerRemoved: (peerId: string) => void = () => {}
  onChatMessage: (message: ChatMessage) => void = () => {}
  onPeerMediaState: (peerId: string, state: { camOff?: boolean; muted?: boolean }) => void = () => {}

  constructor(localStream: MediaStream, sendSignal: (to: string, data: SignalData) => void) {
    this.localStream = localStream
    this.sendSignal = sendSignal
  }

  addLocalTrack(track: MediaStreamTrack) {
    this.localStream.addTrack(track)
    for (const peer of this.peers.values()) {
      const transceiver = peer.pc
        .getTransceivers()
        .find((t) => t.receiver.track.kind === track.kind)
      if (transceiver && transceiver.sender.track === null) {
        transceiver.direction = "sendrecv"
        void transceiver.sender.replaceTrack(track)
      } else {
        peer.pc.addTrack(track, this.localStream)
      }
    }
  }

  setLocalMediaState(camOff: boolean, muted: boolean) {
    this.localCamOff = camOff
    this.localMuted = muted
    for (const peerId of this.peers.keys()) {
      this.sendSignal(peerId, { camOff, muted })
    }
  }

  getPeerMediaState(peerId: string) {
    return this.peerMediaStates.get(peerId)
  }

  getPeerStream(peerId: string): MediaStream | undefined {
    return this.peers.get(peerId)?.mainStream
  }

  sendChatMessage(message: ChatMessage) {
    const raw = JSON.stringify(message)
    for (const peer of this.peers.values()) {
      if (peer.dataChannel && peer.dataChannel.readyState === "open") {
        peer.dataChannel.send(raw)
      }
    }
  }

  setScreenStream(screenStream: MediaStream | null) {
    this.screenStream = screenStream
    for (const [peerId, peer] of this.peers.entries()) {
      if (screenStream) {
        for (const track of screenStream.getTracks()) {
          peer.pc.addTrack(track, screenStream)
        }
        this.sendSignal(peerId, { screenShare: true })
      } else {
        const senders = peer.pc.getSenders()
        for (const sender of senders) {
          if (sender.track && !this.localStream.getTracks().includes(sender.track)) {
            peer.pc.removeTrack(sender)
          }
        }
        this.sendSignal(peerId, { screenShare: false })
      }
    }
  }

  addPeer(peerId: string, polite: boolean) {
    if (this.peers.has(peerId)) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
    const peer: PeerState = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      polite,
      mainStream: new MediaStream(),
      mainStreamId: null,
      screenStream: null,
      screenStreamId: null,
      dataChannel: null,
      pendingCandidates: [],
    }
    this.peers.set(peerId, peer)

    // Handlers attached BEFORE adding tracks/channels to avoid missing events
    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true
        await pc.setLocalDescription()
        this.sendSignal(peerId, { description: pc.localDescription ?? undefined })
      } catch {
      } finally {
        peer.makingOffer = false
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, { candidate: event.candidate.toJSON() })
      }
    }

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0]
      if (!incomingStream) {
        peer.mainStream.addTrack(event.track)
        this.onRemoteStream(peerId, peer.mainStream, false)
        return
      }

      if (!peer.mainStreamId) {
        peer.mainStreamId = incomingStream.id
      }

      if (incomingStream.id === peer.mainStreamId) {
        peer.mainStream.addTrack(event.track)
        this.onRemoteStream(peerId, peer.mainStream, false)
      } else {
        if (!peer.screenStream) {
          peer.screenStream = new MediaStream()
        }
        peer.screenStreamId = incomingStream.id
        peer.screenStream.addTrack(event.track)
        this.onRemoteStream(peerId, peer.screenStream, true)

        event.track.onended = () => {
          peer.screenStream = null
          peer.screenStreamId = null
          this.onRemoteStreamRemoved(peerId, true)
        }
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") pc.restartIce()
    }

    const setupDataChannel = (dc: RTCDataChannel) => {
      peer.dataChannel = dc
      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ChatMessage
          this.onChatMessage(msg)
        } catch {
          // ignore invalid message
        }
      }
      dc.onclose = () => {
        if (peer.dataChannel === dc) peer.dataChannel = null
      }
    }

    if (!polite) {
      const dc = pc.createDataChannel("chat")
      setupDataChannel(dc)
    }

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel)
    }

    const audioTracks = this.localStream.getAudioTracks()
    if (audioTracks.length > 0) {
      for (const track of audioTracks) {
        pc.addTrack(track, this.localStream)
      }
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" })
    }

    const videoTracks = this.localStream.getVideoTracks()
    if (videoTracks.length > 0) {
      for (const track of videoTracks) {
        pc.addTrack(track, this.localStream)
      }
    } else {
      pc.addTransceiver("video", { direction: "recvonly" })
    }

    if (this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        pc.addTrack(track, this.screenStream)
      }
    }

    this.sendSignal(peerId, { camOff: this.localCamOff, muted: this.localMuted })
  }

  async handleSignal(from: string, data: SignalData) {
    const peer = this.peers.get(from)
    if (!peer) return

    if (data.screenShare === false) {
      peer.screenStream = null
      peer.screenStreamId = null
      this.onRemoteStreamRemoved(from, true)
    }

    if (data.camOff !== undefined || data.muted !== undefined) {
      const prev = this.peerMediaStates.get(from) ?? {}
      const updated = {
        camOff: data.camOff !== undefined ? data.camOff : prev.camOff,
        muted: data.muted !== undefined ? data.muted : prev.muted,
      }
      this.peerMediaStates.set(from, updated)
      this.onPeerMediaState(from, updated)
    }

    const { pc } = peer
    try {
      if (data.description) {
        const offerCollision =
          data.description.type === "offer" &&
          (peer.makingOffer || pc.signalingState !== "stable")
        peer.ignoreOffer = !peer.polite && offerCollision
        if (peer.ignoreOffer) return

        await pc.setRemoteDescription(data.description)

        if (peer.pendingCandidates.length > 0) {
          for (const cand of peer.pendingCandidates) {
            await pc.addIceCandidate(cand).catch(() => {})
          }
          peer.pendingCandidates = []
        }

        if (data.description.type === "offer") {
          await pc.setLocalDescription()
          this.sendSignal(from, { description: pc.localDescription ?? undefined })
        }
      } else if (data.candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(data.candidate).catch(() => {})
        } else {
          peer.pendingCandidates.push(data.candidate)
        }
      }
    } catch {
      if (!peer.ignoreOffer) console.error("failed to handle signal from", from)
    }
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId)
    if (!peer) return
    peer.pc.close()
    this.peers.delete(peerId)
    this.peerMediaStates.delete(peerId)
    this.onPeerRemoved(peerId)
  }

  close() {
    for (const peerId of [...this.peers.keys()]) this.removePeer(peerId)
  }
}
