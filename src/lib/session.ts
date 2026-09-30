export interface Session {
  roomId: string
  name: string
  passwordHash: string
  isHost: boolean
}

const key = (roomId: string) => `meetu:session:${roomId}`

export function setSession(session: Session) {
  sessionStorage.setItem(key(session.roomId), JSON.stringify(session))
}

export function getSession(roomId: string): Session | undefined {
  const raw = sessionStorage.getItem(key(roomId))
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Session
  } catch {
    return undefined
  }
}

export function clearSession(roomId: string) {
  sessionStorage.removeItem(key(roomId))
}
