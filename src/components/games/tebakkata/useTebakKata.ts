import { useCallback, useState } from "react"
import type { TebakKataSyncPayload, WordCategory, WordPuzzle } from "@/types/wordguess"
import { generateWordPuzzle } from "./wordBank"

export const useTebakKata = () => {
  const [puzzle, setPuzzle] = useState<WordPuzzle | null>(null)
  const [placedLetters, setPlacedLetters] = useState<
    Record<number, { letter: string; choiceIndex: number }>
  >({})
  const [isSolved, setIsSolved] = useState(false)
  const [isIncorrect, setIsIncorrect] = useState(false)
  const [solvedBy, setSolvedBy] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [round, setRound] = useState(1)

  const usedChoiceIndices = Object.values(placedLetters).map((p) => p.choiceIndex)

  const selectChoice = (choiceIndex: number): { solved: boolean; word: string } | null => {
    if (!puzzle || isSolved) return null

    // Find the next empty blank index
    const emptyBlankIndex = puzzle.blankIndices.find((idx) => !placedLetters[idx])
    if (emptyBlankIndex === undefined) return null

    const letter = puzzle.choices[choiceIndex]
    const nextPlaced = {
      ...placedLetters,
      [emptyBlankIndex]: { letter, choiceIndex },
    }
    setPlacedLetters(nextPlaced)
    setIsIncorrect(false)

    // Check if all blanks are filled
    const allFilled = puzzle.blankIndices.every((idx) => !!nextPlaced[idx])
    if (allFilled) {
      // Reconstruct word
      const formedWord = puzzle.word
        .split("")
        .map((ch, idx) => (nextPlaced[idx] ? nextPlaced[idx].letter : ch))
        .join("")

      if (formedWord === puzzle.word) {
        setIsSolved(true)
        setIsIncorrect(false)
        return { solved: true, word: puzzle.word }
      } else {
        setIsIncorrect(true)
        return { solved: false, word: puzzle.word }
      }
    }

    return null
  }

  const removeLetter = (blankIndex: number) => {
    if (isSolved) return
    setPlacedLetters((prev) => {
      const copy = { ...prev }
      delete copy[blankIndex]
      return copy
    })
    setIsIncorrect(false)
  }

  const resetPlaced = () => {
    if (isSolved) return
    setPlacedLetters({})
    setIsIncorrect(false)
  }

  const initRound = useCallback(
    (category?: WordCategory): WordPuzzle => {
      const newPuzzle = generateWordPuzzle(category)
      setPuzzle(newPuzzle)
      setPlacedLetters({})
      setIsSolved(false)
      setIsIncorrect(false)
      setSolvedBy(null)
      setRound((prev) => prev + 1)
      return newPuzzle
    },
    [],
  )

  const syncState = useCallback((payload: TebakKataSyncPayload) => {
    setPuzzle(payload.puzzle)
    setRound(payload.round)
    setPlacedLetters({})
    setIsSolved(!!payload.solvedBy)
    setIsIncorrect(false)
    if (payload.solvedBy) {
      setSolvedBy(payload.solvedBy)
    }
    if (payload.scores) {
      setScores(payload.scores)
    }
  }, [])

  const markSolvedBy = useCallback((winnerName: string) => {
    setIsSolved(true)
    setSolvedBy(winnerName)
    setScores((prev) => ({
      ...prev,
      [winnerName]: (prev[winnerName] ?? 0) + 1,
    }))
  }, [])

  return {
    puzzle,
    setPuzzle,
    placedLetters,
    usedChoiceIndices,
    isSolved,
    isIncorrect,
    solvedBy,
    scores,
    round,
    selectChoice,
    removeLetter,
    resetPlaced,
    initRound,
    syncState,
    markSolvedBy,
  }
}
