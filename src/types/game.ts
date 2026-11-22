import type { TebakKataSyncPayload } from "./wordguess"

export type PlayerMark = "X" | "O"
export type BoardState = (PlayerMark | null)[]

export interface GameParticipant {
  id: string
  name: string
  isSelf?: boolean
}

export interface TicTacToePlayers {
  X: GameParticipant
  O: GameParticipant
}

export interface GameSyncMessage {
  __nanomeeter_game__: true
  type: "launch" | "move" | "reset" | "close" | "solve" | "next"
  gameId: string
  players?: TicTacToePlayers
  board?: BoardState
  turn?: PlayerMark
  winner?: PlayerMark | "draw" | null
  scores?: { X: number; O: number; ties: number }
  winningLine?: number[] | null
  index?: number
  player?: PlayerMark
  tebakKata?: TebakKataSyncPayload
  solvedBy?: string
}
