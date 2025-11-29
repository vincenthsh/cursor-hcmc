# Cacophony TODO

## Core Round Loop
- [x] Load room + players from Supabase, derive producer/artist roles
- [x] Draw vibe card per round and display to all players
- [x] Fetch player hand from `player_hands` and gate selection to owned cards
- [x] Allow lyric card selection with blank inputs and submission validation
- [x] Create submissions, mark `player_hands.is_played`, and track submission counts
- [x] Call Suno API (with dev fallback), store task ID/status/URL, and poll for completion
- [x] Playback generated song URL in listening phase
- [x] Producer selects winner, mark `is_winner`, and increment score
- [ ] Enforce submission timer server-side (auto-submit/auto-advance on expiry)
- [x] Auto-refresh/poll or Supabase realtime to update submissions and status bars
- [ ] Replace used lyric cards to maintain hand size after each round

## Multi-Round / Game Progression
- [x] Rotate producer by `join_order` and create next round with dealt hands
- [ ] Honor `target_rounds` and auto-finish game when reached
- [ ] Final podium view with top 3 players and scores

## Lobby / Session Management
- [x] Lobby UI for host to create game and show join code (React Router + Landing + Lobby components)
- [x] Join flow for players entering join code (validate, error states, max players)
- [x] Start game action when minimum players reached; reflect `game_rooms.status`
- [x] Ensure unique join code generation and display current players in lobby (polling every 2s)

## Host Controls / Polish
- [x] Host pause/resume; kick inactive players (polling-based)
- [x] Better waiting/generation animations; synchronized audio playback across devices (host-driven, polled)
- [x] Mobile controller vs shared display layout split

## Data & Infra
- [x] Supabase helper layer for rounds/hands/submissions + Suno wrapper
- [x] Type refactor to UUIDs and hand/submission models
- [ ] Tighten RLS/auth (currently allow-all policies)
- [ ] Add integration tests or manual test scripts for round flow and Suno failure cases
- [ ] Document expected env vars and local run steps in README
