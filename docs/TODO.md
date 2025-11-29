# Cacophony Game - TODO & Roadmap 📋

> **Last Updated**: November 29, 2025

Feature tracking and roadmap for Cacophony Game.

## Legend
- ✅ **Completed**
- 🚧 **In Progress**
- 📋 **Planned**
- 💡 **Idea/Future**

---

## Core Game Features

### Round Loop
- ✅ Load room + players from Supabase, derive producer/artist roles
- ✅ Draw vibe card per round and display to all players
- ✅ Fetch player hand from `player_hands` and gate selection to owned cards
- ✅ Allow lyric card selection and submission validation
- ✅ Create submissions, mark `player_hands.is_played`, track submission counts
- ✅ Call Suno API (with dev fallback), store task ID/status/URL, poll for completion
- ✅ Playback generated song URL in listening phase
- ✅ Producer selects winner, mark `is_winner`, increment score
- ✅ Auto-refresh/poll for submissions and status updates
- 📋 **Enforce submission timer server-side** (auto-submit/advance on expiry)
- 📋 **Replace used lyric cards** to maintain hand size after each round

### Multi-Round / Game Progression
- ✅ Rotate producer by `join_order` and create next round with dealt hands
- 📋 **Honor `target_rounds`** and auto-finish game when reached
- 📋 **Final podium view** with top 3 players and scores

### Lobby / Session Management
- ✅ Lobby UI for host to create game and show join code
- ✅ Join flow for players entering join code (validate, error states, max players)
- ✅ Start game action when minimum players reached
- ✅ Unique join code generation
- ✅ Display current players in lobby (polling every 2s)
- ✅ Password-protected room deletion

### Host Controls
- ✅ Host pause/resume functionality
- ✅ Kick inactive players
- ✅ Mobile controller vs shared display layout
- 📋 **Change game settings** mid-game (rounds, timer)
- 📋 **Skip to next round** (admin control)

---

## UI/UX Improvements

### Current Session
- ✅ Better waiting/generation animations
- ✅ Synchronized audio playback across devices (host-driven, polled)
- ✅ Interactive instructions modal with clickable progress tabs
- ✅ Browse games page with active rooms list
- 📋 **Better mobile responsiveness**
- 📋 **Sound effects** for actions (card select, submit, win)
- 📋 **Background music** option
- 📋 **Dark mode toggle**
- 📋 **Accessibility improvements** (keyboard navigation, screen reader support)

### Game Experience
- 📋 **Animated card dealing**
- 📋 **Song preview** before full generation
- 📋 **Replay favorite moments**
- 📋 **Player avatars** (custom or generated)
- 📋 **Emoji reactions** during listening phase
- 📋 **Chat system** for banter
- 💡 **Voting animations** with confetti for winner

---

## Technical Improvements

### Architecture
- ✅ Centralized configuration system
- ✅ Environment-based config (40+ variables)
- ✅ Database-driven card system (vibe + lyric cards)
- 📋 **Migrate to Supabase Realtime** (replace polling)
- 📋 **Redis caching** for frequently accessed data
- 📋 **GraphQL API** for more efficient queries
- 💡 **Microservices architecture** for song generation
- 💡 **WebSocket server** for true realtime

### Data & Infrastructure
- ✅ Supabase helper layer for all DB operations
- ✅ Type-safe TypeScript models
- ✅ Suno API wrapper with fallback
- 📋 **Tighten RLS/auth policies** (currently allow-all)
- 📋 **Add authentication** (Supabase Auth integration)
- 📋 **Rate limiting** for API endpoints
- 📋 **Database indexes** optimization
- 📋 **CDN integration** for audio files
- 💡 **Separate song queue service**

### Testing & Quality
- 📋 **Integration tests** for round flow
- 📋 **E2E tests** with Playwright/Cypress
- 📋 **Unit tests** for game logic
- 📋 **Suno failure test cases**
- 📋 **Load testing** for multiplayer scenarios
- 📋 **Error boundary components**
- 📋 **Analytics integration** (Plausible/Posthog)
- 📋 **Monitoring** (Sentry for errors)

### Developer Experience
- ✅ Complete documentation split into focused files
- ✅ .env.example with all variables
- 📋 **Storybook** for component development
- 📋 **API documentation** auto-generation
- 📋 **GitHub Actions** CI/CD pipeline
- 📋 **Pre-commit hooks** for linting/formatting
- 💡 **Local development Docker setup**

---

## Features & Game Modes

### Card System
- ✅ 103 vibe cards in database
- ✅ 583 lyric cards in database
- ✅ Simple phrase selection (no blank-filling)
- 📋 **User-submitted cards** (moderation required)
- 📋 **Card packs/themes** (holidays, pop culture, etc.)
- 📋 **Card voting system** (players vote on new cards)
- 💡 **Dynamic card generation** (AI-generated cards)
- 💡 **Card marketplace** (buy/sell card packs)

### Game Modes
- ✅ Standard mode (5 rounds, 60s timer)
- 📋 **Quick Play** (3 rounds, 30s timer)
- 📋 **Marathon** (10+ rounds)
- 📋 **Tournament Mode** (bracket-style, multiple rounds)
- 💡 **Teams Mode** (2v2 or 3v3)
- 💡 **Sudden Death** (elimination-style)
- 💡 **Themed Nights** (specific genres only)
- 💡 **Remix Mode** (build on previous songs)

### Social Features
- 📋 **Player profiles** with stats
- 📋 **Friends system**
- 📋 **Leaderboards** (global, weekly, friends)
- 📋 **Achievements/Badges**
- 📋 **Replay gallery** (save best songs)
- 📋 **Share to social media**
- 💡 **Twitch integration** for streamers
- 💡 **Discord bot** for game invites

### Song Management
- 📋 **Download generated songs**
- 📋 **Favorite/bookmark songs**
- 📋 **Song history** per player
- 📋 **Community highlights** (most popular songs)
- 💡 **Song remixing** with different styles
- 💡 **Collaborative playlists**

---

## Platform & Distribution

### Web
- ✅ Progressive Web App (PWA) capable
- 📋 **Install prompt** for mobile
- 📋 **Offline mode** for cached assets
- 📋 **Push notifications** for turn updates

### Mobile
- 💡 **React Native app** (iOS/Android)
- 💡 **Native song playback**
- 💡 **Haptic feedback**

### Desktop
- 💡 **Electron wrapper** for native app
- 💡 **System tray integration**
- 💡 **Global hotkeys**

---

## Business & Monetization

### Free Features
- ✅ Core game (3-8 players)
- ✅ Basic card packs
- ✅ Public rooms

### Premium Features (Future)
- 💡 **Pro subscription** ($5/month)
  - Unlimited private rooms
  - Custom card packs
  - Advanced analytics
  - Priority Suno generation
  - Remove ads (if added)

- 💡 **One-time purchases**
  - Premium card packs ($2-5)
  - Custom themes ($3)
  - Profile customization ($1-3)

- 💡 **Creator tools** ($10/month)
  - Create & sell card packs
  - Tournament hosting
  - Custom branding

---

## Content & Community

### Content Creation
- 📋 **Blog** with strategy guides
- 📋 **Video tutorials**
- 📋 **Twitch/YouTube integration**
- 💡 **Creator program** (revenue sharing)

### Community
- 📋 **Discord server**
- 📋 **Subreddit** (/r/CacophonyGame)
- 📋 **Twitter** for updates
- 💡 **User-generated content** showcase
- 💡 **Monthly tournaments** with prizes

---

## Known Issues & Bugs

### High Priority
- 🚧 **Polling lag** in large games (>6 players)
  - *Solution*: Migrate to Supabase Realtime
- 🚧 **Song generation timeout** on slow connections
  - *Solution*: Increase timeout, add retry logic
- 🚧 **Desync issues** when network is unstable
  - *Solution*: Add heartbeat + reconnection logic

### Medium Priority
- 📋 **Mobile keyboard** overlaps UI on small screens
- 📋 **Audio playback issues** on Safari iOS
- 📋 **Room codes sometimes collide** (rare)
  - *Solution*: Increase code length or use better randomization

### Low Priority
- 📋 **Styling inconsistencies** across browsers
- 📋 **Animation jank** on low-end devices
- 📋 **Typos** in card text (need community reporting)

---

## Recent Completions (November 2025)

### Week of Nov 25-29
- ✅ **Lyric card system overhaul**
  - Changed from fill-in-the-blank to simple phrase selection
  - Database-driven cards (583 lyric cards)
  - Updated UI to remove blank-filling

- ✅ **Centralized configuration**
  - Created `gameConfig.ts` with 40+ values
  - Environment variable-based config
  - Validation on startup

- ✅ **Documentation reorganization**
  - Split into focused guides (Quick Start, Game Guide, Architecture, etc.)
  - Moved to `/docs` folder
  - Updated README with new structure

- ✅ **UI enhancements**
  - Clickable instruction modal tabs
  - Password-protected room deletion
  - Browse games page

---

## Contribution Priorities

Want to help? Here are the most impactful features to work on:

1. **Supabase Realtime migration** (replaces polling, huge perf win)
2. **Final podium/game end screen** (completes core game loop)
3. **Mobile responsiveness** (expands player base)
4. **Authentication system** (required for profiles/leaderboards)
5. **Test coverage** (E2E tests for critical flows)

See [Development Guide](./DEVELOPMENT.md) for contribution guidelines.

---

## Long-term Vision (2026+)

- 💡 **AI-powered features**
  - Smart card recommendations based on producer preferences
  - Auto-generated themed card packs
  - Sentiment analysis for optimal matchmaking

- 💡 **Global platform**
  - Multi-language support (i18n)
  - Regional leaderboards
  - Localized card packs

- 💡 **Ecosystem**
  - API for third-party integrations
  - Plugin system for custom game modes
  - White-label licensing for events

---

**Have ideas? Open an issue or PR!**
