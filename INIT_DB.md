Final Schema Documentation with player_hands
📊 5 Tables Total
game_rooms (Game session)
    ↓
players (Who's playing)
    ↓
game_rounds (Each round, vibe card)
    ↓
player_hands (5 cards dealt to each artist) ← ADDED BACK
    ↓
submissions (Artist submissions + songs)

🎴 Why player_hands Table?
What it does:

Stores the 5 lyric cards dealt to each artist at the start of each round
Tracks which card was played (is_played = true)
Prevents players from using cards they don't have
Historical record of what cards each player had

Benefits:

✅ Server-side validation (player can only submit cards they have)
✅ Prevent cheating (can't submit random cards)
✅ Track which specific card was played
✅ Audit trail for debugging
✅ Can show other players "Player 1 has submitted" without revealing the card


🎯 Flow 1: Load UI Based on Player Role (UPDATED)
With player_hands table:
javascript// Given: player_id (UUID) and round_id (UUID)

// STEP 1: Get the round and check if user is the producer
const { data: round } = await supabase
  .from('game_rounds')
  .select(`
    id,
    round_number,
    vibe_card_text,
    producer_id,
    status
  `)
  .eq('id', round_id)
  .single();

// STEP 2: Determine role
const isProducer = (round.producer_id === player_id);

// STEP 3: Load appropriate UI
if (isProducer) {
  // PRODUCER VIEW
  console.log('You are the Producer!');
  console.log('Vibe Card:', round.vibe_card_text);
  
  // Show vibe card UI
  // Wait for artist submissions
  
} else {
  // ARTIST VIEW
  console.log('You are an Artist!');
  console.log('Vibe Card:', round.vibe_card_text);
  
  // Load YOUR cards from player_hands table
  const { data: myHand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('round_id', round_id)
    .eq('player_id', player_id)
    .order('position');
  
  // Display the 5 cards
  console.log('Your hand:', myHand);
  // [
  //   { position: 0, template: "My {0} left me for {1}", is_played: false },
  //   { position: 1, template: "I'm addicted to {0}", is_played: false },
  //   ...
  // ]
  
  // Show lyric card selection UI
}
✅ Key Difference:

Instead of loading random cards from JSON on frontend
Cards are loaded from player_hands table (server controls what you have)
More secure, prevents cheating


📝 Dealing Cards to Artists
When a round starts:
javascript// After creating the round, deal cards to all artists

// STEP 1: Get all artists (non-producers)
const { data: round } = await supabase
  .from('game_rounds')
  .select('id, producer_id, game_room_id')
  .eq('id', round_id)
  .single();

const { data: allPlayers } = await supabase
  .from('players')
  .select('id')
  .eq('game_room_id', round.game_room_id);

const artists = allPlayers.filter(p => p.id !== round.producer_id);

// STEP 2: Load lyric card templates from JSON
import lyricCards from './lyric-card-templates.json';
const allTemplates = lyricCards.lyricCardTemplates;

// STEP 3: Deal 5 cards to each artist
for (const artist of artists) {
  // Shuffle and pick 5
  const shuffled = [...allTemplates].sort(() => 0.5 - Math.random());
  const handCards = shuffled.slice(0, 5);
  
  // Insert into player_hands
  const cardsToInsert = handCards.map((card, index) => ({
    round_id: round_id,
    player_id: artist.id,
    lyric_card_text: card.display, // "My _____ left me for _____"
    template: card.template, // "My {0} left me for {1}"
    blank_count: card.blank_count,
    position: index
  }));
  
  await supabase
    .from('player_hands')
    .insert(cardsToInsert);
}

console.log('Cards dealt to all artists!');

🎵 Flow 2: Submit Card & Generate Song (UPDATED)
With player_hands validation:
javascript// STEP 1: Artist selects a card from their hand
const selectedCardPosition = 2; // They clicked the 3rd card (index 2)

// STEP 2: Get the card from player_hands
const { data: selectedCard } = await supabase
  .from('player_hands')
  .select('*')
  .eq('round_id', round_id)
  .eq('player_id', player_id)
  .eq('position', selectedCardPosition)
  .eq('is_played', false) // Make sure it hasn't been played
  .single();

if (!selectedCard) {
  throw new Error('Invalid card selection!');
}

// STEP 3: Player fills in the blanks
const filledBlanks = {
  "0": "therapist",
  "1": "my cat"
};

// STEP 4: Create submission
const { data: submission } = await supabase
  .from('submissions')
  .insert({
    round_id: round_id,
    player_id: player_id,
    hand_card_id: selectedCard.id, // Reference to the card they played
    lyric_card_text: selectedCard.template,
    filled_blanks: filledBlanks,
    song_status: 'pending'
  })
  .select()
  .single();

// STEP 5: Mark the card as played
await supabase
  .from('player_hands')
  .update({ is_played: true })
  .eq('id', selectedCard.id);

// STEP 6: Compute final lyric (in your code)
function computeFinalLyric(template, blanks) {
  let result = template;
  Object.keys(blanks).forEach(key => {
    result = result.replace(`{${key}}`, blanks[key]);
  });
  return result;
}

const finalLyric = computeFinalLyric(
  selectedCard.template,
  filledBlanks
);
// Result: "My therapist left me for my cat"

// STEP 7: Call Suno API
const sunoResponse = await fetch('https://api.suno.ai/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: `${round.vibe_card_text}\\n\\nLyrics: ${finalLyric}`,
  })
});

const sunoData = await sunoResponse.json();

// STEP 8: Save Suno task ID
await supabase
  .from('submissions')
  .update({
    suno_task_id: sunoData.task_id,
    song_status: 'generating'
  })
  .eq('id', submission.id);

// STEP 9: Poll for completion (same as before)
pollSunoTask(sunoData.task_id, submission.id);
✅ Key Improvements:

Validates that player actually has this card
Prevents submitting a card they don't have
Tracks which specific card was played
Marks card as is_played = true


🎯 Checking Submission Status
See who has submitted (without revealing cards):
javascript// Get all artists for this round
const { data: round } = await supabase
  .from('game_rounds')
  .select('producer_id, game_room_id')
  .eq('id', round_id)
  .single();

const { data: allPlayers } = await supabase
  .from('players')
  .select('id, username')
  .eq('game_room_id', round.game_room_id);

const artists = allPlayers.filter(p => p.id !== round.producer_id);

// Check who has submitted
const { data: submissions } = await supabase
  .from('submissions')
  .select('player_id')
  .eq('round_id', round_id);

const submittedPlayerIds = submissions.map(s => s.player_id);

// Display status
artists.forEach(artist => {
  const hasSubmitted = submittedPlayerIds.includes(artist.id);
  console.log(`${artist.username}: ${hasSubmitted ? '✓ Submitted' : '⏳ Waiting...'}`);
});

// Show "2/3 players submitted"
console.log(`${submissions.length}/${artists.length} submitted`);

🎴 View All Cards in Hand
Show player their hand with submission status:
javascriptconst { data: myHand } = await supabase
  .from('player_hands')
  .select('*')
  .eq('round_id', round_id)
  .eq('player_id', player_id)
  .order('position');

myHand.forEach(card => {
  console.log(`Card ${card.position + 1}: ${card.lyric_card_text}`);
  console.log(`  Template: ${card.template}`);
  console.log(`  Blanks: ${card.blank_count}`);
  console.log(`  Status: ${card.is_played ? 'PLAYED ✓' : 'Available'}`);
  console.log('---');
});

// Example output:
// Card 1: My _____ left me for _____
//   Template: My {0} left me for {1}
//   Blanks: 2
//   Status: Available
// ---
// Card 2: I'm addicted to _____
//   Template: I'm addicted to {0}
//   Blanks: 1
//   Status: PLAYED ✓  (user submitted this one)
// ---
// ...

⭐ Flow 3: Producer Rating (Unchanged)
Same as before - works exactly the same way!
javascript// Verify user is producer
const { data: round } = await supabase
  .from('game_rounds')
  .select('producer_id')
  .eq('id', round_id)
  .single();

if (round.producer_id !== current_user_id) {
  throw new Error('Only the producer can rate!');
}

// Rate submission
await supabase
  .from('submissions')
  .update({ producer_rating: 4.5 })
  .eq('id', submission_id);

📊 Complete Table Summary
TablePurposeKey Fieldsgame_roomsGame sessionsroom_code, status, current_roundplayersPlayers in gameusername, score, join_ordergame_roundsEach roundvibe_card_text, producer_id, winner_idplayer_handsCards dealt to artiststemplate, position, is_playedsubmissionsArtist submissionsfilled_blanks, suno_task_id, song_url, producer_rating

🔍 Useful Queries
Get player's unplayed cards:
javascriptconst { data: availableCards } = await supabase
  .from('player_hands')
  .select('*')
  .eq('round_id', round_id)
  .eq('player_id', player_id)
  .eq('is_played', false)
  .order('position');
Check if all artists have submitted:
javascriptconst { data: round } = await supabase
  .from('game_rounds')
  .select('producer_id, game_room_id')
  .eq('id', round_id)
  .single();

const { data: players } = await supabase
  .from('players')
  .select('id')
  .eq('game_room_id', round.game_room_id);

const artistCount = players.filter(p => p.id !== round.producer_id).length;

const { count: submissionCount } = await supabase
  .from('submissions')
  .select('*', { count: 'exact', head: true })
  .eq('round_id', round_id);

const allSubmitted = (submissionCount === artistCount);
Get submission with card details:
javascriptconst { data: submissions } = await supabase
  .from('submissions')
  .select(`
    *,
    player:players(username),
    card:player_hands(lyric_card_text, template)
  `)
  .eq('round_id', round_id);

✅ Schema Verification for All Flows
✅ Flow 1: Load UI Based on Role

game_rounds.producer_id → determine role
game_rounds.vibe_card_text → show vibe card
player_hands → load artist's cards

✅ Flow 2: Suno Generation & Polling

player_hands → validate card selection
submissions.suno_task_id → track task
submissions.song_status → track progress
submissions.song_url → store result

✅ Flow 3: Producer Rating

game_rounds.producer_id → verify producer
submissions.producer_rating → numeric rating (0.0-5.0)

All flows are fully supported! 🎉