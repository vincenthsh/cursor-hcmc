/**
 * Centralized Game Configuration
 *
 * This file contains all configurable game constants that were previously hardcoded.
 * Values are pulled from environment variables with sensible defaults.
 */

// ============================================
// GAME MECHANICS
// ============================================

export const GAME_MECHANICS = {
  /** Duration of selection timer in seconds */
  timerDuration: parseInt(import.meta.env.VITE_GAME_TIMER_DURATION || '60', 10),

  /** Number of lyric cards dealt to each artist per round */
  handSize: parseInt(import.meta.env.VITE_GAME_HAND_SIZE || '5', 10),

  /** Minimum number of players required to start a game */
  minPlayersToStart: parseInt(import.meta.env.VITE_MIN_PLAYERS_TO_START || '3', 10),

  /** Maximum number of players allowed in a room */
  maxPlayers: parseInt(import.meta.env.VITE_MAX_PLAYERS || '8', 10),

  /** Default number of rounds per game */
  defaultTargetRounds: parseInt(import.meta.env.VITE_DEFAULT_TARGET_ROUNDS || '5', 10),
} as const

// ============================================
// TIMING & DELAYS
// ============================================

export const TIMING = {
  /** Delay before auto-submitting after timer expires (ms) */
  autoSubmitDelay: parseInt(import.meta.env.VITE_AUTO_SUBMIT_DELAY_MS || '1500', 10),

  /** Delay when transitioning between game phases (ms) */
  phaseTransitionDelay: parseInt(import.meta.env.VITE_PHASE_TRANSITION_DELAY_MS || '1000', 10),

  /** Interval for updating progress bars (ms) */
  progressUpdateInterval: parseInt(import.meta.env.VITE_PROGRESS_UPDATE_INTERVAL_MS || '50', 10),

  /** Increment value for progress bars */
  progressIncrement: parseInt(import.meta.env.VITE_PROGRESS_INCREMENT || '2', 10),

  /** Interval for updating generation progress (ms) */
  generationInterval: parseInt(import.meta.env.VITE_GENERATION_INTERVAL_MS || '50', 10),

  /** Increment value for generation progress */
  generationIncrement: parseInt(import.meta.env.VITE_GENERATION_INCREMENT || '2', 10),

  /** Duration for copy notification toast (ms) */
  toastTimeout: parseInt(import.meta.env.VITE_TOAST_TIMEOUT_MS || '2000', 10),
} as const

// ============================================
// POLLING & REAL-TIME UPDATES
// ============================================

export const POLLING = {
  /** Polling interval when game is active (ms) */
  activeInterval: parseInt(import.meta.env.VITE_POLL_INTERVAL_ACTIVE_MS || '2500', 10),

  /** Polling interval when game is paused (ms) */
  pausedInterval: parseInt(import.meta.env.VITE_POLL_INTERVAL_PAUSED_MS || '5000', 10),

  /** Polling interval in lobby (ms) */
  lobbyInterval: parseInt(import.meta.env.VITE_LOBBY_POLL_INTERVAL_MS || '2000', 10),

  /** Player inactivity timeout before showing as inactive (ms) */
  inactivityThreshold: parseInt(import.meta.env.VITE_INACTIVITY_THRESHOLD_MS || String(3 * 60 * 1000), 10),
} as const

// ============================================
// ROOM CODE GENERATION
// ============================================

export const ROOM_CODE = {
  /** Length of generated room codes */
  length: parseInt(import.meta.env.VITE_ROOM_CODE_LENGTH || '6', 10),

  /** Characters allowed in room codes (excludes confusing chars like 0, O, I, 1) */
  validChars: import.meta.env.VITE_ROOM_CODE_VALID_CHARS || 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

  /** Maximum attempts to generate a unique room code */
  maxGenerationAttempts: parseInt(import.meta.env.VITE_MAX_ROOM_CODE_ATTEMPTS || '10', 10),
} as const

// ============================================
// PLAYER SETTINGS
// ============================================

export const PLAYER = {
  /** Maximum username length */
  maxUsernameLength: parseInt(import.meta.env.VITE_MAX_USERNAME_LENGTH || '20', 10),
} as const

// ============================================
// SUNO API CONFIGURATION
// ============================================

export const SUNO = {
  /** Suno API base URL */
  baseUrl: import.meta.env.VITE_SUNO_API_BASE_URL || 'https://api.sunoapi.org',

  /** Suno API key */
  apiKey: import.meta.env.VITE_SUNO_API_KEY || '',

  /** Suno model version to use */
  modelVersion: import.meta.env.VITE_SUNO_MODEL_VERSION || 'V4_5',

  /** Default production notes for song generation */
  productionNotes: import.meta.env.VITE_SUNO_PRODUCTION_NOTES || 'Minimal intro, no outro. Simple lyrics, Short song, approx 30 seconds.',

  /** Maximum time to wait for song generation (ms) */
  maxWaitTime: parseInt(import.meta.env.VITE_SUNO_MAX_WAIT_TIME_MS || String(5 * 60 * 1000), 10),

  /** Interval for polling Suno task status (ms) */
  pollInterval: parseInt(import.meta.env.VITE_SUNO_POLL_INTERVAL_MS || '3000', 10),

  /** Delay before retrying failed poll (ms) */
  pollRetryDelay: parseInt(import.meta.env.VITE_SUNO_POLL_RETRY_DELAY_MS || '1500', 10),

  /** Dummy callback URL for polling mode */
  dummyCallbackUrl: import.meta.env.VITE_SUNO_DUMMY_CALLBACK_URL || 'https://dummy-callback.com/polling-mode',
} as const

// ============================================
// FALLBACK/MOCK URLs (for development)
// ============================================

export const FALLBACK = {
  /** Fallback audio URL when Suno generation fails */
  audioUrl: import.meta.env.VITE_FALLBACK_AUDIO_URL || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',

  /** Mock audio URL for testing without Suno */
  mockAudioUrl: import.meta.env.VITE_MOCK_AUDIO_URL || 'https://mock-audio-url.com/song.mp3',

  /** Mock Suno song URL for development */
  mockSunoSongUrl: import.meta.env.VITE_MOCK_SUNO_SONG_URL || 'https://example.com/mock-song.mp3',

  /** Mock task ID for development */
  mockTaskId: import.meta.env.VITE_MOCK_TASK_ID || 'mock-task-id',
} as const

// ============================================
// UI CONSTANTS
// ============================================

export const UI = {
  /** Number of waveform visualization bars */
  waveformBars: parseInt(import.meta.env.VITE_WAVEFORM_BARS || '30', 10),

  /** LocalStorage key for session data */
  sessionStorageKey: import.meta.env.VITE_SESSION_STORAGE_KEY || 'cacophony_session',
} as const

// ============================================
// DEVELOPMENT/DEBUG
// ============================================

export const DEV = {
  /** Default room code for development */
  defaultRoomCode: import.meta.env.VITE_ROOM_CODE || import.meta.env.VITE_DEFAULT_ROOM_CODE || 'AB1234',

  /** Default player ID for development */
  defaultPlayerId: import.meta.env.VITE_PLAYER_ID || '',

  /** Enable debug logs */
  debugLogs: import.meta.env.VITE_DEBUG_LOGS === 'true',
} as const

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates game configuration on app startup
 * Logs warnings for invalid or missing critical values
 */
export function validateGameConfig(): void {
  const warnings: string[] = []

  // Check critical game mechanics
  if (GAME_MECHANICS.minPlayersToStart < 2) {
    warnings.push('VITE_MIN_PLAYERS_TO_START should be at least 2')
  }
  if (GAME_MECHANICS.maxPlayers < GAME_MECHANICS.minPlayersToStart) {
    warnings.push('VITE_MAX_PLAYERS should be >= VITE_MIN_PLAYERS_TO_START')
  }
  if (GAME_MECHANICS.handSize < 1) {
    warnings.push('VITE_GAME_HAND_SIZE should be at least 1')
  }

  // Check timing values
  if (TIMING.autoSubmitDelay < 0) {
    warnings.push('VITE_AUTO_SUBMIT_DELAY_MS should be positive')
  }

  // Check Suno configuration
  if (!SUNO.apiKey) {
    warnings.push('VITE_SUNO_API_KEY is not set - using mock mode')
  }

  // Check room code settings
  if (ROOM_CODE.length < 4) {
    warnings.push('VITE_ROOM_CODE_LENGTH should be at least 4 for uniqueness')
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('[GameConfig] Configuration warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  } else if (DEV.debugLogs) {
    console.log('[GameConfig] Configuration validated successfully')
  }
}

// ============================================
// COMBINED EXPORT (for backwards compatibility)
// ============================================

/**
 * Legacy GAME_CONSTANTS export for backwards compatibility
 * @deprecated Use specific config objects instead (GAME_MECHANICS, TIMING, etc.)
 */
export const GAME_CONSTANTS = {
  GENERATION_INTERVAL: TIMING.generationInterval,
  GENERATION_INCREMENT: TIMING.generationIncrement,
  AUTO_SUBMIT_DELAY: TIMING.autoSubmitDelay,
  PHASE_TRANSITION_DELAY: TIMING.phaseTransitionDelay,
  PROGRESS_UPDATE_INTERVAL: TIMING.progressUpdateInterval,
} as const

/**
 * Legacy DEFAULT_GAME_CONFIG export for backwards compatibility
 * @deprecated Use GAME_MECHANICS instead
 */
export const DEFAULT_GAME_CONFIG = {
  timerDuration: GAME_MECHANICS.timerDuration,
  handSize: GAME_MECHANICS.handSize,
  targetRounds: GAME_MECHANICS.defaultTargetRounds,
} as const
