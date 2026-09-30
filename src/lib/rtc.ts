export type SignalData = {
  description?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

type PeerState = {
  pc: RTCPeerConnection
  makingOffer: boolean
  ignoreOffer: boolean
  polite: boolean
  stream: MediaStream
}

export class Meeting {
  private peers = new Map<string, PeerState>()
  private localStream: MediaStream
  private sendSignal: (to: string, data: SignalData) => void

  onRemoteStream: (peerId: string, stream: MediaStream) => void = () => {}
  onPeerRemoved: (peerId: string) => void = () => {}

  constructor(localStream: MediaStream, sendSignal: (to: string, data: SignalData) => void) {
    this.localStream = localStream
    this.sendSignal = sendSignal
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
      stream: new MediaStream(),
    }
    this.peers.set(peerId, peer)

    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream)
    }

    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true
        await pc.setLocalDescription()
        this.sendSignal(peerId, { description: pc.localDescription ?? undefined })
      } catch {
        // a later track change triggers negotiation again
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
      peer.stream.addTrack(event.track)
      this.onRemoteStream(peerId, peer.stream)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") pc.restartIce()
    }
  }

  async handleSignal(from: string, data: SignalData) {
    const peer = this.peers.get(from)
    if (!peer) return

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
