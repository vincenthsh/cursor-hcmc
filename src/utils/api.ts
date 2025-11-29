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
}

export interface PlayerRow {
  id: string
  game_room_id: string
  username: string
  score: number
  join_order: number
}

export interface GameRoundRow {
  id: string
  game_room_id: string
  round_number: number
  producer_id: string
  vibe_card_text: string
  status: string
  winner_id: string | null
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
