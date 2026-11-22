import wordsData from "@/data/tebakKataWords.json"
import type { WordCategory, WordPuzzle } from "@/types/wordguess"

export const CATEGORIES: { id: WordCategory; label: string; icon: string }[] = [
  { id: "benda", label: "Benda", icon: "📦" },
  { id: "hewan", label: "Hewan", icon: "🦁" },
  { id: "negara", label: "Negara", icon: "🌍" },
  { id: "transportasi", label: "Transportasi", icon: "🚀" },
]

export const WORD_BANK: Record<WordCategory, string[]> = wordsData as Record<WordCategory, string[]>

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// Keep track of recently used words to prevent immediate repeats
const recentWords: string[] = []
const MAX_RECENT_WORDS = 25

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export const generateWordPuzzle = (
  preferredCategory?: WordCategory,
  customWord?: string,
): WordPuzzle => {
  // If no category specified, pick a random category
  const category: WordCategory =
    preferredCategory ??
    CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id

  const categoryWords = WORD_BANK[category] ?? []

  // Filter out recently used words if possible to maximize variety
  const freshWords = categoryWords.filter((w) => !recentWords.includes(w))
  const pool = freshWords.length > 5 ? freshWords : categoryWords

  const selectedRaw = customWord ?? pool[Math.floor(Math.random() * pool.length)]
  const word = selectedRaw.toUpperCase().trim()

  // Track in recentWords
  recentWords.push(word)
  if (recentWords.length > MAX_RECENT_WORDS) {
    recentWords.shift()
  }

  const len = word.length

  // Candidates for blanks: letters from index 1 to len-1 (skip spaces and keep index 0 as clue)
  const candidateIndices: number[] = []
  for (let i = 1; i < len; i++) {
    if (word[i] !== " ") {
      candidateIndices.push(i)
    }
  }

  // Huruf yang hilang bisa 2 bisa juga 3 huruf
  let numBlanks = Math.random() < 0.5 ? 2 : 3
  if (candidateIndices.length < 3) {
    numBlanks = Math.min(2, candidateIndices.length)
  }

  const shuffledCandidates = shuffle(candidateIndices)
  const blankIndices = shuffledCandidates
    .slice(0, Math.min(numBlanks, candidateIndices.length))
    .sort((a, b) => a - b)

  // Construct masked array
  const maskedLetters: (string | null)[] = word.split("").map((ch, idx) => {
    if (ch === " ") return " "
    return blankIndices.includes(idx) ? null : ch
  })

  // Missing letters that player must fill
  const missingLetters = blankIndices.map((idx) => word[idx])

  // Generate exactly 6 choices: missing letters + random distractors
  const choices: string[] = [...missingLetters]

  // Filter alphabet to prefer distractors not already in missing letters
  const distractorPool = ALPHABET.split("").filter((letter) => !missingLetters.includes(letter))
  const shuffledDistractors = shuffle(distractorPool)

  let distractorIdx = 0
  while (choices.length < 6) {
    if (distractorIdx < shuffledDistractors.length) {
      choices.push(shuffledDistractors[distractorIdx])
      distractorIdx++
    } else {
      choices.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
    }
  }

  return {
    id: `puzzle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    word,
    maskedLetters,
    blankIndices,
    choices: shuffle(choices),
  }
}
