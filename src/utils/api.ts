import supabase from './supabase'
import { LYRIC_CARD_TEMPLATES, VIBE_CARDS } from '@/constants'
import { PlayerHand } from '@/types'
import { computeFinalLyric } from './gameLogic'

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === 'true'
const log = (...args: unknown[]) => {
  if (DEBUG_LOGS) console.debug('[api]', ...args)
}

export interface GameRoomRow {
  id: string
  room_code: string
  status: string
  current_round: number
  target_rounds: number
  is_paused: boolean
  paused_at: string | null
}

export interface PlayerRow {
  id: string
  game_room_id: string
  username: string
  score: number
  join_order: number
  last_active_at: string | null
}

export interface GameRoundRow {
  id: string
  game_room_id: string
  round_number: number
  producer_id: string
  vibe_card_text: string
  status: string
  winner_id: string | null
  listening_song_index: number
  listening_is_playing: boolean
  listening_cue_at: string | null
}

export interface PlayerHandRow {
  id: string
  round_id: string
  player_id: string
  lyric_card_text: string
  template: string | null
  blank_count: number
  position: number
  is_played: boolean
}

export interface SubmissionRow {
  id: string
  round_id: string
  player_id: string
  hand_card_id: string | null
  lyric_card_text: string
  filled_blanks: Record<string, string> | null
  suno_task_id: string | null
  song_url: string | null
  song_status: 'pending' | 'generating' | 'completed' | 'failed' | null
  song_error: string | null
  producer_rating: number | null
  is_winner: boolean
}

const getError = (message: string, error?: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(`${message}: ${(error as { message: string }).message}`)
  }
  return new Error(message)
}

export const getRoomByCode = async (roomCode: string): Promise<GameRoomRow> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode)
    .single()

  if (error || !data) throw getError('Failed to load game room', error)
  log('getRoomByCode', roomCode, data.id)
  return data as GameRoomRow
}

export const pauseGame = async (roomId: string): Promise<void> => {
  const { error } = await supabase
    .from('game_rooms')
    .update({ is_paused: true, paused_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) throw getError('Failed to pause game', error)
  log('pauseGame', { roomId })
}

export const resumeGame = async (roomId: string): Promise<void> => {
  const { error } = await supabase
    .from('game_rooms')
    .update({ is_paused: false, paused_at: null })
    .eq('id', roomId)

  if (error) throw getError('Failed to resume game', error)
  log('resumeGame', { roomId })
}

export const getPlayersForRoom = async (gameRoomId: string): Promise<PlayerRow[]> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('game_room_id', gameRoomId)
    .order('join_order', { ascending: true })

  if (error || !data) throw getError('Failed to load players', error)
  log('getPlayersForRoom', { gameRoomId })
  return data as PlayerRow[]
}

export const getLatestRound = async (gameRoomId: string): Promise<GameRoundRow | null> => {
  const { data, error } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('game_room_id', gameRoomId)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw getError('Failed to load latest round', error)
  log('getLatestRound', { gameRoomId, roundId: data?.id })
  return (data as GameRoundRow) || null
}

export const createRound = async (
  params: Pick<GameRoundRow, 'game_room_id' | 'round_number' | 'producer_id' | 'vibe_card_text'>
): Promise<GameRoundRow> => {
  const { data, error } = await supabase
    .from('game_rounds')
    .insert({ ...params, status: 'selecting' })
    .select('*')
    .single()

  if (error || !data) throw getError('Failed to create round', error)
  log('createRound', { roundId: data.id, roundNumber: data.round_number })
  return data as GameRoundRow
}

export const updateRoundStatus = async (
  roundId: string,
  status: GameRoundRow['status'],
  winnerId?: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('game_rounds')
    .update({ status, winner_id: winnerId ?? null })
    .eq('id', roundId)

  if (error) throw getError('Failed to update round status', error)
  log('updateRoundStatus', { roundId, status, winnerId })
}

export const dealCardsToArtists = async (
  roundId: string,
  artistIds: string[],
  handSize = 5
): Promise<void> => {
  const cards = [...LYRIC_CARD_TEMPLATES]
  const inserts: Omit<PlayerHandRow, 'id'>[] = []

  for (const artistId of artistIds) {
    const shuffled = cards.sort(() => Math.random() - 0.5).slice(0, handSize)
    shuffled.forEach((card, idx) => {
      inserts.push({
        round_id: roundId,
        player_id: artistId,
        lyric_card_text: card.display,
        template: card.template,
        blank_count: card.blank_count,
        position: idx,
        is_played: false,
      })
    })
  }

  const { error } = await supabase.from('player_hands').insert(inserts)
  if (error) throw getError('Failed to deal cards', error)
  log('dealCardsToArtists', { roundId, artistCount: artistIds.length, handSize })
}

export const getHandForPlayer = async (
  roundId: string,
  playerId: string
): Promise<PlayerHandRow[]> => {
  const { data, error } = await supabase
    .from('player_hands')
    .select('*')
    .eq('round_id', roundId)
    .eq('player_id', playerId)
    .order('position', { ascending: true })

  if (error || !data) throw getError('Failed to load player hand', error)
  log('getHandForPlayer', { roundId, playerId, cards: data.length })
  return data as PlayerHandRow[]
}

export const markCardPlayed = async (cardId: string): Promise<void> => {
  const { error } = await supabase
    .from('player_hands')
    .update({ is_played: true })
    .eq('id', cardId)

  if (error) throw getError('Failed to mark card as played', error)
  log('markCardPlayed', { cardId })
}

export const deletePlayer = async (playerId: string): Promise<void> => {
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw getError('Failed to remove player', error)
  log('deletePlayer', { playerId })
}

export const updatePlayerActivity = async (playerId: string): Promise<void> => {
  const { error } = await supabase
    .from('players')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', playerId)

  if (error) throw getError('Failed to update player activity', error)
  log('updatePlayerActivity', { playerId })
}

export const getSubmissionsForRound = async (
  roundId: string
): Promise<(SubmissionRow & { player: { username: string } })[]> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, player:players(username)')
    .eq('round_id', roundId)

  if (error || !data) throw getError('Failed to load submissions', error)
  log('getSubmissionsForRound', { roundId, count: data.length })
  return data as (SubmissionRow & { player: { username: string } })[]
}

export const submitLyricCard = async (params: {
  roundId: string
  playerId: string
  handCard: PlayerHandRow | PlayerHand
  filledBlanks: Record<string, string>
}): Promise<SubmissionRow> => {
  const { roundId, playerId, handCard, filledBlanks } = params

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      round_id: roundId,
      player_id: playerId,
      hand_card_id: handCard.id,
      lyric_card_text: handCard.template || handCard.lyric_card_text,
      filled_blanks: filledBlanks,
      song_status: 'pending',
    })
    .select('*')
    .single()

  if (error || !data) throw getError('Failed to submit card', error)
  log('submitLyricCard', { submissionId: data.id, roundId, playerId })
  return data as SubmissionRow
}

export const updateSubmissionWithSuno = async (
  submissionId: string,
  payload: Partial<Pick<SubmissionRow, 'suno_task_id' | 'song_status' | 'song_url' | 'song_error'>>
): Promise<void> => {
  const { error } = await supabase
    .from('submissions')
    .update(payload)
    .eq('id', submissionId)

  if (error) throw getError('Failed to update submission', error)
  log('updateSubmissionWithSuno', { submissionId, payload })
}

export const setProducerRating = async (submissionId: string, rating: number) => {
  const { error } = await supabase
    .from('submissions')
    .update({ producer_rating: rating })
    .eq('id', submissionId)

  if (error) throw getError('Failed to rate submission', error)
  log('setProducerRating', { submissionId, rating })
}

export const setWinner = async (roundId: string, submissionId: string, playerId: string) => {
  const { error } = await supabase
    .from('submissions')
    .update({ is_winner: true })
    .eq('id', submissionId)

  if (error) throw getError('Failed to mark winner submission', error)

  await updateRoundStatus(roundId, 'completed', playerId)
  log('setWinner', { roundId, submissionId, playerId })
}

export const updateListeningState = async (
  roundId: string,
  state: Partial<Pick<GameRoundRow, 'listening_song_index' | 'listening_is_playing' | 'listening_cue_at'>>
): Promise<void> => {
  const payload = {
    ...state,
    listening_cue_at: state.listening_cue_at ?? new Date().toISOString(),
  }

  const { error } = await supabase
    .from('game_rounds')
    .update(payload)
    .eq('id', roundId)

  if (error) throw getError('Failed to update listening state', error)
  log('updateListeningState', { roundId, state })
}

export const awardPointToPlayer = async (playerId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single()

  if (error || !data) throw getError('Failed to load player score', error)

  const nextScore = (data.score || 0) + 1
  const { error: updateError } = await supabase
    .from('players')
    .update({ score: nextScore })
    .eq('id', playerId)

  if (updateError) throw getError('Failed to award score to player', updateError)
  log('awardPointToPlayer', { playerId, nextScore })
}

export const deriveProducerForRound = (players: PlayerRow[], roundNumber: number): PlayerRow => {
  if (!players.length) throw new Error('No players available')
  const sorted = [...players].sort((a, b) => a.join_order - b.join_order)
  const idx = (roundNumber - 1) % sorted.length
  log('deriveProducerForRound', { roundNumber, producerId: sorted[idx]?.id })
  return sorted[idx]
}

export const computeFilledLyric = (submission: SubmissionRow): string => {
  const blanks = submission.filled_blanks || {}
  return computeFinalLyric(submission.lyric_card_text, blanks)
}

export const pickRandomVibeCard = (): string => {
  return VIBE_CARDS[Math.floor(Math.random() * VIBE_CARDS.length)]
}

// Lobby & Session Management

export const generateRoomCode = (): string => {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join('')
}

export const createRoom = async (targetRounds: number = 3): Promise<GameRoomRow> => {
  const maxAttempts = 10
  let attempts = 0

  while (attempts < maxAttempts) {
    const roomCode = generateRoomCode()

    const { data: existing } = await supabase
      .from('game_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .maybeSingle()

    if (!existing) {
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          status: 'waiting',
          current_round: 0,
          target_rounds: targetRounds,
          is_paused: false,
          paused_at: null,
        })
        .select('*')
        .single()

      if (error || !data) throw getError('Failed to create room', error)
      log('createRoom', { roomCode, id: data.id })
      return data as GameRoomRow
    }

    attempts++
  }

  throw new Error('Failed to generate unique room code after 10 attempts')
}

export const updateRoomStatus = async (
  roomId: string,
  status: 'waiting' | 'in_progress' | 'completed'
): Promise<void> => {
  const { error } = await supabase
    .from('game_rooms')
    .update({ status })
    .eq('id', roomId)

  if (error) throw getError('Failed to update room status', error)
  log('updateRoomStatus', { roomId, status })
}

export const getAvailableRooms = async (): Promise<(GameRoomRow & { playerCount: number })[]> => {
  const { data: rooms, error: roomsError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })

  if (roomsError || !rooms) throw getError('Failed to load available rooms', roomsError)

  // Fetch player counts for each room
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room) => {
      const players = await getPlayersForRoom(room.id)
      return {
        ...(room as GameRoomRow),
        playerCount: players.length,
      }
    })
  )

  log('getAvailableRooms', { count: roomsWithCounts.length })
  return roomsWithCounts
}

export const createPlayer = async (
  gameRoomId: string,
  username?: string
): Promise<PlayerRow> => {
  const roomCode = (await supabase.from('game_rooms').select('room_code').eq('id', gameRoomId).single()).data
    ?.room_code
  if (!roomCode) throw new Error('Invalid room ID')

  const room = await getRoomByCode(roomCode)

  if (room.status !== 'waiting') {
    throw new Error('Game has already started')
  }

  const players = await getPlayersForRoom(gameRoomId)

  if (players.length >= 8) {
    throw new Error('Lobby is full (max 8 players)')
  }

  const playerUsername = username || `Guest-${Math.random().toString(36).substring(7)}`

  if (username) {
    const duplicate = players.find((p) => p.username.toLowerCase() === username.toLowerCase())
    if (duplicate) {
      throw new Error('Username already taken in this lobby')
    }
  }

  const nextJoinOrder = players.length > 0 ? Math.max(...players.map((p) => p.join_order)) + 1 : 0

  const { data, error } = await supabase
    .from('players')
    .insert({
      game_room_id: gameRoomId,
      username: playerUsername,
      score: 0,
      join_order: nextJoinOrder,
      last_active_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error || !data) throw getError('Failed to create player', error)
  log('createPlayer', { gameRoomId, playerId: data.id, username: playerUsername })
  return data as PlayerRow
}

export const updatePlayerUsername = async (playerId: string, username: string): Promise<void> => {
  const { error } = await supabase
    .from('players')
    .update({ username })
    .eq('id', playerId)

  if (error) throw getError('Failed to update player username', error)
  log('updatePlayerUsername', { playerId, username })
}

export const startGame = async (roomId: string): Promise<GameRoundRow> => {
  const players = await getPlayersForRoom(roomId)

  if (players.length < 3) {
    throw new Error('Need at least 3 players to start')
  }

  await updateRoomStatus(roomId, 'in_progress')

  const producer = deriveProducerForRound(players, 1)
  const round = await createRound({
    game_room_id: roomId,
    round_number: 1,
    producer_id: producer.id,
    vibe_card_text: pickRandomVibeCard(),
  })

  const artistIds = players.filter((p) => p.id !== producer.id).map((p) => p.id)
  const { DEFAULT_GAME_CONFIG } = await import('@/constants')
  await dealCardsToArtists(round.id, artistIds, DEFAULT_GAME_CONFIG.handSize)

  log('startGame', { roomId, playerCount: players.length })
  return round
}
