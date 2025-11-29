import { Player, SongSubmission, GamePhase } from '@/types'
import { LYRIC_CARDS, VIBE_CARDS, GAME_CONSTANTS } from '@/constants'

export const getRandomVibeCard = (): string => {
  return VIBE_CARDS[Math.floor(Math.random() * VIBE_CARDS.length)]
}

export const getRandomLyricCards = (count: number): string[] => {
  const shuffled = [...LYRIC_CARDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const getRandomLyricCard = (): string => {
  return LYRIC_CARDS[Math.floor(Math.random() * LYRIC_CARDS.length)]
}

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const createSongSubmissions = (
  artists: Player[],
  selectedCard: string | null
): SongSubmission[] => {
  return artists.map((artist) => ({
    playerId: artist.id,
    playerName: artist.name,
    lyric: artist.isYou ? selectedCard || getRandomLyricCard() : getRandomLyricCard(),
    songUrl: null, // In real implementation, this would be the AI-generated song URL
  }))
}

export const rotateProducer = (players: Player[]): Player[] => {
  const currentProducerIndex = players.findIndex((p) => p.isProducer)
  const nextProducerIndex = (currentProducerIndex + 1) % players.length

  return players.map((p, idx) => ({
    ...p,
    isProducer: idx === nextProducerIndex,
  }))
}

export const getSortedPlayersByScore = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => b.score - a.score)
}

export const simulateOpponentSubmissions = (
  players: Player[],
  delay: number = GAME_CONSTANTS.AUTO_SUBMIT_DELAY
): Promise<Player[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedPlayers = players.map((p) =>
        !p.isProducer && !p.submitted ? { ...p, submitted: Math.random() > 0.3 } : p
      )
      resolve(updatedPlayers)
    }, delay)
  })
}

export const shouldAutoSubmit = (
  gamePhase: GamePhase,
  timer: number,
  submittedCount: number,
  totalArtists: number
): boolean => {
  return gamePhase === 'selecting' && timer <= 1 && submittedCount < totalArtists
}

export const shouldMoveToGeneration = (
  gamePhase: GamePhase,
  submittedCount: number,
  totalArtists: number
): boolean => {
  return gamePhase === 'selecting' && submittedCount === totalArtists
}

export const computeFinalLyric = (
  template: string,
  blanks: Record<string, string>
): string => {
  return Object.entries(blanks).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, value || '___')
  }, template)
}

export const countPlaceholders = (template?: string | null): number => {
  if (!template) return 0
  const matches = template.match(/\{\d+\}/g)
  return matches ? matches.length : 0
}
