export type WordCategory = "benda" | "hewan" | "negara" | "transportasi"

export interface WordPuzzle {
  id: string
  category: WordCategory
  word: string
  maskedLetters: (string | null)[]
  blankIndices: number[]
  choices: string[]
}

export interface TebakKataSyncPayload {
  puzzle: WordPuzzle
  round: number
  solvedBy?: string | null
  scores?: Record<string, number>
}
