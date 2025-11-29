# Architecture Overview 🏗️

Technical architecture and design decisions for Cacophony Game.

## Tech Stack

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router DOM** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Supabase** - PostgreSQL database with realtime capabilities
- **Suno API** - AI music generation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Fast package manager

## Project Structure

```
cursor-hcmc/
├── src/
│   ├── components/          # React components
│   │   ├── CacophonyGame.tsx       # Main game UI (all phases)
│   │   ├── GameRouter.tsx          # Route management
│   │   ├── InstructionsModal.tsx   # Tutorial overlay
│   │   ├── LandingPage.tsx         # Home page
│   │   ├── Lobby.tsx               # Pre-game lobby
│   │   └── BrowseGames.tsx         # Room browser
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameState.ts         # Main game logic & state
│   │   └── useLobbyState.ts        # Lobby state management
│   │
│   ├── config/              # Configuration
│   │   ├── gameConfig.ts           # Centralized config (40+ values)
│   │   └── suno.ts                 # Suno API configuration
│   │
│   ├── services/            # External service wrappers
│   │   └── sunoApi.ts              # Suno API client
│   │
│   ├── utils/               # Utility functions
│   │   ├── api.ts                  # Supabase queries/mutations
│   │   ├── gameLogic.ts            # Game rule functions
│   │   ├── roomCode.ts             # Room code generation
│   │   ├── session.ts              # Session management
│   │   └── supabase.ts             # Supabase client instance
│   │
│   ├── constants/           # Static data
│   │   ├── gameData.ts             # Vibe cards array
│   │   └── lyricCardTemplates.ts   # (deprecated - now in DB)
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── game.ts                 # All game types
│   │
│   ├── App.tsx              # Root component & routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles & Tailwind
│
├── db/                      # Database scripts
│   ├── init.sql                    # Schema + RLS policies
│   └── seed_game.sql               # Test data (vibe/lyric cards)
│
├── docs/                    # Documentation (this folder)
├── public/                  # Static assets
└── [config files]           # tsconfig, vite, tailwind, etc.
```

## Data Flow

### High-Level Flow

```
┌─────────────┐
│   Browser   │  User Action
│     UI      │ ────────────┐
└─────────────┘             │
                            ▼
┌─────────────────────────────────┐
│   React Component               │
│   (CacophonyGame.tsx)           │
│   - Renders UI                  │
│   - Handles events              │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   useGameState Hook             │
│   - Manages state               │
│   - Coordinates async ops       │
│   - Polls for updates           │
└─────────────────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│   api.ts     │  │  sunoApi.ts  │
│  (Supabase)  │  │   (Suno)     │
└──────────────┘  └──────────────┘
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Suno API   │
│  (Database)  │  │  (AI Music)  │
└──────────────┘  └──────────────┘
```

### Request Flow Example: Submitting a Card

1. **User clicks "Submit Card"** → Component event handler
2. **submitCard()** called in useGameState
3. **submitLyricCard()** in api.ts → Insert to `submissions` table
4. **markCardPlayed()** in api.ts → Update `player_hands.is_played`
5. **Suno API call** → Generate song with vibe + lyric
6. **Poll for completion** → Check Suno task status every 3s
7. **Update submission** → Save song URL to database
8. **State update** → React re-renders with new song
9. **UI shows song player** → User can play the generated song

## State Management

### Game State Structure

```typescript
interface GameState {
  // Meta
  gamePhase: GamePhase          // Current phase
  loading: boolean
  error: string | undefined

  // Room Info
  roomId: string | undefined
  hostPlayerId: string | undefined
  isPaused: boolean

  // Round Info
  currentRound: number
  roundId: string | undefined
  vibeCard: string

  // Players
  players: Player[]              // All players with scores

  // Current Player's Hand
  yourHand: PlayerHand[]         // 5 lyric cards
  selectedCard: PlayerHand | null
  filledBlanks: Record<string, string>

  // Submissions
  submissions: SongSubmission[]  // All artist submissions

  // Listening Phase
  currentSongIndex: number
  isPlaying: boolean
  listeningCueAt: number | null

  // Generation
  generationProgress: number
}
```

### State Updates

**Polling Strategy** (until Supabase Realtime is integrated):
- Active game: Poll every 2.5 seconds
- Paused game: Poll every 5 seconds
- Lobby: Poll every 2 seconds

**State Transitions**:
```
waiting → selecting → generating → listening → results → selecting (next round)
```

## Database Architecture

### Schema Design Principles

1. **Immutable History**: Rounds and submissions are never deleted, only marked complete
2. **Referential Integrity**: Foreign keys ensure data consistency
3. **Soft Deletes**: Use status flags instead of DELETE operations
4. **Denormalization**: Store `vibe_card_text` in rounds for fast reads

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `vibe_cards` | Static catalog | `id`, `card_text` |
| `lyric_cards` | Static catalog | `id`, `card_text` |
| `game_rooms` | Active sessions | `room_code`, `status`, `current_round` |
| `players` | Room members | `username`, `score`, `join_order` |
| `game_rounds` | Round state | `round_number`, `producer_id`, `vibe_card_text`, `status` |
| `player_hands` | Dealt cards | `lyric_card_text`, `position`, `is_played` |
| `submissions` | Artist submissions | `lyric_card_text`, `song_url`, `is_winner` |

See [Database Schema](./DATABASE.md) for detailed schema.

## Component Architecture

### Component Hierarchy

```
App
├── GameRouter
│   ├── LandingPage
│   │   └── InstructionsModal
│   ├── Lobby
│   │   └── useLobbyState
│   ├── CacophonyGame
│   │   └── useGameState
│   └── BrowseGames
```

### Component Responsibilities

**App.tsx**
- Root component
- Provides routing context
- Global error boundary (future)

**GameRouter.tsx**
- Route definitions
- Navigation logic
- Query parameter handling

**LandingPage.tsx**
- Home screen UI
- Create/Join room forms
- Instructions modal trigger

**Lobby.tsx**
- Pre-game waiting room
- Player list with ready states
- Start game button (host only)

**CacophonyGame.tsx**
- Main game UI
- Renders all game phases
- Handles all user interactions
- Displays scores, cards, songs

**InstructionsModal.tsx**
- Tutorial overlay
- 7-step walkthrough
- Clickable progress tabs

## Hook Architecture

### useGameState (Primary Hook)

**Responsibilities**:
- Load and manage game state
- Handle all game actions (select card, submit, vote, etc.)
- Coordinate API calls
- Manage timers and polling
- Trigger Suno song generation
- Update submissions with song URLs

**Key Functions**:
```typescript
const {
  gameState,           // Current state
  yourPlayer,          // Current player info
  producer,            // Current round producer
  selectCard,          // Artist selects lyric card
  submitCard,          // Artist submits for generation
  togglePlaySong,      // Play/pause song
  selectWinner,        // Producer votes
  nextRound,           // Advance to next round
  pauseGame,           // Host pauses
  kickPlayer,          // Host removes player
} = useGameState(roomCode, playerId)
```

### useLobbyState

**Responsibilities**:
- Manage lobby state
- Poll for new players
- Check if game can start (3+ players)
- Provide start game action

## API Layer

### Separation of Concerns

**api.ts (Database)**:
- Pure Supabase operations
- CRUD for all tables
- Error handling with getError()
- Debug logging

**sunoApi.ts (AI Service)**:
- Suno API wrapper
- Task creation and polling
- Progress callbacks
- Fallback to mock mode

### Error Handling Strategy

```typescript
// Consistent error wrapping
const getError = (message: string, error: any) => {
  return new Error(`${message}: ${error?.message || error}`)
}

// Usage
try {
  const room = await getRoomByCode(code)
} catch (error) {
  throw getError('Failed to load room', error)
}
```

## Configuration System

All configuration centralized in `src/config/gameConfig.ts`:

```typescript
export const GAME_MECHANICS = {
  timerDuration: parseInt(env.VITE_GAME_TIMER_DURATION || '60'),
  handSize: parseInt(env.VITE_GAME_HAND_SIZE || '5'),
  // ... 35+ more values
}
```

**Benefits**:
- Single source of truth
- Environment-based configuration
- Type-safe access
- Easy testing with different values

See [Configuration Guide](./CONFIGURATION.md) for all options.

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Routes loaded on-demand
2. **Memo Callbacks**: useCallback for event handlers
3. **Selective Re-renders**: Proper React key usage
4. **Debounced Polling**: Avoid excessive database queries
5. **Parallel Requests**: Fetch players + round + submissions together

### Bundle Size

Current production build: ~180KB gzipped
- React + React DOM: ~45KB
- React Router: ~20KB
- Tailwind (purged): ~15KB
- App code: ~100KB

## Security Model

### Current (Development)

- **RLS Policies**: Permissive (allow all)
- **Authentication**: None (room codes only)
- **Data Validation**: Client-side only

### Production Recommendations

1. **Add Auth**: Implement Supabase Auth
2. **Tighten RLS**: Restrict queries by authenticated user
3. **Rate Limiting**: Prevent API abuse
4. **Input Sanitization**: Server-side validation
5. **HTTPS Only**: Enforce secure connections

## Scalability Considerations

### Current Limits

- **Players per room**: 8 (configurable)
- **Concurrent rooms**: Limited by database connections
- **Song generation**: Limited by Suno API quota

### Scaling Strategy

1. **Database**: Use Supabase connection pooling
2. **Song Generation**: Implement queue system
3. **Realtime**: Switch from polling to Supabase Realtime
4. **CDN**: Serve generated songs from CDN
5. **Horizontal Scaling**: Stateless frontend, easy to replicate

## Future Architecture Improvements

### Planned Enhancements

- [ ] **Supabase Realtime**: Replace polling with websockets
- [ ] **Redis Cache**: Cache frequently accessed data
- [ ] **Service Workers**: Offline support
- [ ] **GraphQL API**: More efficient data fetching
- [ ] **Microservices**: Separate song generation service

### Technical Debt

- Polling instead of realtime subscriptions
- No end-to-end tests
- Limited error boundaries
- No analytics/monitoring
- Client-side only validation

## Development Workflow

### Local Development

```bash
# Start dev server
pnpm run dev

# Type checking
pnpm exec tsc --noEmit

# Linting
pnpm run lint

# Format
pnpm run format
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/my-feature

# Commit with conventional commits
git commit -m "feat: add new game mode"

# Push and create PR
git push origin feature/my-feature
```

See [Development Guide](./DEVELOPMENT.md) for detailed workflow.

## Related Documentation

- [Quick Start](./QUICK_START.md) - Getting started
- [Configuration](./CONFIGURATION.md) - All config options
- [Database Schema](./DATABASE.md) - Complete schema reference
- [API Reference](./API_REFERENCE.md) - Function documentation
- [Development Guide](./DEVELOPMENT.md) - Contributing guidelines
