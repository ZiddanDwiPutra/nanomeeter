export interface Session {
  roomId: string
  name: string
  passwordHash: string
  isHost: boolean
  audioEnabled?: boolean
  videoEnabled?: boolean
}

const key = (roomId: string) => `nanomeeter:session:${roomId}`

export const setSession = (session: Session) => {
  sessionStorage.setItem(key(session.roomId), JSON.stringify(session))
}

export const getSession = (roomId: string): Session | undefined => {
  const raw = sessionStorage.getItem(key(roomId))
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Session
  } catch {
    return undefined
  }
}

export const clearSession = (roomId: string) => {
  sessionStorage.removeItem(key(roomId))
}
