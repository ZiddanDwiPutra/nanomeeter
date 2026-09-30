export interface Session {
  roomId: string
  name: string
  passwordHash: string
  isHost: boolean
}

const sessions = new Map<string, Session>()

export function setSession(session: Session) {
  sessions.set(session.roomId, session)
}

export function getSession(roomId: string): Session | undefined {
  return sessions.get(roomId)
}

export function clearSession(roomId: string) {
  sessions.delete(roomId)
}
