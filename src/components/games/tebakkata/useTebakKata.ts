import { useCallback, useState } from "react"
import type {
  TebakKataConfig,
  TebakKataPlayerAnswer,
  TebakKataSyncPayload,
  TebakKataStatus,
  WordPuzzle,
} from "@/types/wordguess"
import { generateWordPuzzle } from "./wordBank"

const DEFAULT_CONFIG: TebakKataConfig = {
  category: "auto",
  totalRounds: 10,
  roundDuration: 10,
}

export const useTebakKata = () => {
  const [config, setConfig] = useState<TebakKataConfig>(DEFAULT_CONFIG)
  const [puzzle, setPuzzle] = useState<WordPuzzle | null>(null)
  const [placedLetters, setPlacedLetters] = useState<
    Record<number, { letter: string; choiceIndex: number }>
  >({})
  const [isSolved, setIsSolved] = useState(false)
  const [isIncorrect, setIsIncorrect] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [myAnswer, setMyAnswer] = useState<TebakKataPlayerAnswer | null>(null)
  const [answeredPlayers, setAnsweredPlayers] = useState<
    Record<string, TebakKataPlayerAnswer>
  >({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [round, setRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(10)
  const [roundDuration, setRoundDuration] = useState(10)
  const [roundStartedAt, setRoundStartedAt] = useState<number>(() => Date.now())
  const [status, setStatus] = useState<TebakKataStatus>("playing")

  const usedChoiceIndices = Object.values(placedLetters).map((p) => p.choiceIndex)

  const selectChoice = (
    choiceIndex: number,
    currentUserName: string,
    timeLeft: number,
  ): {
    completed: boolean
    isCorrect: boolean
    word: string
    answer: TebakKataPlayerAnswer
  } | null => {
    if (!puzzle || hasAnswered || status !== "playing") return null

    const emptyBlankIndex = puzzle.blankIndices.find((idx) => !placedLetters[idx])
    if (emptyBlankIndex === undefined) return null

    const letter = puzzle.choices[choiceIndex]
    const nextPlaced = {
      ...placedLetters,
      [emptyBlankIndex]: { letter, choiceIndex },
    }
    setPlacedLetters(nextPlaced)
    setIsIncorrect(false)

    // Check if all blanks filled
    const allFilled = puzzle.blankIndices.every((idx) => !!nextPlaced[idx])
    if (allFilled) {
      const formedWord = puzzle.word
        .split("")
        .map((ch, idx) => (nextPlaced[idx] ? nextPlaced[idx].letter : ch))
        .join("")

      const isCorrect = formedWord === puzzle.word
      const timeTaken = Math.max(1, roundDuration - timeLeft)
      // Faster answer -> higher points (100 base + remaining seconds * 10)
      const pointsEarned = isCorrect ? 100 + Math.max(0, timeLeft) * 10 : 0

      const answer: TebakKataPlayerAnswer = {
        playerName: currentUserName,
        isCorrect,
        pointsEarned,
        timeTaken,
      }

      setHasAnswered(true)
      setMyAnswer(answer)
      setIsSolved(isCorrect)
      setIsIncorrect(!isCorrect)

      setAnsweredPlayers((prev) => ({
        ...prev,
        [currentUserName]: answer,
      }))

      if (isCorrect) {
        setScores((prev) => ({
          ...prev,
          [currentUserName]: (prev[currentUserName] ?? 0) + pointsEarned,
        }))
      }

      return {
        completed: true,
        isCorrect,
        word: puzzle.word,
        answer,
      }
    }

    return null
  }

  const handleTimeout = (currentUserName: string): TebakKataPlayerAnswer | null => {
    if (hasAnswered || status !== "playing" || !puzzle) return null

    const answer: TebakKataPlayerAnswer = {
      playerName: currentUserName,
      isCorrect: false,
      pointsEarned: 0,
      timeTaken: roundDuration,
    }

    setHasAnswered(true)
    setMyAnswer(answer)
    setIsSolved(false)
    setIsIncorrect(true)

    setAnsweredPlayers((prev) => ({
      ...prev,
      [currentUserName]: answer,
    }))

    return answer
  }

  const removeLetter = (blankIndex: number) => {
    if (hasAnswered || status !== "playing") return
    setPlacedLetters((prev) => {
      const copy = { ...prev }
      delete copy[blankIndex]
      return copy
    })
    setIsIncorrect(false)
  }

  const resetPlaced = () => {
    if (hasAnswered || status !== "playing") return
    setPlacedLetters({})
    setIsIncorrect(false)
  }

  const startNewGame = useCallback((gameConfig: TebakKataConfig) => {
    setConfig(gameConfig)
    setTotalRounds(gameConfig.totalRounds)
    setRoundDuration(gameConfig.roundDuration)
    setScores({})
    setRound(1)

    const preferredCategory =
      gameConfig.category === "auto" ? undefined : gameConfig.category
    const newPuzzle = generateWordPuzzle(preferredCategory)

    setPuzzle(newPuzzle)
    setPlacedLetters({})
    setIsSolved(false)
    setIsIncorrect(false)
    setHasAnswered(false)
    setMyAnswer(null)
    setAnsweredPlayers({})
    const now = Date.now()
    setRoundStartedAt(now)
    setStatus("playing")

    const payload: TebakKataSyncPayload = {
      config: gameConfig,
      puzzle: newPuzzle,
      round: 1,
      totalRounds: gameConfig.totalRounds,
      roundDuration: gameConfig.roundDuration,
      roundStartedAt: now,
      status: "playing",
      answeredPlayers: {},
      scores: {},
    }
    return payload
  }, [])

  const advanceToNextRound = useCallback(
    (nextRoundNum: number): TebakKataSyncPayload => {
      setRound(nextRoundNum)
      const preferredCategory = config.category === "auto" ? undefined : config.category
      const newPuzzle = generateWordPuzzle(preferredCategory)

      setPuzzle(newPuzzle)
      setPlacedLetters({})
      setIsSolved(false)
      setIsIncorrect(false)
      setHasAnswered(false)
      setMyAnswer(null)
      setAnsweredPlayers({})
      const now = Date.now()
      setRoundStartedAt(now)
      setStatus("playing")

      return {
        config,
        puzzle: newPuzzle,
        round: nextRoundNum,
        totalRounds,
        roundDuration,
        roundStartedAt: now,
        status: "playing",
        answeredPlayers: {},
        scores,
      }
    },
    [config, roundDuration, scores, totalRounds],
  )

  const recordPlayerAnswer = useCallback(
    (answer: TebakKataPlayerAnswer) => {
      setAnsweredPlayers((prev) => ({
        ...prev,
        [answer.playerName]: answer,
      }))
      if (answer.isCorrect && answer.pointsEarned > 0) {
        setScores((prev) => ({
          ...prev,
          [answer.playerName]: (prev[answer.playerName] ?? 0) + answer.pointsEarned,
        }))
      }
    },
    [],
  )

  const syncState = useCallback((payload: TebakKataSyncPayload, currentUserName?: string) => {
    setConfig(payload.config)
    setPuzzle(payload.puzzle)
    setRound(payload.round)
    setTotalRounds(payload.totalRounds)
    setRoundDuration(payload.roundDuration)
    setRoundStartedAt(payload.roundStartedAt)
    setStatus(payload.status)

    if (payload.scores) {
      setScores(payload.scores)
    }

    if (payload.answeredPlayers) {
      setAnsweredPlayers(payload.answeredPlayers)
      if (currentUserName && payload.answeredPlayers[currentUserName]) {
        const myAns = payload.answeredPlayers[currentUserName]
        setMyAnswer(myAns)
        setHasAnswered(true)
        setIsSolved(myAns.isCorrect)
        setIsIncorrect(!myAns.isCorrect)
      } else if (payload.status === "playing") {
        // Reset for the new round
        setPlacedLetters({})
        setHasAnswered(false)
        setMyAnswer(null)
        setIsSolved(false)
        setIsIncorrect(false)
      }
    }
  }, [])

  return {
    config,
    puzzle,
    placedLetters,
    usedChoiceIndices,
    isSolved,
    isIncorrect,
    hasAnswered,
    myAnswer,
    answeredPlayers,
    scores,
    round,
    totalRounds,
    roundDuration,
    roundStartedAt,
    status,
    setStatus,
    selectChoice,
    handleTimeout,
    removeLetter,
    resetPlaced,
    startNewGame,
    advanceToNextRound,
    recordPlayerAnswer,
    syncState,
  }
}
