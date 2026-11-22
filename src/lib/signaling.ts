import type { ChatMessage } from "@/types/chat"

export interface PeerInfo {
  peerId: string
  name: string
}

export type ServerMessage =
  | { type: "created"; peerId: string; peers: PeerInfo[] }
  | { type: "joined"; peerId: string; peers: PeerInfo[] }
  | { type: "error"; message: string }
  | { type: "peer-joined"; peerId: string; name: string }
  | { type: "peer-left"; peerId: string }
  | { type: "signal"; from: string; data: unknown }
  | { type: "chat"; from: string; message: ChatMessage }

export type ClientMessage =
  | { type: "create"; roomId: string; password: string; name: string }
  | { type: "join"; roomId: string; password: string; name: string }
  | { type: "signal"; to: string; data: unknown }
  | { type: "chat"; message: ChatMessage }

export class SignalingClient {
  private ws: WebSocket
  private listeners = new Set<(msg: ServerMessage) => void>()
  readonly ready: Promise<void>

  constructor() {
    const proto = location.protocol === "https:" ? "wss" : "ws"
    this.ws = new WebSocket(`${proto}://${location.host}/ws`)
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve(), { once: true })
      this.ws.addEventListener(
        "error",
        () => reject(new Error("signaling connection failed")),
        { once: true },
      )
    })
    this.ws.onmessage = (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage
      } catch {
        return
      }
      for (const fn of this.listeners) fn(msg)
    }
  }

  onMessage(fn: (msg: ServerMessage) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  send(msg: ClientMessage) {
    this.ws.send(JSON.stringify(msg))
  }

  close() {
    this.ws.close()
  }
}
