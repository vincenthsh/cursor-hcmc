# Quick Start Guide 🚀

Get Cacophony Game up and running in 5 minutes.

## Prerequisites

- **Node.js** v18+ (recommend v20+)
- **pnpm** (or npm/yarn)
- **Supabase** account ([sign up here](https://supabase.com))
- **Suno API** key ([get one here](https://suno.ai))

## Installation Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cacophony-game

# Install dependencies
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUNO_API_KEY=your_suno_api_key_here

# Optional (for development)
VITE_DEBUG_LOGS=true
VITE_ROOM_CODE=ABC123
```

### 3. Initialize Database

1. Log into your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Copy and run the contents of `db/init.sql`
4. (Optional) Run `db/seed_game.sql` for test data

### 4. Start Development Server

```bash
pnpm run dev
```

The app will open at `http://localhost:3000`

## Quick Test

1. Open the app in your browser
2. Click "Create Room" - you'll get a 6-character room code
3. Open another browser window/tab
4. Click "Join Game" and enter the room code
5. Start the game and play!

## Next Steps

- **Configure the game**: See [Configuration Guide](./CONFIGURATION.md)
- **Learn the architecture**: See [Architecture Overview](./ARCHITECTURE.md)
- **Start developing**: See [Development Guide](./DEVELOPMENT.md)
- **Deploy to production**: See [Deployment Guide](./DEPLOYMENT.md)

## Troubleshooting

### "Cannot connect to Supabase"

- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check that you ran `db/init.sql` in your Supabase project

### "Suno API errors"

- Verify your `VITE_SUNO_API_KEY` is active
- Check your Suno API quota hasn't been exceeded
- Set `VITE_DEBUG_LOGS=true` to see detailed error messages

### More help

See the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues.
