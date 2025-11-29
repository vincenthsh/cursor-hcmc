import { useState, useEffect, useCallback } from 'react'
import { Player, PlayerHand, SongSubmission, GameState } from '@/types'
import { DEFAULT_GAME_CONFIG, GAME_CONSTANTS } from '@/constants'
import {
  awardPointToPlayer,
  computeFilledLyric,
  deletePlayer,
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
  pauseGame as pauseRoom,
  resumeGame as resumeRoom,
  updatePlayerActivity,
  updateListeningState,
} from '@/utils/api'
import { computeFinalLyric, formatTime, shouldAutoSubmit, shouldMoveToGeneration } from '@/utils/gameLogic'
import { getSunoConfig, isSunoConfigured } from '@/config/suno'
import SunoApiService, { SunoApiError } from '@/services/sunoApi'

const initialState: GameState = {
  gamePhase: 'waiting',
  roomId: undefined,
  hostPlayerId: undefined,
  players: [],
  currentRound: 1,
  roundId: undefined,
  vibeCard: '',
  isPaused: false,
  yourHand: [],
  selectedCard: null,
  filledBlanks: {},
  submissions: [],
  currentSongIndex: 0,
  isPlaying: false,
  listeningCueAt: null,
  generationProgress: 0,
  timer: DEFAULT_GAME_CONFIG.timerDuration,
  winner: null,
  loading: true,
  error: undefined,
}

const INACTIVITY_THRESHOLD_MS = 3 * 60 * 1000
const POLL_INTERVAL_ACTIVE = 2500
const POLL_INTERVAL_PAUSED = 5000

// Initialize SunoApiService if configured
const sunoApiService = isSunoConfigured() ? new SunoApiService(getSunoConfig()) : null

export const useGameState = (
  roomCode?: string,
  playerId?: string
) => {
  const [gameState, setGameState] = useState<GameState>(initialState)

  // Use provided params, fall back to env vars for backwards compatibility in dev
  const effectiveRoomCode = roomCode || import.meta.env.VITE_ROOM_CODE || 'AB1234'
  const effectivePlayerId = playerId || import.meta.env.VITE_PLAYER_ID || ''
  const currentPlayerId = effectivePlayerId

  const mapSubmissions = useCallback((rows: (Awaited<ReturnType<typeof getSubmissionsForRound>>)) =>
    rows.map<SongSubmission>((row) => ({
      id: row.id,
      playerId: row.player_id,
      playerName: row.player?.username || 'Player',
      lyric: computeFilledLyric(row),
      audioUrl: row.song_url,
      streamAudioUrl: row.song_url, // For now using same URL for both
      imageUrl: undefined,
      taskId: row.suno_task_id,
      duration: undefined,
      title: `${row.player?.username || 'Player'} - Song`,
      songStatus: row.song_status || undefined,
      isWinner: row.is_winner,
    })),
  [])

  const mapPlayers = useCallback((
    players: Awaited<ReturnType<typeof getPlayersForRoom>>,
    roundProducerId: string,
    submissions: SongSubmission[]
  ): Player[] =>
    players.map((p) => {
      const lastActive = p.last_active_at ? new Date(p.last_active_at).getTime() : 0
      const inactive = lastActive > 0 ? Date.now() - lastActive > INACTIVITY_THRESHOLD_MS : false
      return {
        id: p.id,
        name: p.username,
        score: p.score ?? 0,
        isProducer: p.id === roundProducerId,
        submitted: submissions.some((s) => s.playerId === p.id),
        isYou: p.id === currentPlayerId,
        joinOrder: p.join_order,
        lastActiveAt: p.last_active_at ?? undefined,
        isInactive: inactive,
      }
    }),
  [currentPlayerId])

  const derivePhase = useCallback(
    (
      roundStatus: string,
      submissions: SongSubmission[],
      totalArtists: number
    ): GameState['gamePhase'] => {
      if (submissions.some((s) => s.songStatus === 'pending' || s.songStatus === 'generating')) {
        return 'generating'
      }
      if (roundStatus === 'selecting') {
        // Only move to listening when ALL artists have submitted
        const submittedCount = submissions.length
        return submittedCount === totalArtists ? 'listening' : 'selecting'
      }
      if (roundStatus === 'completed') return 'results'
      return 'listening'
    },
    []
  )

  const loadRoundState = useCallback(async (options?: { silent?: boolean }) => {
    setGameState((prev) => ({ ...prev, loading: options?.silent ? prev.loading : true, error: undefined }))
    try {
      const room = await getRoomByCode(effectiveRoomCode)
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
        currentPlayerId ? getHandForPlayer(round.id, currentPlayerId).then(h => h as PlayerHand[]) : Promise.resolve([] as PlayerHand[]),
        getSubmissionsForRound(round.id),
      ])

      const submissions = mapSubmissions(submissionRows)
      const clientPlayers = mapPlayers(players, round.producer_id, submissions)
      const totalArtistsInRound = players.filter((p) => p.id !== round.producer_id).length
      const phase = derivePhase(round.status, submissions, totalArtistsInRound)
      const hostId = players[0]?.id

      setGameState((prev) => {
        // Only reset timer when phase changes (not during polling in same phase)
        const phaseChanged = prev.gamePhase !== phase
        const shouldResetTimer = phaseChanged && phase === 'selecting'

        return {
          ...prev,
          roomId: room.id,
          hostPlayerId: hostId,
          gamePhase: phase,
          isPaused: room.is_paused,
          players: clientPlayers,
          currentRound: round.round_number,
          roundId: round.id,
          vibeCard: round.vibe_card_text,
          yourHand: hand,
          submissions,
          currentSongIndex: round.listening_song_index ?? 0,
          isPlaying: round.listening_is_playing ?? false,
          listeningCueAt: round.listening_cue_at,
          winner: round.winner_id,
          generationProgress: phase === 'generating' ? prev.generationProgress : 100,
          loading: false,
          // Only reset timer when entering selecting phase, otherwise preserve local timer
          timer: shouldResetTimer ? DEFAULT_GAME_CONFIG.timerDuration : prev.timer,
        }
      })
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load game',
      }))
    }
  }, [currentPlayerId, derivePhase, mapPlayers, mapSubmissions, effectiveRoomCode])

  useEffect(() => {
    loadRoundState()
  }, [loadRoundState])

  useEffect(() => {
    const interval = setInterval(() => {
      loadRoundState({ silent: true })
    }, gameState.isPaused ? POLL_INTERVAL_PAUSED : POLL_INTERVAL_ACTIVE)

    return () => clearInterval(interval)
  }, [gameState.isPaused, gameState.gamePhase, loadRoundState])

  const yourPlayer = gameState.players.find((p) => p.isYou)
  const producer = gameState.players.find((p) => p.isProducer)
  const artists = gameState.players.filter((p) => !p.isProducer)
  const submittedCount = gameState.players.filter((p) => p.submitted && !p.isProducer).length
  const totalArtists = artists.length
  const currentSong = gameState.submissions[gameState.currentSongIndex]

  // Timer countdown for UX (does not gate server state)
  useEffect(() => {
    if (gameState.isPaused) return undefined
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
    return undefined
  }, [gameState.gamePhase, gameState.timer, submittedCount, totalArtists, gameState.isPaused])

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
    if (gameState.isPaused) return
    if (!gameState.selectedCard || yourPlayer?.submitted || !gameState.roundId || !currentPlayerId) return

    const filledBlanks = gameState.filledBlanks
    const submission = await submitLyricCard({
      roundId: gameState.roundId,
      playerId: currentPlayerId,
      handCard: gameState.selectedCard,
      filledBlanks,
    })

    await markCardPlayed(gameState.selectedCard.id)
    await updatePlayerActivity(currentPlayerId)

    const finalLyric = computeFinalLyric(
      gameState.selectedCard.template || gameState.selectedCard.lyric_card_text,
      filledBlanks
    )

    try {
      if (sunoApiService) {
        // Use new SunoApiService
        const taskId = await sunoApiService.generateMusic({
          prompt: `Create a ${gameState.vibeCard.toLowerCase()} song with this lyric: "${finalLyric}". Make it catchy and memorable.`,
          style: gameState.vibeCard,
          title: `${gameState.vibeCard} - Player`,
          customMode: true,
          instrumental: false,
          model: 'V4_5',
        })

        await updateSubmissionWithSuno(submission.id, {
          suno_task_id: taskId,
          song_status: 'pending',
        })

        // Poll for completion and get the actual audio URL
        try {
          // Wait for completion with progress updates
          const result = await sunoApiService.waitForCompletionWithProgress(
            taskId,
            (progress) => {
              setGameState((prev) => ({ ...prev, generationProgress: progress }))
            },
            {
              maxWaitTime: 5 * 60 * 1000, // 5 minutes
              pollInterval: 3000, // 3 seconds
            }
          )

          // Extract the audio URL from the Suno response
          const track = result.data.response?.sunoData?.[0]
          const audioUrl = track?.audioUrl || track?.streamAudioUrl

          if (!audioUrl) {
            throw new Error('No audio URL returned from Suno')
          }

          console.log('✅ Suno generation completed, audio URL:', audioUrl)

          await updateSubmissionWithSuno(submission.id, {
            song_status: 'completed',
            song_url: audioUrl,
            suno_task_id: taskId,
          })

          // Complete the progress
          setGameState((prev) => ({ ...prev, generationProgress: 100 }))

        } catch (err) {
          console.error('❌ Suno generation failed:', err)

          // Use fallback audio only on error
          const fallbackAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'

          await updateSubmissionWithSuno(submission.id, {
            song_status: 'failed',
            song_url: fallbackAudioUrl,
            song_error: err instanceof Error ? err.message : 'Generation failed',
            suno_task_id: taskId,
          })

          setGameState((prev) => ({ ...prev, generationProgress: 100 }))
        }
      } else {
        // Fallback to mock mode when Suno is not configured
        console.warn('Suno API not configured, using mock generation')
        await updateSubmissionWithSuno(submission.id, {
          song_status: 'completed',
          song_url: 'https://mock-audio-url.com/song.mp3',
          suno_task_id: 'mock-task-id',
        })
      }
    } catch (err) {
      console.error('Song generation error:', err)
      await updateSubmissionWithSuno(submission.id, {
        song_status: 'failed',
        song_error: err instanceof SunoApiError
          ? `${err.message}${err.details ? ` (${err.details})` : ''}`
          : err instanceof Error ? err.message : 'Suno generation failed',
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
    if (!gameState.roundId) return

    if (yourPlayer?.id === gameState.hostPlayerId) {
      const nextPlaying = !gameState.isPlaying
      setGameState((prev) => ({ ...prev, isPlaying: nextPlaying }))
      updateListeningState(gameState.roundId, {
        listening_is_playing: nextPlaying,
        listening_cue_at: new Date().toISOString(),
      }).then(() => {
        if (yourPlayer?.id) return updatePlayerActivity(yourPlayer.id)
        return undefined
      }).catch((err) => {
        setGameState((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to update playback' }))
      })
    }
  }, [gameState.isPlaying, gameState.roundId, yourPlayer?.id, gameState.hostPlayerId])

  const nextSong = useCallback(() => {
    if (!gameState.roundId) return
    if (gameState.currentSongIndex < gameState.submissions.length - 1) {
      const nextIndex = gameState.currentSongIndex + 1
      setGameState((prev) => ({
        ...prev,
        currentSongIndex: nextIndex,
        isPlaying: false,
      }))

      if (yourPlayer?.id === gameState.hostPlayerId) {
        updateListeningState(gameState.roundId, {
          listening_song_index: nextIndex,
          listening_is_playing: false,
        }).then(() => {
          if (yourPlayer?.id) return updatePlayerActivity(yourPlayer.id)
          return undefined
        }).catch((err) => {
          setGameState((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to change song' }))
        })
      }
    }
  }, [gameState.currentSongIndex, gameState.roundId, gameState.submissions.length, yourPlayer?.id, gameState.hostPlayerId])

  const selectWinner = useCallback(
    async (playerId: string) => {
      if (gameState.isPaused) return
      if (!yourPlayer?.isProducer || !gameState.roundId) return
      const winningSubmission = gameState.submissions.find((s) => s.playerId === playerId)
      if (!winningSubmission || !winningSubmission.id) return

      await setWinner(gameState.roundId, winningSubmission.id, playerId)
      await awardPointToPlayer(playerId)
      if (yourPlayer?.id) {
        await updatePlayerActivity(yourPlayer.id)
      }

      setGameState((prev) => ({ ...prev, winner: playerId, gamePhase: 'results' }))
      await loadRoundState()
    },
    [gameState.isPaused, gameState.roundId, gameState.submissions, loadRoundState, yourPlayer?.id, yourPlayer?.isProducer]
  )

  const nextRound = useCallback(async () => {
    if (gameState.isPaused) return
    try {
      const room = await getRoomByCode(effectiveRoomCode)
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
      if (currentPlayerId) {
        await updatePlayerActivity(currentPlayerId)
      }
      await loadRoundState()
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to start next round',
      }))
    }
  }, [currentPlayerId, gameState.currentRound, gameState.isPaused, loadRoundState, effectiveRoomCode])

  useEffect(() => {
    if (gameState.isPaused) return undefined
    if (shouldMoveToGeneration(gameState.gamePhase, submittedCount, totalArtists)) {
      const timeout = setTimeout(() => {
        setGameState((prev) => ({ ...prev, gamePhase: 'generating', generationProgress: 60 }))
      }, GAME_CONSTANTS.PHASE_TRANSITION_DELAY)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [submittedCount, gameState.gamePhase, totalArtists, gameState.isPaused])

  useEffect(() => {
    if (gameState.gamePhase !== 'generating' || gameState.isPaused) return undefined

    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        generationProgress: Math.min(98, prev.generationProgress + 4),
      }))
    }, 1200)

    return () => clearInterval(interval)
  }, [gameState.gamePhase, gameState.isPaused])

  const pauseGame = useCallback(async () => {
    if (!gameState.roomId || yourPlayer?.id !== gameState.hostPlayerId) return
    try {
      await pauseRoom(gameState.roomId)
      setGameState((prev) => ({ ...prev, isPaused: true }))
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to pause game',
      }))
    }
  }, [gameState.roomId, gameState.hostPlayerId, yourPlayer?.id])

  const resumeGame = useCallback(async () => {
    if (!gameState.roomId || yourPlayer?.id !== gameState.hostPlayerId) return
    try {
      await resumeRoom(gameState.roomId)
      setGameState((prev) => ({ ...prev, isPaused: false }))
    } catch (err) {
      setGameState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to resume game',
      }))
    }
  }, [gameState.roomId, gameState.hostPlayerId, yourPlayer?.id])

  const kickPlayer = useCallback(
    async (playerId: string) => {
      if (!playerId || playerId === yourPlayer?.id) return
      if (yourPlayer?.id !== gameState.hostPlayerId) return
      try {
        await deletePlayer(playerId)
        await loadRoundState()
      } catch (err) {
        setGameState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to remove player',
        }))
      }
    },
    [gameState.hostPlayerId, loadRoundState, yourPlayer?.id]
  )

  return {
    gameState,
    yourPlayer,
    producer,
    artists,
    submittedCount,
    totalArtists,
    currentSong,
    pauseGame,
    resumeGame,
    kickPlayer,
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
