export interface Player {
  id: number
  name: string
  score: number
  isProducer: boolean
  submitted: boolean
  isYou: boolean
}

export interface SongSubmission {
  playerId: number
  playerName: string
  lyric: string
  songUrl?: string | null
}

export type GamePhase = 'waiting' | 'selecting' | 'generating' | 'listening' | 'results'

export interface GameState {
  gamePhase: GamePhase
  players: Player[]
  currentRound: number
  vibeCard: string
  yourHand: string[]
  selectedCard: string | null
  submissions: SongSubmission[]
  currentSongIndex: number
  isPlaying: boolean
  generationProgress: number
  timer: number
  winner: number | null
}

export interface GameConfig {
  players: Player[]
  timerDuration: number
  handSize: number
}