import { useState } from "react"
import type { BoardState, PlayerMark, TicTacToePlayers } from "@/types/game"

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export const checkWinner = (
  board: BoardState,
): { winner: PlayerMark; line: number[] } | null => {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return null
}

export const useTicTacToe = () => {
  const [players, setPlayers] = useState<TicTacToePlayers | null>(null)
  const [board, setBoard] = useState<BoardState>(() => Array(9).fill(null))
  const [turn, setTurn] = useState<PlayerMark>("X")
  const [winner, setWinner] = useState<PlayerMark | "draw" | null>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 })
  const [roundStarter, setRoundStarter] = useState<PlayerMark>("X")

  const makeMove = (index: number) => {
    if (board[index] || winner) return null

    const newBoard = [...board]
    newBoard[index] = turn
    setBoard(newBoard)

    const winResult = checkWinner(newBoard)
    if (winResult) {
      setWinner(winResult.winner)
      setWinningLine(winResult.line)
      setScores((prev) => ({
        ...prev,
        [winResult.winner]: prev[winResult.winner] + 1,
      }))
      return { board: newBoard, turn, winner: winResult.winner, line: winResult.line }
    }

    if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw")
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }))
      return { board: newBoard, turn, winner: "draw", line: null }
    }

    const nextTurn = turn === "X" ? "O" : "X"
    setTurn(nextTurn)
    return { board: newBoard, turn: nextTurn, winner: null, line: null }
  }

  const resetGame = (customStarter?: PlayerMark): PlayerMark => {
    let nextStarter: PlayerMark
    if (customStarter) {
      nextStarter = customStarter
    } else if (winner === "O") {
      // If O won, X starts the next round
      nextStarter = "X"
    } else if (winner === "X") {
      // If X won, O starts the next round
      nextStarter = "O"
    } else {
      // If draw or manual reset, alternate from previous round starter
      nextStarter = roundStarter === "X" ? "O" : "X"
    }

    setRoundStarter(nextStarter)
    setBoard(Array(9).fill(null))
    setTurn(nextStarter)
    setWinner(null)
    setWinningLine(null)
    return nextStarter
  }

  const syncState = (state: {
    players?: TicTacToePlayers
    board?: BoardState
    turn?: PlayerMark
    winner?: PlayerMark | "draw" | null
    winningLine?: number[] | null
    scores?: { X: number; O: number; ties: number }
    roundStarter?: PlayerMark
  }) => {
    if (state.players) setPlayers(state.players)
    if (state.board) setBoard(state.board)
    if (state.turn) setTurn(state.turn)
    if (state.roundStarter) setRoundStarter(state.roundStarter)
    if (state.winner !== undefined) setWinner(state.winner)
    if (state.winningLine !== undefined) setWinningLine(state.winningLine)
    if (state.scores) setScores(state.scores)
  }

  return {
    players,
    setPlayers,
    board,
    turn,
    winner,
    winningLine,
    scores,
    roundStarter,
    setRoundStarter,
    makeMove,
    resetGame,
    syncState,
  }
}
