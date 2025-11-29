# Cacophony Game 🎵🎮

> **A multiplayer music battle game where players compete to create the funniest AI-generated songs.**

Match wild music genres (vibe cards) with ridiculous lyrics (lyric cards) to make your friends laugh! Built with React, TypeScript, Supabase, and Suno AI.

---

## Quick Links

📚 **[Documentation](/docs)** - Complete guides and references
🚀 **[Quick Start](/docs/QUICK_START.md)** - Get running in 5 minutes
🎮 **[Game Guide](/docs/GAME_GUIDE.md)** - How to play
🏗️ **[Architecture](/docs/ARCHITECTURE.md)** - Technical overview
⚙️ **[Configuration](/docs/CONFIGURATION.md)** - All config options
📋 **[TODO & Roadmap](/docs/TODO.md)** - Feature tracking

---

## Features

✨ **Real Multiplayer** - 3-8 players per room
🎵 **AI Song Generation** - Powered by Suno AI
🃏 **583 Lyric Cards** - Pre-written humorous phrases
🎭 **103 Vibe Cards** - Wild genre combinations
🎯 **Turn-based Gameplay** - Producer and Artist roles rotate
⏱️ **Timed Rounds** - 60-second card selection
🏆 **Score Tracking** - Track winners across rounds
📱 **Responsive UI** - Works on desktop and mobile

---

## Game Overview

### How It Works

1. **Host creates a room** → Share 6-character code with friends
2. **Players join** → Enter room code and username
3. **Each round:**
   - **Producer** gets a vibe card (e.g., "A sad Country song about ______")
   - **Artists** select lyric cards to answer (e.g., "pizza delivery gone wrong")
   - **AI generates songs** combining vibe + lyrics
   - **Producer votes** for the funniest song
   - **Winner scores** a point!
4. **Game ends** after target rounds (default: 5)
5. **Highest score wins!**

---

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router DOM (routing)
- Lucide React (icons)

**Backend:**
- Supabase (PostgreSQL + Realtime)
- Suno API (AI music generation)

**Development:**
- pnpm (package manager)
- ESLint + Prettier
- TypeScript strict mode

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommend v20+)
- pnpm (or npm/yarn)
- Supabase account
- Suno API key

### Installation

```bash
# 1. Clone the repo
git clone <repository-url>
cd cacophony-game

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your Supabase and Suno credentials

# 4. Initialize database
# Run db/init.sql in Supabase SQL editor
# Optionally run db/seed_game.sql for test data

# 5. Start dev server
pnpm run dev
```

Visit `http://localhost:3000` and start playing!

**Detailed setup:** See [Quick Start Guide](/docs/QUICK_START.md)

---

## Documentation

### Getting Started
- 🚀 **[Quick Start](/docs/QUICK_START.md)** - Installation and setup
- 🎮 **[Game Guide](/docs/GAME_GUIDE.md)** - How to play, rules, strategy

### Technical Documentation
- 🏗️ **[Architecture](/docs/ARCHITECTURE.md)** - System design and data flow
- ⚙️ **[Configuration](/docs/CONFIGURATION.md)** - Environment variables and settings
- 📋 **[TODO & Roadmap](/docs/TODO.md)** - Feature tracking and future plans

### Legacy Documentation *(archived)*
- [CLAUDE.md](CLAUDE.md) - Original project guidance
- [INIT_DB.md](INIT_DB.md) - Database setup details
- [SPEC.md](SPEC.md) - Game specifications

---

## Project Structure

```
cursor-hcmc/
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── config/           # Configuration files
│   ├── services/         # External API wrappers
│   ├── utils/            # Utility functions
│   ├── constants/        # Static data
│   ├── types/            # TypeScript types
│   └── App.tsx           # Root component
├── db/                   # Database scripts
│   ├── init.sql          # Schema initialization
│   └── seed_game.sql     # Test data
├── docs/                 # Documentation
└── public/               # Static assets
```

---

## Development

### Available Scripts

```bash
# Start dev server
pnpm run dev

# Build for production
pnpm run build

# Run linter
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm exec tsc --noEmit
```

### Environment Variables

Create a `.env` file with:

```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUNO_API_KEY=your_suno_api_key

# Optional (development)
VITE_DEBUG_LOGS=true
VITE_ROOM_CODE=ABC123
```

See [`.env.example`](.env.example) for all available options.

---

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linter and tests
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Priority Features

Looking to contribute? These are high-impact features:

- **Supabase Realtime migration** (replace polling)
- **Final podium screen** (game end screen)
- **Mobile responsiveness** improvements
- **Authentication system** (user profiles)
- **Test coverage** (E2E and unit tests)

See [TODO.md](/docs/TODO.md) for full roadmap.

---

## Recent Updates

### November 29, 2025

**Major Changes:**
- ✅ **Lyric card system overhaul** - Removed fill-in-the-blank, now simple phrase selection
- ✅ **Centralized configuration** - All settings now in `gameConfig.ts`
- ✅ **Database-driven cards** - 583 lyric cards + 103 vibe cards in database
- ✅ **Documentation reorganization** - Split into focused guides in `/docs`
- ✅ **UI enhancements** - Clickable instruction tabs, password-protected room deletion

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [React](https://react.dev/)
- Database by [Supabase](https://supabase.com/)
- AI music by [Suno](https://suno.ai/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for creating musical chaos with friends**

*Have questions? Check the [documentation](/docs) or open an issue!*
