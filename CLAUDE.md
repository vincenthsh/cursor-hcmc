# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cacophony Game** is a multiplayer music battle game where players compete to create the funniest song combinations by matching music genres (vibe cards) with humorous lyrics (lyric cards). The game uses React, TypeScript, Vite, Tailwind CSS, Supabase for backend, and integrates with the Suno API for AI song generation.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (runs on http://localhost:3000)
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Format code with Prettier
pnpm run format
```

## Architecture Overview

### High-Level Flow

1. **Game Session**: Players join a room via a unique `room_code`. The room contains game-wide configuration (`target_rounds`, status).

2. **Round Loop** (repeats for each round):
   - A producer is selected by rotating through players using `join_order`
   - A vibe card is drawn (e.g., "Sad Country Song")
   - Each artist (non-producer player) selects a lyric card and fills in blanks
   - Submissions are sent to Suno API to generate songs
   - Producer listens to generated songs and votes on the funniest
   - Winner gets a point; next round begins

3. **Game End**: When `target_rounds` is reached, show final scores and podium.

### Key Layers

#### Frontend State Management (`src/hooks/useGameState.ts`)
- **Single source of truth** for all game state via React's `useState`
- Manages phase transitions: `loading` → `selecting` → `generating` → `listening` → `results`
- Handles timers, submission tracking, and music playback
- Async operations: loading room/players, fetching submissions, polling Suno API
- Maps raw Supabase rows to domain types (Player, SongSubmission)

**Key exported function**: `useGameState()` - returns game state, player info, and action handlers (selectCard, submitCard, nextRound, etc.)

#### Supabase Integration (`src/utils/api.ts`)
- Wraps Supabase client for all database operations
- Maps between Supabase row types (`GameRoomRow`, `PlayerRow`, etc.) and domain types
- Key functions:
  - `getRoomByCode()` - fetch game room and validate it exists
  - `getPlayersForRoom()` - fetch all players in the room
  - `getLatestRound()` / `createRound()` - round CRUD
  - `getHandForPlayer()` / `dealCardsToArtists()` - lyric card management
  - `submitLyricCard()` / `updateSubmissionWithSuno()` - submission workflow
  - `deriveProducerForRound()` - compute producer from join_order and round number
  - `awardPointToPlayer()` / `setWinner()` - scoring

#### Song Generation (`src/utils/suno.ts`)
- `requestSunoSong(vibeCardText, finalLyric)` - sends prompt to Suno API, returns task ID
- `pollSunoTask(taskId)` - polls task status until completion or timeout
- **Dev fallback**: If `VITE_SUNO_API_KEY` is missing, returns mock URLs so flows work without real API
- Wraps API calls and handles error states

#### Game Logic (`src/utils/gameLogic.ts`)
- Pure functions for game rules: card selection, lyric computation, timers, auto-submission logic
- `computeFinalLyric()` - merges template and filled blanks into final lyric
- `shouldAutoSubmit()` / `shouldMoveToGeneration()` - phase progression logic
- `formatTime()` - timer display formatting

#### Component Layer (`src/components/CacophonyGame.tsx`)
- **Main game UI** - renders all game phases with conditional logic
- Displays:
  - Vibe card (producer's current theme)
  - Player list with scores and roles
  - Lyric card selection with blank filling
  - Song player with play/pause controls
  - Submission list and voting UI
  - Results screen with timer

#### Type Definitions (`src/types/game.ts`)
- `GameState` - complete game state shape
- `Player` - player info (id, name, score, role, submission status)
- `PlayerHand` - lyric card in player's hand (from Supabase)
- `SongSubmission` - submission data with generated song URL and producer rating
- `GamePhase` - union type of all phases

#### Constants (`src/constants/gameData.ts`, `src/constants/lyricCardTemplates.ts`)
- `VIBE_CARDS` - list of vibe card strings
- `LYRIC_CARD_TEMPLATES` - templates with blank positions (e.g., "I [blank1] my [blank2]")
- `GAME_CONSTANTS` - config (hand size, timer duration, auto-submit delays)

### Data Flow

```
Supabase (single source of truth)
  ↓
api.ts (query/mutation wrappers)
  ↓
useGameState (hydrate + manage local state + poll for updates)
  ↓
CacophonyGame component (render UI + handle events)
  ↓ (events)
useGameState handlers (selectCard, submitCard, nextRound)
  ↓
api.ts mutations (updateSubmission, createRound)
  ↓
Supabase
```

## Database Schema (Supabase)

Key tables:
- `game_rooms` - room code, status, current round, target rounds
- `players` - player username, score, join order (for producer rotation)
- `game_rounds` - round number, producer ID, vibe card, status (selecting/listening/completed)
- `player_hands` - dealt lyric cards for each artist per round, `is_played` flag
- `submissions` - artist's filled lyric, Suno task ID/status, song URL, producer rating, winner flag

See `INIT_DB.md` and `schema.sql` for full schema and setup instructions.

## Environment Variables

Required in `.env` or `.env.local`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `VITE_SUNO_API_KEY` - Suno API key (optional; falls back to mock if missing)
- `VITE_ROOM_CODE` - Test room code (for local dev)
- `VITE_PLAYER_ID` - Current player's UUID (for local dev)
- `VITE_DEBUG_LOGS` - Set to 'true' to enable debug logs in utils

## Key Patterns & Conventions

- **Naming**: Database rows use snake_case (`player_id`, `game_room_id`); TypeScript uses camelCase
- **Error handling**: Wrapped in `getError()` in api.ts; errors stored in `gameState.error`
- **Async operations**: Use `async/await` in hooks; loading states managed via `gameState.loading`
- **Polling**: Manual polling via `setInterval` for submissions and Suno status (future: migrate to Supabase realtime)
- **Path aliases**: Use `@/` prefix (e.g., `@/utils`, `@/types`) configured in `vite.config.ts`

## Common Tasks

### Adding a new game phase
1. Add phase to `GamePhase` type in `src/types/game.ts`
2. Add render function in `CacophonyGame.tsx` (e.g., `renderMyPhase()`)
3. Update phase progression logic in `useGameState` → `derivePhase()`

### Adding new lyric cards
1. Update `LYRIC_CARD_TEMPLATES` in `src/constants/lyricCardTemplates.ts`
2. Templates use `[blank1]`, `[blank2]` placeholders; blanks are filled by players

### Adding new API operations
1. Write query/mutation in `src/utils/api.ts` using Supabase client
2. Wrap in `getError()` for consistent error handling
3. Import and call from `useGameState` hook

### Integrating real multiplayer updates
- Replace manual polling in `useGameState` with Supabase realtime subscriptions
- Use `supabase.from('table').on('*', callback)` to listen for changes
- Updates needed in: submissions polling, round status polling, player score updates

## Testing & Debugging

- **Dev server**: Opens browser automatically on `http://localhost:3000`
- **Debug logs**: Set `VITE_DEBUG_LOGS=true` to see console logs from api.ts, suno.ts
- **Lint errors**: Run `pnpm run lint` before committing
- **Type checking**: TypeScript runs on build; fix any type errors before submitting PR

## Recent Work

See `TODO.md` for feature checklist. Key in-progress items:
- Server-side submission timers (currently client-side only)
- Supabase realtime polling (currently manual polling)
- Card replenishment after use
- Lobby & join flow
- Host controls (pause, kick players)
- Mobile-friendly layout