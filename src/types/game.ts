export interface Player {
  id: string
  name: string
  score: number
  isProducer: boolean
  submitted: boolean
  isYou: boolean
}

export interface PlayerHand {
  id: string
  round_id: string
  player_id: string
  lyric_card_text: string
  template?: string | null
  blank_count: number
  position: number
  is_played: boolean
}

export interface SongSubmission {
  id?: string
  playerId: string
  playerName: string
  lyric: string
  handCardId?: string | null
  songUrl?: string | null
  songStatus?: 'pending' | 'generating' | 'completed' | 'failed'
  producerRating?: number | null
  isWinner?: boolean
}

export type GamePhase = 'loading' | 'selecting' | 'generating' | 'listening' | 'results'

export interface GameState {
  gamePhase: GamePhase
  players: Player[]
  currentRound: number
  roundId?: string
  vibeCard: string
  yourHand: PlayerHand[]
  selectedCard: PlayerHand | null
  filledBlanks: Record<string, string>
  submissions: SongSubmission[]
  currentSongIndex: number
  isPlaying: boolean
  generationProgress: number
  timer: number
  winner: string | null
  loading: boolean
  error?: string
}

export interface GameConfig {
  players: Player[]
  timerDuration: number
  handSize: number
}
