-- Seed data for Cacophony schema (init.sql)
-- Use in Supabase SQL editor or psql

-- Optional: clear existing data (comment out if you want to keep data)
TRUNCATE submissions, player_hands, game_rounds, players, game_rooms RESTART IDENTITY CASCADE;

-- 1) Create a room
WITH room AS (
  INSERT INTO game_rooms (room_code, status, current_round, target_rounds)
  VALUES ('AB1234', 'in_progress', 1, 3)
  RETURNING id
),
-- 2) Add players (join_order drives producer rotation)
players_ins AS (
  INSERT INTO players (game_room_id, username, score, join_order)
  SELECT room.id, p.username, p.score, p.join_order
  FROM room
  JOIN (
    VALUES
      ('Host', 0, 1),
      ('Alice', 1, 2),
      ('Bob', 0, 3),
      ('Cara', 2, 4)
  ) AS p(username, score, join_order) ON TRUE
  RETURNING *
),
-- 3) Create round 1 (Host is producer, Cara will win)
round_ins AS (
  INSERT INTO game_rounds (game_room_id, round_number, producer_id, vibe_card_text, status, winner_id)
  VALUES (
    (SELECT id FROM room),
    1,
    (SELECT id FROM players_ins WHERE username = 'Host'),
    'A heartbreaking country ballad about ____',
    'listening',
    (SELECT id FROM players_ins WHERE username = 'Cara')
  )
  RETURNING *
),
-- 4) Deal hands to artists (Host is producer, so no hand)
hands AS (
  INSERT INTO player_hands (round_id, player_id, lyric_card_text, template, blank_count, position, is_played)
  SELECT r.id, pl.id, h.lyric_card_text, h.template, h.blank_count, h.position, h.is_played
  FROM round_ins r
  JOIN players_ins pl ON pl.username IN ('Alice', 'Bob', 'Cara')
  JOIN (
    VALUES
      -- Alice
      ('Alice', 0, 'My ____ left me for ____', 'My {0} left me for {1}', 2, FALSE),
      ('Alice', 1, 'I am addicted to ____', 'I am addicted to {0}', 1, FALSE),
      ('Alice', 2, 'My therapist said ____', 'My therapist said {0}', 1, TRUE),
      -- Bob
      ('Bob', 0, 'Last night I saw ____', 'Last night I saw {0}', 1, FALSE),
      ('Bob', 1, 'This song is about ____', 'This song is about {0}', 1, TRUE),
      ('Bob', 2, 'Dancing with ____', 'Dancing with {0}', 1, FALSE),
      -- Cara
      ('Cara', 0, 'I wrote this for ____', 'I wrote this for {0}', 1, TRUE),
      ('Cara', 1, 'My heart beats like ____', 'My heart beats like {0}', 1, FALSE),
      ('Cara', 2, 'Goodbye to ____', 'Goodbye to {0}', 1, FALSE)
  ) AS h(username, position, lyric_card_text, template, blank_count, is_played)
    ON pl.username = h.username
  RETURNING *
)
-- 5) Create submissions for artists (one per artist)
INSERT INTO submissions (
  round_id,
  player_id,
  hand_card_id,
  lyric_card_text,
  filled_blanks,
  suno_task_id,
  song_url,
  song_status,
  song_error,
  producer_rating,
  is_winner
)
SELECT
  (SELECT id FROM round_ins),
  pl.id,
  h.id,
  h.template,
  sb.filled_blanks,
  sb.suno_task_id,
  sb.song_url,
  sb.song_status,
  sb.song_error,
  sb.producer_rating,
  sb.is_winner
FROM players_ins pl
JOIN (
  VALUES
    ('Alice', 2, '{"0": "therapy", "1": "their cat"}'::jsonb, 'task_alice', 'https://example.com/alice.mp3', 'completed', NULL, 4.2, FALSE),
    ('Bob', 1, '{"0": "tacos"}'::jsonb, 'task_bob', 'https://example.com/bob.mp3', 'completed', NULL, 3.8, FALSE),
    ('Cara', 0, '{"0": "a cardboard cutout of Shrek"}'::jsonb, 'task_cara', 'https://example.com/cara.mp3', 'completed', NULL, 4.9, TRUE)
) AS sb(username, hand_position, filled_blanks, suno_task_id, song_url, song_status, song_error, producer_rating, is_winner)
  ON pl.username = sb.username
JOIN hands h ON h.player_id = pl.id AND h.position = sb.hand_position;

-- Quick sanity checks
SELECT 'Rooms', count(*) FROM game_rooms;
SELECT 'Players', count(*) FROM players;
SELECT 'Rounds', count(*) FROM game_rounds;
SELECT 'Hands', count(*) FROM player_hands;
SELECT 'Submissions', count(*) FROM submissions;
