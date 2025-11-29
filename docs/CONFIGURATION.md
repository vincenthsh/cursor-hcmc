# Configuration Guide ⚙️

Complete reference for all configuration options in Cacophony Game.

## Overview

All configuration is centralized in `src/config/gameConfig.ts` and loaded from environment variables in `.env`.

**Benefits**:
- Single source of truth
- Environment-based (dev/staging/prod)
- Type-safe TypeScript access
- Easy testing with different values

## Required Environment Variables

These **must** be set for the app to work:

```bash
# Supabase Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your_anon_key_here

# Suno AI Music Generation
VITE_SUNO_API_KEY=your_suno_api_key_here
```

## Optional Configuration

### Game Mechanics

```bash
# Timer duration for card selection phase (seconds)
# Default: 60
VITE_GAME_TIMER_DURATION=60

# Number of lyric cards dealt to each player
# Default: 5
VITE_GAME_HAND_SIZE=5

# Minimum players required to start a game
# Default: 3
VITE_MIN_PLAYERS_TO_START=3

# Maximum players allowed in a room
# Default: 8
VITE_MAX_PLAYERS=8

# Default number of rounds per game
# Default: 5
VITE_DEFAULT_TARGET_ROUNDS=5
```

**Usage in Code**:
```typescript
import { GAME_MECHANICS } from '@/config/gameConfig'

if (players.length < GAME_MECHANICS.minPlayersToStart) {
  throw new Error('Not enough players')
}
```

### Timing & Delays (milliseconds)

```bash
# Delay before auto-submitting after timer expires
# Default: 1500
VITE_AUTO_SUBMIT_DELAY_MS=1500

# Delay when transitioning between game phases
# Default: 1000
VITE_PHASE_TRANSITION_DELAY_MS=1000

# Interval for updating progress bars
# Default: 50
VITE_PROGRESS_UPDATE_INTERVAL_MS=50

# Increment value for progress bars (percentage)
# Default: 2
VITE_PROGRESS_INCREMENT=2

# Interval for updating generation progress
# Default: 50
VITE_GENERATION_INTERVAL_MS=50

# Increment value for generation progress
# Default: 2
VITE_GENERATION_INCREMENT=2

# Duration for copy notification toast
# Default: 2000
VITE_TOAST_TIMEOUT_MS=2000
```

**Usage in Code**:
```typescript
import { TIMING } from '@/config/gameConfig'

setTimeout(() => {
  autoSubmitCard()
}, TIMING.autoSubmitDelay)
```

### Polling & Real-time Updates (milliseconds)

```bash
# Polling interval when game is active
# Default: 2500
VITE_POLL_INTERVAL_ACTIVE_MS=2500

# Polling interval when game is paused
# Default: 5000
VITE_POLL_INTERVAL_PAUSED_MS=5000

# Polling interval in lobby
# Default: 2000
VITE_LOBBY_POLL_INTERVAL_MS=2000

# Player inactivity timeout (3 minutes)
# Default: 180000
VITE_INACTIVITY_THRESHOLD_MS=180000
```

**Usage in Code**:
```typescript
import { POLLING } from '@/config/gameConfig'

const interval = setInterval(() => {
  loadRoundState()
}, gameState.isPaused ? POLLING.pausedInterval : POLLING.activeInterval)
```

### Room Code Generation

```bash
# Length of generated room codes
# Default: 6
VITE_ROOM_CODE_LENGTH=6

# Characters allowed in room codes (excludes confusing chars like 0,O,I,1)
# Default: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
VITE_ROOM_CODE_VALID_CHARS=ABCDEFGHJKLMNPQRSTUVWXYZ23456789

# Maximum attempts to generate a unique room code
# Default: 10
VITE_MAX_ROOM_CODE_ATTEMPTS=10
```

**Usage in Code**:
```typescript
import { ROOM_CODE } from '@/config/gameConfig'

const code = Array.from({ length: ROOM_CODE.length }, () =>
  ROOM_CODE.validChars[Math.floor(Math.random() * ROOM_CODE.validChars.length)]
).join('')
```

### Player Settings

```bash
# Maximum username length
# Default: 20
VITE_MAX_USERNAME_LENGTH=20
```

### Suno API Configuration

```bash
# Suno API base URL
# Default: https://api.sunoapi.org
VITE_SUNO_API_BASE_URL=https://api.sunoapi.org

# Suno model version to use
# Default: V4_5
VITE_SUNO_MODEL_VERSION=V4_5

# Default production notes for song generation
# Default: Minimal intro, no outro. Simple lyrics, Short song, approx 30 seconds.
VITE_SUNO_PRODUCTION_NOTES=Minimal intro, no outro. Simple lyrics, Short song, approx 30 seconds.

# Maximum time to wait for song generation (5 minutes)
# Default: 300000
VITE_SUNO_MAX_WAIT_TIME_MS=300000

# Interval for polling Suno task status
# Default: 3000
VITE_SUNO_POLL_INTERVAL_MS=3000

# Delay before retrying failed poll
# Default: 1500
VITE_SUNO_POLL_RETRY_DELAY_MS=1500

# Dummy callback URL for polling mode
# Default: https://dummy-callback.com/polling-mode
VITE_SUNO_DUMMY_CALLBACK_URL=https://dummy-callback.com/polling-mode
```

**Usage in Code**:
```typescript
import { SUNO } from '@/config/gameConfig'

const taskId = await sunoApiService.generateMusic({
  prompt: `Create a ${vibe} ${SUNO.productionNotes}`,
  model: SUNO.modelVersion,
})
```

### Fallback/Mock URLs (for development/testing)

```bash
# Fallback audio URL when Suno generation fails
# Default: https://www.soundjay.com/misc/sounds/bell-ringing-05.wav
VITE_FALLBACK_AUDIO_URL=https://www.soundjay.com/misc/sounds/bell-ringing-05.wav

# Mock audio URL for testing without Suno
# Default: https://mock-audio-url.com/song.mp3
VITE_MOCK_AUDIO_URL=https://mock-audio-url.com/song.mp3

# Mock Suno song URL for development
# Default: https://example.com/mock-song.mp3
VITE_MOCK_SUNO_SONG_URL=https://example.com/mock-song.mp3

# Mock task ID for development
# Default: mock-task-id
VITE_MOCK_TASK_ID=mock-task-id
```

### UI Constants

```bash
# Number of waveform visualization bars
# Default: 30
VITE_WAVEFORM_BARS=30

# LocalStorage key for session data
# Default: cacophony_session
VITE_SESSION_STORAGE_KEY=cacophony_session
```

### Development/Debug

```bash
# Enable debug logs in console
# Default: false
VITE_DEBUG_LOGS=true

# Default room code for development
# Default: AB1234
VITE_ROOM_CODE=ABC123

# Default player ID for development (use a UUID)
# Default: (empty)
VITE_PLAYER_ID=your-test-player-uuid

# Alternative default room code fallback
# Default: AB1234
VITE_DEFAULT_ROOM_CODE=DEV123
```

## Configuration Validation

The app validates configuration on startup. Add this to `main.tsx`:

```typescript
import { validateGameConfig } from '@/config/gameConfig'

// Before rendering app
validateGameConfig()

createRoot(document.getElementById('root')!).render(<App />)
```

**Validation Checks**:
- ✓ `minPlayersToStart` ≥ 2
- ✓ `maxPlayers` ≥ `minPlayersToStart`
- ✓ `handSize` ≥ 1
- ✓ All timing values are positive
- ✓ Suno API key is set (warns if missing)
- ✓ Room code length ≥ 4

## Environment-Specific Configuration

### Development (.env.local)

```bash
# Development overrides
VITE_DEBUG_LOGS=true
VITE_ROOM_CODE=DEV123
VITE_PLAYER_ID=test-player-uuid
VITE_SUNO_POLL_INTERVAL_MS=1000  # Faster polling in dev
```

### Staging (.env.staging)

```bash
# Staging-specific
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_DEBUG_LOGS=true
VITE_SUNO_MAX_WAIT_TIME_MS=600000  # Longer timeout
```

### Production (.env.production)

```bash
# Production settings
VITE_DEBUG_LOGS=false
VITE_POLL_INTERVAL_ACTIVE_MS=5000  # Less frequent polling
VITE_SUNO_MAX_WAIT_TIME_MS=300000
# No default room codes or player IDs
```

## Accessing Configuration in Code

### Import Specific Sections

```typescript
import { GAME_MECHANICS, TIMING, SUNO } from '@/config/gameConfig'

// Use directly
const canStart = players.length >= GAME_MECHANICS.minPlayersToStart
```

### Legacy Exports

For backward compatibility:

```typescript
import { DEFAULT_GAME_CONFIG, GAME_CONSTANTS } from '@/constants'

// These still work but pull from centralized config
console.log(DEFAULT_GAME_CONFIG.handSize)  // → GAME_MECHANICS.handSize
console.log(GAME_CONSTANTS.AUTO_SUBMIT_DELAY)  // → TIMING.autoSubmitDelay
```

## Common Configuration Scenarios

### Faster Game for Testing

```bash
VITE_GAME_TIMER_DURATION=10          # 10 second timer
VITE_MIN_PLAYERS_TO_START=2          # Only 2 players needed
VITE_DEFAULT_TARGET_ROUNDS=2         # Quick 2-round game
VITE_AUTO_SUBMIT_DELAY_MS=500        # Fast auto-submit
```

### Production Optimization

```bash
VITE_POLL_INTERVAL_ACTIVE_MS=5000    # Less frequent polling
VITE_INACTIVITY_THRESHOLD_MS=600000  # 10 minute timeout
VITE_DEBUG_LOGS=false                # No debug logs
```

### Local Development with Mock Suno

```bash
# Don't set VITE_SUNO_API_KEY
# App will use mock mode automatically
VITE_DEBUG_LOGS=true
```

## Troubleshooting Configuration

### Config not loading

1. Check `.env` file exists in project root
2. Restart dev server after changing `.env`
3. Verify variable names start with `VITE_`
4. Check for typos in variable names

### Validation warnings

Run `validateGameConfig()` and check console for warnings:

```typescript
// In main.tsx
import { validateGameConfig } from '@/config/gameConfig'

validateGameConfig()  // Logs warnings to console
```

### Type errors

If you get type errors after changing config:

```bash
# Restart TypeScript server
pnpm exec tsc --noEmit

# Or restart your IDE
```

## Related Documentation

- [Quick Start](./QUICK_START.md) - Basic setup
- [Architecture](./ARCHITECTURE.md) - How config is used
- [Development Guide](./DEVELOPMENT.md) - Adding new config values
