import { useState, useEffect, useCallback } from 'react'
import { Player, PlayerHand, SongSubmission, GameState } from '@/types'
import { DEFAULT_GAME_CONFIG, GAME_CONSTANTS } from '@/constants'
import {
  awardPointToPlayer,
  computeFilledLyric,
  createRound,
  dealCardsToArtists,
  deriveProducerForRound,
  getHandForPlayer,
  getLatestRound,
  getPlayersForRoom,
  getRoomByCode,
  getSubmissionsForRound,
  markCardPlayed,
  pickRandomVibeCard,
  setWinner,
  submitLyricCard,
  updateRoundStatus,
  updateSubmissionWithSuno,
} from '@/utils/api'
import { computeFinalLyric, formatTime, shouldAutoSubmit, shouldMoveToGeneration } from '@/utils/gameLogic'
import { pollSunoTask, requestSunoSong } from '@/utils/suno'

const initialState: GameState = {
  gamePhase: 'loading',
  players: [],
  currentRound: 1,
  roundId: undefined,
  vibeCard: '',
  yourHand: [],
  selectedCard: null,
  filledBlanks: {},
  submissions: [],
  currentSongIndex: 0,
  isPlaying: false,
  generationProgress: 0,
  timer: DEFAULT_GAME_CONFIG.timerDuration,
  winner: null,
  loading: true,
  error: undefined,
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialState)

  const roomCode = import.meta.env.VITE_ROOM_CODE || 'AB1234'
  const currentPlayerId = import.meta.env.VITE_PLAYER_ID || ''

  const mapSubmissions = useCallback(
    (rows: (Awaited<ReturnType<typeof getSubmissionsForRound>>)) =>
      rows.map<SongSubmission>((row) => ({
        id: row.id,
        playerId: row.player_id,
        playerName: row.player?.username || 'Player',
        lyric: computeFilledLyric(row),
        handCardId: row.hand_card_id,
        songUrl: row.song_url,
        songStatus: row.song_status || undefined,
        producerRating: row.producer_rating,
        isWinner: row.is_winner,
      })),
    []
  )

  const mapPlayers = useCallback(
    (
      players: Awaited<ReturnType<typeof getPlayersForRoom>>,
      roundProducerId: string,
      submissions: SongSubmission[]
    ): Player[] =>
      players.map((p) => ({
        id: p.id,
        name: p.username,
        score: p.score ?? 0,
        isProducer: p.id === roundProducerId,
        submitted: submissions.some((s) => s.playerId === p.id),
        isYou: p.id === currentPlayerId,
      })),
    [currentPlayerId]
  )

  const derivePhase = useCallback(
    (roundStatus: string, submissions: SongSubmission[]): GameState['gamePhase'] => {
      if (submissions.some((s) => s.songStatus === 'pending' || s.songStatus === 'generating')) {
        return 'generating'
      }
      if (roundStatus === 'selecting') {
        return submissions.length > 0 ? 'listening' : 'selecting'
      }
      if (roundStatus === 'completed') return 'results'
      return 'listening'
    },
    []
  )

  const loadRoundState = useCallback(async () => {
    setGameState((prev) => ({ ...prev, loading: true, error: undefined }))
    try {
      const room = await getRoomByCode(roomCode)
      const players = await getPlayersForRoom(room.id)
      let round = await getLatestRound(room.id)

      if (!round) {
        const producer = deriveProducerForRound(players, 1)
        round = await createRound({
          game_room_id: room.id,
          round_number: 1,
          producer_id: producer.id,
          vibe_card_text: pickRandomVibeCard(),
        })
        const artistIds = players.filter((p) => p.id !== producer.id).map((p) => p.id)
        await dealCardsToArtists(round.id, artistIds, DEFAULT_GAME_CONFIG.handSize)
      }

      const [hand, submissionRows] = await Promise.all([
        currentPlayerId ? getHandForPlayer(round.id, currentPlayerId) : Promise.resolve([] as PlayerHand[]),
        getSubmissionsForRound(round.id),
      ])

      const submissions = mapSubmissions(submissionRows)
      const clientPlayers = mapPlayers(players, round.producer_id, submissions)
      const phase = derivePhase(round.status, submissions)

      setGameState((prev) => ({
        ...prev,
        gamePhase: phase,
        players: clientPlayers,
        currentRound: round.round_number,
        roundId: round.id,
        vibeCard: round.vibe_card_text,
        yourHand: hand,
        submissions,
        winner: round.winner_id,
        generationProgress: phase === 'generating' ? prev.generationProgress : 100,
        loading: false,
        timer: DEFAULT_GAME_CONFIG.timerDuration,
      }))
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load game',
      }))
    }
  }, [currentPlayerId, derivePhase, mapPlayers, mapSubmissions, roomCode])

  useEffect(() => {
    loadRoundState()
  }, [loadRoundState])

  const yourPlayer = gameState.players.find((p) => p.isYou)
  const producer = gameState.players.find((p) => p.isProducer)
  const artists = gameState.players.filter((p) => !p.isProducer)
  const submittedCount = gameState.players.filter((p) => p.submitted && !p.isProducer).length
  const totalArtists = artists.length
  const currentSong = gameState.submissions[gameState.currentSongIndex]

  // Timer countdown for UX (does not gate server state)
  useEffect(() => {
    if (gameState.gamePhase === 'selecting' && gameState.timer > 0) {
      const interval = setInterval(() => {
        setGameState((prev) => {
          if (prev.timer <= 1) {
            if (shouldAutoSubmit(prev.gamePhase, prev.timer, submittedCount, totalArtists)) {
              // Server handles auto-selection; client just drops timer to zero
            }
            return { ...prev, timer: 0 }
          }
          return { ...prev, timer: prev.timer - 1 }
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState.gamePhase, gameState.timer, submittedCount, totalArtists])

  const selectCard = useCallback((card: PlayerHand) => {
    if (!yourPlayer?.isProducer && !yourPlayer?.submitted) {
      const blanks: Record<string, string> = {}
      for (let i = 0; i < (card.blank_count || 0); i += 1) {
        blanks[i.toString()] = ''
      }
      setGameState((prev) => ({ ...prev, selectedCard: card, filledBlanks: blanks }))
    }
  }, [yourPlayer])

  const updateBlankValue = useCallback((key: string, value: string) => {
    setGameState((prev) => ({
      ...prev,
      filledBlanks: { ...prev.filledBlanks, [key]: value },
    }))
  }, [])

  const submitCard = useCallback(async () => {
    if (!gameState.selectedCard || yourPlayer?.submitted || !gameState.roundId || !currentPlayerId) return

    const filledBlanks = gameState.filledBlanks
    const submission = await submitLyricCard({
      roundId: gameState.roundId,
      playerId: currentPlayerId,
      handCard: gameState.selectedCard,
      filledBlanks,
    })

    await markCardPlayed(gameState.selectedCard.id)

    const finalLyric = computeFinalLyric(
      gameState.selectedCard.template || gameState.selectedCard.lyric_card_text,
      filledBlanks
    )

    try {
      const sunoTask = await requestSunoSong({
        vibeCardText: gameState.vibeCard,
        finalLyric,
      })

      await updateSubmissionWithSuno(submission.id, {
        suno_task_id: sunoTask.taskId,
        song_status: sunoTask.status,
        song_url: sunoTask.songUrl,
      })

      if (sunoTask.status !== 'completed') {
        const result = await pollSunoTask(sunoTask.taskId)
        await updateSubmissionWithSuno(submission.id, {
          song_status: result.status,
          song_url: result.songUrl,
          song_error: result.error,
        })
      }
    } catch (err) {
      await updateSubmissionWithSuno(submission.id, {
        song_status: 'failed',
        song_error: err instanceof Error ? err.message : 'Suno generation failed',
      })
    }

    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.isYou ? { ...p, submitted: true } : p)),
      selectedCard: null,
      filledBlanks: {},
    }))

    await loadRoundState()
  }, [currentPlayerId, gameState.selectedCard, gameState.roundId, gameState.vibeCard, gameState.filledBlanks, yourPlayer?.submitted, loadRoundState])

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
    async (playerId: string) => {
      if (!yourPlayer?.isProducer || !gameState.roundId) return
      const winningSubmission = gameState.submissions.find((s) => s.playerId === playerId)
      if (!winningSubmission || !winningSubmission.id) return

      await setWinner(gameState.roundId, winningSubmission.id, playerId)
      await awardPointToPlayer(playerId)

      setGameState((prev) => ({ ...prev, winner: playerId, gamePhase: 'results' }))
      await loadRoundState()
    },
    [gameState.roundId, gameState.submissions, loadRoundState, yourPlayer?.isProducer]
  )

  const nextRound = useCallback(async () => {
    try {
      const room = await getRoomByCode(roomCode)
      const players = await getPlayersForRoom(room.id)
      const nextRoundNumber = (gameState.currentRound || 0) + 1
      const producer = deriveProducerForRound(players, nextRoundNumber)
      const round = await createRound({
        game_room_id: room.id,
        round_number: nextRoundNumber,
        producer_id: producer.id,
        vibe_card_text: pickRandomVibeCard(),
      })
      const artistIds = players.filter((p) => p.id !== producer.id).map((p) => p.id)
      await dealCardsToArtists(round.id, artistIds, DEFAULT_GAME_CONFIG.handSize)
      await updateRoundStatus(round.id, 'selecting')
      await loadRoundState()
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to start next round',
      }))
    }
  }, [gameState.currentRound, loadRoundState, roomCode])

  useEffect(() => {
    if (shouldMoveToGeneration(gameState.gamePhase, submittedCount, totalArtists)) {
      const timeout = setTimeout(() => {
        setGameState((prev) => ({ ...prev, gamePhase: 'generating', generationProgress: 60 }))
      }, GAME_CONSTANTS.PHASE_TRANSITION_DELAY)
      return () => clearTimeout(timeout)
    }
  }, [submittedCount, gameState.gamePhase, totalArtists])

  return {
    gameState,
    yourPlayer,
    producer,
    artists,
    submittedCount,
    totalArtists,
    currentSong,
    startNewRound: loadRoundState,
    selectCard,
    updateBlankValue,
    submitCard,
    togglePlaySong,
    nextSong,
    selectWinner,
    nextRound,
    formatTime: () => formatTime(gameState.timer),
  }
}

export type UseGameStateReturn = ReturnType<typeof useGameState>
