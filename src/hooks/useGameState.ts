import { useState, useEffect, useCallback } from 'react'
import { Player, SongSubmission, GamePhase, GameState } from '@/types'
import {
  getRandomVibeCard,
  getRandomLyricCards,
  createSongSubmissions,
  rotateProducer,
  simulateOpponentSubmissions,
  shouldAutoSubmit,
  shouldMoveToGeneration,
  formatTime,
} from '@/utils'
import { DEFAULT_GAME_CONFIG, GAME_CONSTANTS } from '@/constants'

const initialState: GameState = {
  gamePhase: 'waiting',
  players: DEFAULT_GAME_CONFIG.players,
  currentRound: 1,
  vibeCard: '',
  yourHand: [],
  selectedCard: null,
  submissions: [],
  currentSongIndex: 0,
  isPlaying: false,
  generationProgress: 0,
  timer: DEFAULT_GAME_CONFIG.timerDuration,
  winner: null,
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialState)

  // Computed values
  const yourPlayer = gameState.players.find((p) => p.isYou)
  const producer = gameState.players.find((p) => p.isProducer)
  const artists = gameState.players.filter((p) => !p.isProducer)
  const submittedCount = gameState.players.filter(
    (p) => p.submitted && !p.isProducer
  ).length
  const totalArtists = artists.length
  const currentSong = gameState.submissions[gameState.currentSongIndex]

  // Initialize game
  useEffect(() => {
    if (gameState.gamePhase === 'waiting') {
      startNewRound()
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (gameState.gamePhase === 'selecting' && gameState.timer > 0) {
      const interval = setInterval(() => {
        setGameState((prev) => {
          if (prev.timer <= 1) {
            if (shouldAutoSubmit(prev.gamePhase, prev.timer, submittedCount, totalArtists)) {
              autoSubmitRemaining()
            }
            return { ...prev, timer: 0 }
          }
          return { ...prev, timer: prev.timer - 1 }
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState.gamePhase, gameState.timer, submittedCount, totalArtists])

  // Check if all artists submitted
  useEffect(() => {
    if (shouldMoveToGeneration(gameState.gamePhase, submittedCount, totalArtists)) {
      const timeout = setTimeout(() => {
        generateSongs()
      }, GAME_CONSTANTS.PHASE_TRANSITION_DELAY)
      return () => clearTimeout(timeout)
    }
  }, [submittedCount, gameState.gamePhase, totalArtists])

  const startNewRound = useCallback(() => {
    const vibe = getRandomVibeCard()
    const hand = getRandomLyricCards(DEFAULT_GAME_CONFIG.handSize)

    setGameState((prev) => ({
      ...prev,
      gamePhase: 'selecting',
      vibeCard: vibe,
      yourHand: hand,
      selectedCard: null,
      submissions: [],
      currentSongIndex: 0,
      isPlaying: false,
      timer: DEFAULT_GAME_CONFIG.timerDuration,
      winner: null,
      players: prev.players.map((p) => ({ ...p, submitted: false })),
    }))
  }, [])

  const selectCard = useCallback((card: string) => {
    if (!yourPlayer?.isProducer && !yourPlayer?.submitted) {
      setGameState((prev) => ({ ...prev, selectedCard: card }))
    }
  }, [yourPlayer])

  const submitCard = useCallback(async () => {
    if (!gameState.selectedCard || yourPlayer?.submitted) return

    // Mark as submitted
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.isYou ? { ...p, submitted: true } : p)),
    }))

    // Simulate other players submitting
    const updatedPlayers = await simulateOpponentSubmissions(gameState.players)
    setGameState((prev) => ({ ...prev, players: updatedPlayers }))
  }, [gameState.selectedCard, yourPlayer?.submitted, gameState.players])

  const autoSubmitRemaining = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (!p.isProducer ? { ...p, submitted: true } : p)),
    }))
  }, [])

  const generateSongs = useCallback(() => {
    setGameState((prev) => ({ ...prev, gamePhase: 'generating', generationProgress: 0 }))

    let progress = 0
    const interval = setInterval(() => {
      progress += GAME_CONSTANTS.GENERATION_INCREMENT
      if (progress >= 100) {
        clearInterval(interval)
        const submissions = createSongSubmissions(artists, gameState.selectedCard)
        setGameState((prev) => ({
          ...prev,
          submissions,
          gamePhase: 'listening',
          generationProgress: 100,
        }))
      } else {
        setGameState((prev) => ({ ...prev, generationProgress: progress }))
      }
    }, GAME_CONSTANTS.GENERATION_INTERVAL)
  }, [artists, gameState.selectedCard])

  const togglePlaySong = useCallback(() => {
    setGameState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [])

  const nextSong = useCallback(() => {
    if (gameState.currentSongIndex < gameState.submissions.length - 1) {
      setGameState((prev) => ({
        ...prev,
        currentSongIndex: prev.currentSongIndex + 1,
        isPlaying: false,
      }))
    }
  }, [gameState.currentSongIndex, gameState.submissions.length])

  const selectWinner = useCallback(
    (playerId: number) => {
      if (!yourPlayer?.isProducer) return

      setGameState((prev) => ({
        ...prev,
        winner: playerId,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, score: p.score + 1 } : p
        ),
        gamePhase: 'results',
      }))
    },
    [yourPlayer?.isProducer]
  )

  const nextRound = useCallback(() => {
    const rotatedPlayers = rotateProducer(gameState.players)
    setGameState((prev) => ({
      ...prev,
      players: rotatedPlayers,
      currentRound: prev.currentRound + 1,
    }))
    startNewRound()
  }, [gameState.players, startNewRound])

  return {
    // State
    gameState,
    yourPlayer,
    producer,
    artists,
    submittedCount,
    totalArtists,
    currentSong,

    // Actions
    startNewRound,
    selectCard,
    submitCard,
    togglePlaySong,
    nextSong,
    selectWinner,
    nextRound,

    // Utilities
    formatTime: () => formatTime(gameState.timer),
  }
}

export type UseGameStateReturn = ReturnType<typeof useGameState>