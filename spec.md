# Feature Specification: Cacophony Multiplayer Party Game

**Feature Branch**: `001-multiplayer-party-game`
**Created**: 2025-11-27
**Status**: Draft
**Input**: User description: "Develop Cacophony, an online, jackbox-style multiplayer party game where players combine silly lyric prompts with genre cards and the game generates short AI-performed songs that everyone listens to and votes on"

## Database (Supabase)

- **Schema**: `game_rooms` (join code, status, rounds), `players` (username, score, join_order), `game_rounds` (round_number, producer_id, vibe_card_text, winner_id, status), `player_hands` (5 dealt lyric cards per artist, template, blank_count, is_played flag), `submissions` (filled blanks, Suno task state, song URL, producer rating, winner flag).
- **Purpose**: Enforces card ownership server-side, validates submissions against dealt hands, supports producer rotation via `join_order`, and stores Suno task status/URLs for synchronized playback.
- **RLS**: Tables have permissive policies for now (all true) to unblock prototyping; tighten when auth arrives.
- **Flows covered**: lobby creation and join (FR-001/002/003/024/025), producer rotation (FR-004), dealt hands and submission validation (FR-006/009/027), vibe display and round tracking (FR-007/008/020/021/022), Suno generation tracking and playback (FR-013/014/015/016/019), scoring and winner reveal (FR-017/018/023), submission status counting (FR-010/011/012).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Join Game Lobby (Priority: P1)

A game host wants to start a new game session and invite friends to join without requiring account creation.

**Why this priority**: Core foundation - without lobby creation and joining, no game can be played. This is the absolute minimum viable product that enables the first playable experience.

**Independent Test**: Can be fully tested by creating a lobby, generating a join code, and having multiple players join using that code. Delivers the value of getting players into the same game session ready to play.

**Acceptance Scenarios**:

1. **Given** a user opens the game, **When** they select "Host Game", **Then** a unique 4-6 character join code is generated and displayed on the lobby screen
2. **Given** a lobby exists with join code "ABC123", **When** another player enters "ABC123" in the join screen, **Then** they are added to the lobby and visible to all players
3. **Given** 3 players are in a lobby, **When** player 4 joins, **Then** the lobby updates in real-time showing all 4 players
4. **Given** a lobby has 8 players, **When** a 9th player tries to join, **Then** they receive an error message "Lobby is full (max 8 players)"
5. **Given** a player is in the lobby, **When** they view the screen, **Then** they see all current players, the join code, and the host's game settings

---

### User Story 2 - Play Single Round of Lyric Matching (Priority: P1)

Players want to submit lyric cards to match the Producer's vibe card and hear the resulting AI-generated songs.

**Why this priority**: Core gameplay loop - this is the essential interactive experience that makes the game fun. Without this, it's just a lobby with no game.

**Independent Test**: Can be tested independently by starting a game with 3 players, having the Producer draw a vibe card, Artists submit lyric cards, generating songs, playing them back, and awarding a point. Delivers the complete core game experience.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the first round begins, **Then** one player is designated Producer and all others are Artists
2. **Given** the round starts, **When** the Producer's screen updates, **Then** they see a random "Vibe Card" (e.g., "A heartbreaking Country ballad about ______")
3. **Given** all players can see the Vibe Card, **When** Artists view their screens, **Then** each sees their hand of Lyric Cards and can select one
4. **Given** an Artist has 5 Lyric Cards, **When** they tap one card, **Then** it is highlighted as their selection
5. **Given** an Artist has selected a card, **When** they confirm submission, **Then** the lobby shows they have submitted (e.g., "2/3 players submitted")
6. **Given** all Artists have submitted OR the timer reaches zero, **When** the submission phase ends, **Then** the game shows a "studio recording" screen with progress indicator
7. **Given** all songs are generated, **When** the Listening Party begins, **Then** the Producer can play each song one at a time
8. **Given** the Producer is listening to songs, **When** they select the funniest one, **Then** the winning Artist is revealed and receives 1 point ("Platinum Record")
9. **Given** a round completes, **When** the next round begins, **Then** the Producer role rotates to the next player

---

### User Story 3 - Complete Multi-Round Game with Scoring (Priority: P2)

Players want to play multiple rounds and see who wins at the end with a final scoreboard.

**Why this priority**: Enhances the core experience with competition and progression, but not essential for testing the core gameplay mechanic. Can be added after validating single-round mechanics work.

**Independent Test**: Can be tested by playing a complete 3-round game with 4 players, rotating Producers, tracking scores, and displaying the final podium. Delivers the value of a complete competitive game experience.

**Acceptance Scenarios**:

1. **Given** a host is in the lobby, **When** they configure game settings, **Then** they can set the number of rounds (e.g., 3, 5, or 7 rounds)
2. **Given** the game is running, **When** players view the screen, **Then** they see the current round number (e.g., "Round 2 of 5")
3. **Given** multiple rounds have been played, **When** a round ends, **Then** the scoreboard shows each player's total Platinum Records
4. **Given** all rounds have been completed, **When** the final round ends, **Then** a podium screen shows the top 3 players with their scores
5. **Given** the game has ended, **When** players view the podium, **Then** they can choose to "Play Again" or "Return to Lobby"

---

### User Story 4 - Enhanced Game Experience and Controls (Priority: P3)

The host wants to control game flow and players want visual feedback during waiting periods.

**Why this priority**: Polish and quality-of-life improvements that make the game feel more professional, but not critical for core gameplay validation.

**Independent Test**: Can be tested by the host pausing/resuming the game, kicking inactive players, and observing animated waiting screens. Delivers improved user experience and host control.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** the host starts the game, **Then** all players immediately see the first round begin
2. **Given** a game is in progress, **When** the host pauses, **Then** all players see a "Game Paused" screen
3. **Given** a player is inactive for 2 rounds, **When** the host views the player list, **Then** they can remove that player from the game
4. **Given** songs are being generated, **When** players view the waiting screen, **Then** they see playful animations (e.g., "mixing tracks", "auto-tuning vocals")
5. **Given** the Producer is listening to a song, **When** it plays, **Then** all players hear the same audio simultaneously

---

### Edge Cases

- What happens when a player disconnects mid-round?
  - Their card is not submitted, Producer sees "Player disconnected" for that submission
  - Game continues with remaining players
- What happens when the AI song generation fails for one submission?
  - Show "Generation failed" notification to Producer
  - Producer can skip that song or retry generation
  - Game continues with successfully generated songs
- What happens when the Producer disconnects?
  - Producer role is immediately transferred to the next player in rotation
  - Current round continues with new Producer selecting the winner
- What happens when all Artists disconnect, leaving only the Producer?
  - Game automatically ends, returning all players to lobby
  - Host is notified "Not enough players to continue"
- What happens when two players submit the exact same lyric card?
  - Both submissions are allowed - each generates a unique song with different AI interpretation
- What happens when the timer expires but some Artists haven't submitted?
  - Non-submitted players get a random card auto-selected from their hand
  - Game proceeds to song generation with all submissions
- What happens when a player tries to join with an invalid code?
  - Show error message "Lobby not found - check your code"
  - Allow them to try again

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support 3 to 8 players in a single game lobby
- **FR-002**: System MUST generate unique join codes for each lobby that remain valid until the game ends
- **FR-003**: System MUST allow lobby creation without user authentication or login
- **FR-004**: System MUST designate one player as Producer (judge) per round and rotate this role each round
- **FR-005**: System MUST assign all non-Producer players as Artists for each round
- **FR-006**: System MUST provide each Artist with a hand of Lyric Cards at game start
- **FR-007**: System MUST allow the Producer to draw one Vibe Card per round containing genre and lyric setup with a fill-in-the-blank
- **FR-008**: System MUST display the Vibe Card to all players simultaneously when drawn
- **FR-009**: System MUST allow each Artist to select one Lyric Card from their hand per round
- **FR-010**: System MUST enforce a countdown timer for Artist card submissions (default: 60 seconds)
- **FR-011**: System MUST track submission status showing how many Artists have submitted their cards
- **FR-012**: System MUST combine Vibe Card (genre + setup) and each Artist's Lyric Card into a song generation prompt
- **FR-013**: System MUST send song generation prompts to an AI API endpoint and receive audio files
- **FR-014**: System MUST generate 10-15 second song clips for each Artist submission
- **FR-015**: System MUST display a waiting/progress screen while songs are being generated
- **FR-016**: System MUST allow the Producer to play generated songs one at a time in the Listening Party phase
- **FR-017**: System MUST allow the Producer to select one song as the winner
- **FR-018**: System MUST reveal the winning Artist and award them one point (Platinum Record)
- **FR-019**: System MUST play the winning song when the Artist is revealed
- **FR-020**: System MUST track each player's score (total Platinum Records) across all rounds
- **FR-021**: System MUST allow the host to configure the number of rounds before starting the game
- **FR-022**: System MUST automatically progress through the configured number of rounds
- **FR-023**: System MUST display a final podium showing the top 3 players when all rounds complete
- **FR-024**: System MUST allow the host to start the game when 3 or more players are in the lobby
- **FR-025**: System MUST update all player screens in real-time as game state changes (lobby joins, submissions, song generation progress, etc.)
- **FR-026**: System MUST provide different views for lobby screen (shared display) and individual player controllers (mobile/personal devices)
- **FR-027**: System MUST replace used Lyric Cards in an Artist's hand after each round to maintain hand size
- **FR-028**: System MUST prevent duplicate join codes from being generated for concurrent active lobbies

### Key Entities

- **Lobby**: Represents a game session. Attributes: unique join code, host player, list of players (3-8), game settings (max rounds), current game state (waiting/in-progress/ended)
- **Player**: Represents a participant. Attributes: display name, role (host/producer/artist), current score (Platinum Records), connection status, hand of Lyric Cards
- **Vibe Card**: Represents the genre/theme prompt. Attributes: genre (e.g., "Country ballad"), setup text with blank (e.g., "A heartbreaking song about ______"), card ID
- **Lyric Card**: Represents a fill-in phrase. Attributes: text content (e.g., "A wet pair of socks"), card ID
- **Round**: Represents one complete cycle of gameplay. Attributes: round number, current Producer player, list of Artist submissions, generated songs, winner, round state (vibe-reveal/submission/generation/listening/verdict)
- **Submission**: Represents an Artist's card choice. Attributes: Artist player, selected Lyric Card, generated song audio URL, generation status (pending/complete/failed)
- **Game**: Represents the overall match. Attributes: associated Lobby, list of Rounds, total rounds configured, current round number, final rankings

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Three players can successfully create a lobby, join using a code, and start a game within 2 minutes
- **SC-002**: A complete single round (Vibe reveal → submissions → song generation → listening → verdict) completes in under 5 minutes with 4 players
- **SC-003**: Song generation for all Artist submissions (up to 7 songs) completes within 90 seconds of submission deadline
- **SC-004**: System supports 8 concurrent players with all screens updating in real-time (< 1 second latency)
- **SC-005**: 95% of song generation requests succeed on first attempt
- **SC-006**: Players can hear generated songs with clear audio quality and synchronized playback across all devices
- **SC-007**: Players successfully complete a 3-round game from lobby creation to final podium in under 20 minutes
- **SC-008**: Zero authentication friction - players join and play without creating accounts or logging in
- **SC-009**: Host can configure game settings (rounds) and control game flow (start/pause) with immediate effect
- **SC-010**: 90% of players can understand the game rules and complete their first round without external help

## Assumptions

- Players will use personal devices (smartphones, tablets, laptops) as individual controllers
- A shared display (TV, monitor, or additional device) will show the lobby screen visible to all players
- Players have stable internet connectivity during gameplay
- An AI song generation API is available that can produce 10-15 second audio clips from text prompts
- The AI API can handle multiple concurrent requests (up to 7 songs per round)
- Players are in the same physical location or video call and can hear audio from the shared display
- Join codes remain valid only for the duration of the game session
- Lyric Card and Vibe Card decks are pre-populated with curated content
- Default timer values can be adjusted by the host if needed
- Browser-based implementation allowing cross-platform access without app installation
- WebSocket or similar technology will enable real-time updates for all players

## Dependencies

- Third-party AI song generation API with text-to-music capabilities
- Real-time communication infrastructure for synchronized game state across devices
- Audio streaming capability for playback of generated songs
- Pre-built card content library (Vibe Cards and Lyric Cards)

## Constraints

- Game sessions are ephemeral - no persistent user data or game history stored
- Maximum 8 players per lobby to ensure reasonable song generation time
- Song generation must complete fast enough to maintain game pacing (< 90 seconds)
- All players must use devices with audio playback capability
- Network latency must be low enough for real-time gameplay (< 1 second)

## Out of Scope

- User accounts, profiles, or authentication
- Persistent game history or statistics
- Custom card creation by players
- Text or voice chat between players
- Spectator mode for non-playing viewers
- Replay or save generated songs after the game ends
- Cross-game progression or achievements
- Mobile native apps (initial version is web-based)
- Accessibility features (screen readers, colorblind modes) - to be added in future iterations
- Internationalization and localization - initial version English-only
