
-- ============================================
-- CACOPHONY GAME - MINIMAL SCHEMA (FINAL)
-- No functions, no triggers - just tables
-- All logic in your application code
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. GAME ROOMS TABLE
-- ============================================
CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
    current_round INTEGER DEFAULT 0,
    target_rounds INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_game_rooms_code ON game_rooms(room_code);

-- ============================================
-- 2. PLAYERS TABLE
-- ============================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    score INTEGER DEFAULT 0,
    join_order INTEGER NOT NULL, -- 1, 2, 3, 4... (for rotating producer)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(game_room_id, username),
    UNIQUE(game_room_id, join_order)
);

CREATE INDEX idx_players_game_room ON players(game_room_id);

-- ============================================
-- 3. GAME ROUNDS TABLE
-- ============================================
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    producer_id UUID NOT NULL REFERENCES players(id), -- Who is producer this round
    vibe_card_text TEXT NOT NULL, -- "A Country ballad about ______" (from JSON)
    status VARCHAR(20) DEFAULT 'selecting', -- selecting, listening, completed
    winner_id UUID REFERENCES players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(game_room_id, round_number)
);

CREATE INDEX idx_rounds_game_room ON game_rounds(game_room_id);
CREATE INDEX idx_rounds_producer ON game_rounds(producer_id);

-- ============================================
-- 4. PLAYER HANDS TABLE
-- Tracks which lyric cards each player has for a round
-- ============================================
CREATE TABLE player_hands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Lyric card data (from JSON)
    lyric_card_text TEXT NOT NULL, -- Display text or template
    template TEXT, -- Template string: "My {0} left me for {1}"
    blank_count INTEGER DEFAULT 0,
    
    position INTEGER NOT NULL, -- 0, 1, 2, 3, 4 (position in hand)
    is_played BOOLEAN DEFAULT FALSE, -- TRUE when this card is submitted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(round_id, player_id, position)
);

CREATE INDEX idx_hands_round ON player_hands(round_id);
CREATE INDEX idx_hands_player ON player_hands(player_id);
CREATE INDEX idx_hands_round_player ON player_hands(round_id, player_id);

-- ============================================
-- 5. SUBMISSIONS TABLE
-- ============================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    hand_card_id UUID REFERENCES player_hands(id), -- Which card from their hand (optional reference)
    
    -- Lyric card data (from JSON)
    lyric_card_text TEXT NOT NULL, -- Template: "My {0} left me for {1}"
    filled_blanks JSONB, -- {"0": "therapist", "1": "my cat"}
    
    -- Suno song generation
    suno_task_id TEXT, -- Suno API task ID
    song_url TEXT, -- Generated song URL
    song_status VARCHAR(20) DEFAULT 'pending', -- pending, generating, completed, failed
    song_error TEXT, -- Error message if failed
    
    -- Producer rating (NUMERIC as requested)
    producer_rating NUMERIC(3,1) CHECK (producer_rating >= 0 AND producer_rating <= 5), -- 0.0 to 5.0
    is_winner BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(round_id, player_id)
);

CREATE INDEX idx_submissions_round ON submissions(round_id);
CREATE INDEX idx_submissions_player ON submissions(player_id);
CREATE INDEX idx_submissions_suno ON submissions(suno_task_id) WHERE suno_task_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (Simple - allow all)
-- ============================================

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON game_rooms FOR ALL USING (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true);
CREATE POLICY "Allow all" ON game_rounds FOR ALL USING (true);
CREATE POLICY "Allow all" ON player_hands FOR ALL USING (true);
CREATE POLICY "Allow all" ON submissions FOR ALL USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE game_rooms IS 'Game sessions';
COMMENT ON TABLE players IS 'Players in each game - producer role determined by round';
COMMENT ON TABLE game_rounds IS 'Each round - producer_id determines who is producer';
COMMENT ON TABLE player_hands IS 'Cards dealt to each player for each round (5 cards per artist)';
COMMENT ON TABLE submissions IS 'Artist submissions with filled blanks and Suno song data';

COMMENT ON COLUMN players.join_order IS 'Determines producer rotation: round 1 = join_order 1, round 2 = join_order 2, etc';
COMMENT ON COLUMN game_rounds.producer_id IS 'The player who is producer for this round';
COMMENT ON COLUMN player_hands.template IS 'Template string with placeholders like "My {0} left me for {1}"';
COMMENT ON COLUMN player_hands.position IS 'Card position in hand (0-4)';
COMMENT ON COLUMN player_hands.is_played IS 'TRUE when player submits this card';
COMMENT ON COLUMN submissions.hand_card_id IS 'Optional reference to the card from player_hands that was played';
COMMENT ON COLUMN submissions.filled_blanks IS 'JSONB: {"0": "answer1", "1": "answer2"}';
COMMENT ON COLUMN submissions.suno_task_id IS 'Suno API task ID for polling';
COMMENT ON COLUMN submissions.producer_rating IS 'Numeric rating from producer (0.0 to 5.0)';
