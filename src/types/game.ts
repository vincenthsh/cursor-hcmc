export interface Player {
  id: string
  name: string
  score: number
  isProducer: boolean
  submitted: boolean
  isYou: boolean
  joinOrder?: number
  lastActiveAt?: string
  isInactive?: boolean
}

export interface LyricSegment {
  text: string
  startTime: number
  endTime: number
}

export interface SongSubmission {
  playerId: string
  playerName: string
  lyric: string
  songUrl?: string | null
  audioUrl?: string | null
  streamAudioUrl?: string | null
  imageUrl?: string | null
  taskId?: string | null
  duration?: number | null
  title?: string | null
  id?: string
  songStatus?: string
  isWinner?: boolean
  timestampedLyrics?: LyricSegment[] | null
}

export type GamePhase = 'waiting' | 'selecting' | 'generating' | 'listening' | 'results' | 'error'

export interface GameState {
  gamePhase: GamePhase
  roomId?: string
  players: Player[]
  currentRound: number
  roundId?: string
  vibeCard: string
  hostPlayerId?: string
  isPaused: boolean
  yourHand: PlayerHand[]
  selectedCard: PlayerHand | null
  filledBlanks: Record<string, string>
  submissions: SongSubmission[]
  currentSongIndex: number
  isPlaying: boolean
  listeningCueAt?: string | null
  generationProgress: number
  timer: number
  winner: string | null
  loading: boolean
  isSubmitting: boolean
  error?: string
}

export interface PlayerHand {
  id: string
  lyric_card_text: string
  blank_count?: number
  template?: string
}

export interface GameConfig {
  timerDuration: number
  handSize: number
}
