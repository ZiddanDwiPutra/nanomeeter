export type SignalData = {
  description?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  screenShare?: boolean
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
}

export class Meeting {
  private peers = new Map<string, PeerState>()
  private localStream: MediaStream
  private screenStream: MediaStream | null = null
  private sendSignal: (to: string, data: SignalData) => void

  onRemoteStream: (peerId: string, stream: MediaStream, isScreen: boolean) => void = () => {}
  onRemoteStreamRemoved: (peerId: string, isScreen: boolean) => void = () => {}
  onPeerRemoved: (peerId: string) => void = () => {}

  constructor(localStream: MediaStream, sendSignal: (to: string, data: SignalData) => void) {
    this.localStream = localStream
    this.sendSignal = sendSignal
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
    }
    this.peers.set(peerId, peer)

    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream)
    }

    if (this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        pc.addTrack(track, this.screenStream)
      }
    }

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
  }

  async handleSignal(from: string, data: SignalData) {
    const peer = this.peers.get(from)
    if (!peer) return

    if (data.screenShare === false) {
      peer.screenStream = null
      peer.screenStreamId = null
      this.onRemoteStreamRemoved(from, true)
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
        if (data.description.type === "offer") {
          await pc.setLocalDescription()
          this.sendSignal(from, { description: pc.localDescription ?? undefined })
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(data.candidate)
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
    this.onPeerRemoved(peerId)
  }

  close() {
    for (const peerId of [...this.peers.keys()]) this.removePeer(peerId)
  }
}
