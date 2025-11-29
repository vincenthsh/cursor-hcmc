# Cacophony Game 🎵

A multiplayer music battle game built with React, TypeScript, and Tailwind CSS. Players compete to create the funniest song combinations by matching music genres with humorous lyrics.

## Features

- **Real-time multiplayer simulation**: Play against AI opponents
- **Turn-based gameplay**: Rotate between Producer and Artist roles
- **Dynamic song generation**: Simulated AI song creation process
- **Interactive UI**: Beautiful, responsive interface with animations
- **Score tracking**: Keep track of winners across multiple rounds
- **Timer system**: Add excitement with countdown timers

## Game Rules

1. **Producer Phase**: One player is chosen as the Producer
2. **Card Selection**: Players select lyric cards that match the vibe
3. **Song Generation**: AI creates songs based on the combinations
4. **Voting**: The Producer picks the funniest/most creative song
5. **Scoring**: Winner gets a point and roles rotate for the next round

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cacophony-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── components/         # React components
│   ├── CacophonyGame.tsx
│   └── index.ts
├── hooks/             # Custom React hooks
│   ├── useGameState.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   ├── game.ts
│   └── index.ts
├── utils/             # Utility functions
│   ├── gameLogic.ts
│   └── index.ts
├── constants/         # Game constants and data
│   ├── gameData.ts
│   └── index.ts
├── App.tsx            # Main App component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Development

### Adding New Features

1. **New Game Mechanics**: Add to `src/utils/gameLogic.ts`
2. **New Components**: Add to `src/components/`
3. **New Types**: Add to `src/types/game.ts`
4. **New Constants**: Add to `src/constants/gameData.ts`

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for commit messages

### Custom Hooks

The game logic is separated into custom hooks for better maintainability:

- `useGameState`: Manages all game state and game flow logic

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Future Enhancements

- [ ] Real multiplayer support with WebSockets
- [ ] Actual AI song generation integration
- [ ] Sound effects and background music
- [ ] Custom game rooms and lobbies
- [ ] Player profiles and statistics
- [ ] Mobile app version
- [ ] Different game modes and themes
