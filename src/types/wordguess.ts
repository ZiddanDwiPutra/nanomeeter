export type WordCategory = "benda" | "hewan" | "negara" | "transportasi"

export interface WordPuzzle {
  id: string
  category: WordCategory
  word: string
  maskedLetters: (string | null)[]
  blankIndices: number[]
  choices: string[]
}

export interface TebakKataConfig {
  category: WordCategory | "auto"
  totalRounds: number
  roundDuration: number
}

export interface TebakKataPlayerAnswer {
  playerName: string
  isCorrect: boolean
  pointsEarned: number
  timeTaken: number
}

export type TebakKataStatus = "setup" | "playing" | "round_result" | "game_over"

export interface TebakKataSyncPayload {
  config: TebakKataConfig
  puzzle: WordPuzzle
  round: number
  totalRounds: number
  roundDuration: number
  roundStartedAt: number
  status: TebakKataStatus
  answeredPlayers?: Record<string, TebakKataPlayerAnswer>
  scores?: Record<string, number>
  solvedBy?: string | null
}
