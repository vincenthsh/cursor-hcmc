# Karaoke Lyrics Feature

This document explains the karaoke-style synchronized lyrics feature implementation in the Cacophony Game.

## Overview

The karaoke feature displays lyrics synchronized with music playback during gameplay and in the game history. Lyrics highlight and auto-scroll as the song plays, creating a karaoke-like experience.

## How It Works

### 1. **Song Generation Flow**

When a player submits their lyric card, the following happens:

```typescript
// In src/hooks/useGameState.ts (lines 290-389)

1. Generate music via Suno API
   ↓
2. Poll for completion with progress updates
   ↓
3. Extract audio URL and audio ID from Suno response
   ↓
4. Fetch timestamped lyrics using taskId + audioId
   ↓
5. Store everything in database (audio URL, audio ID, timestamped lyrics)
```

**Key Code Section** ([src/hooks/useGameState.ts:321-349](src/hooks/useGameState.ts#L321-L349)):

```typescript
// Extract the audio URL and ID from the Suno response
const track = result.data.response?.sunoData?.[0]
const audioUrl = track?.audioUrl || track?.streamAudioUrl
const audioId = track?.id

// Fetch timestamped lyrics if audioId is available
let timestampedLyrics = null
if (audioId) {
  try {
    timestampedLyrics = await sunoApiService.getTimestampedLyrics(taskId, audioId)
  } catch (lyricsErr) {
    console.warn('Failed to fetch timestamped lyrics:', lyricsErr)
  }
}

// Save to database
await updateSubmissionWithSuno(submission.id, {
  song_status: 'completed',
  song_url: audioUrl,
  suno_task_id: taskId,
  suno_audio_id: audioId || null,
  timestamped_lyrics: timestampedLyrics,
})
```

### 2. **Suno API Integration**

The Suno API service ([src/services/sunoApi.ts:276-302](src/services/sunoApi.ts#L276-L302)) provides:

```typescript
async getTimestampedLyrics(taskId: string, audioId: string): Promise<SunoLyricSegment[]>
```

This method:
- Calls Suno's `/api/v1/generate/get-timestamped-lyrics` endpoint (POST)
- Receives aligned words with timestamps from Suno
- Transforms them into our `LyricSegment` format:
  ```typescript
  { text: string, startTime: number, endTime: number }
  ```

**API Request Format**:
```json
{
  "taskId": "5c79****be8e",
  "audioId": "e231****-****-****-****-****8cadc7dc"
}
```

**API Response Format**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "alignedWords": [
      {
        "word": "[Verse] Waggin'",
        "success": true,
        "startS": 1.36,
        "endS": 1.79,
        "palign": 0
      }
      // ... more words
    ],
    "waveformData": [0, 1, 0.5, 0.75],
    "hootCer": 0.38,
    "isStreamed": false
  }
}
```

### 3. **Database Schema**

New fields added to `submissions` table ([db/init.sql:178-183](db/init.sql#L178-L183)):

```sql
suno_audio_id TEXT,           -- Suno audio ID for timestamped lyrics
timestamped_lyrics JSONB,     -- Array of {text, startTime, endTime}
```

**Example stored data**:
```json
[
  {"text": "[Verse] Waggin'", "startTime": 1.36, "endTime": 1.79},
  {"text": "my tail", "startTime": 1.79, "endTime": 2.15},
  {"text": "in the sunshine", "startTime": 2.15, "endTime": 2.89}
]
```

### 4. **KaraokeLyrics Component**

Located at [src/components/KaraokeLyrics.tsx](src/components/KaraokeLyrics.tsx)

**Features**:
- ✨ **Highlighted active lyric** with cyan glow effect
- 📜 **Auto-scrolling** to keep active lyric centered
- 🎨 **Visual states**:
  - Past lyrics: dimmed gray (`text-gray-500`)
  - Current lyric: bright cyan with glow (`text-cyan-300`, scale 110%, text-shadow)
  - Future lyrics: light gray (`text-gray-400`)
- 🔄 **Smooth transitions** between lyric segments

**Usage**:
```tsx
<KaraokeLyrics
  lyrics={timestampedLyrics}
  currentTime={audioCurrentTime}
  className="my-4"
/>
```

**How it works**:
1. Receives `currentTime` from audio element's `timeupdate` event
2. Finds active lyric segment where `currentTime >= startTime && currentTime < endTime`
3. Applies styling and auto-scrolls to active segment
4. Updates smoothly as playback continues

### 5. **Integration Points**

#### A. Listening Phase ([src/components/CacophonyGame.tsx:331-341](src/components/CacophonyGame.tsx#L331-L341))

Shows karaoke during active gameplay:

```tsx
{currentSong.timestampedLyrics && currentSong.timestampedLyrics.length > 0 ? (
  <KaraokeLyrics
    lyrics={currentSong.timestampedLyrics}
    currentTime={currentAudioTime}
    className="my-4"
  />
) : (
  <div className="inline-block bg-black/30 px-6 py-3 rounded-lg">
    <p className="text-xl font-semibold text-cyan-300">{currentSong.lyric}</p>
  </div>
)}
```

#### B. Game History ([src/components/GameHistoryDrawer.tsx:202-222](src/components/GameHistoryDrawer.tsx#L202-L222))

Shows karaoke for historical songs:

```tsx
{playingAudio === submission.id &&
 submission.timestampedLyrics &&
 submission.timestampedLyrics.length > 0 ? (
  <KaraokeLyrics
    lyrics={submission.timestampedLyrics}
    currentTime={audioCurrentTimes[submission.id] || 0}
    className="my-2"
  />
) : (
  <p className="text-sm text-gray-400 italic">"{submission.lyric}"</p>
)}
```

#### C. Audio Time Tracking

**Main Game** ([src/components/CacophonyGame.tsx:133-154](src/components/CacophonyGame.tsx#L133-L154)):
```typescript
const [currentAudioTime, setCurrentAudioTime] = useState(0)

useEffect(() => {
  const audio = audioRef.current
  if (!audio || !currentSong?.audioUrl) return

  const updateTime = () => setCurrentAudioTime(audio.currentTime)
  audio.addEventListener('timeupdate', updateTime)

  // ... play/pause logic

  return () => {
    audio.removeEventListener('timeupdate', updateTime)
  }
}, [currentSong?.audioUrl, gameState.isPlaying, gameState.listeningCueAt])
```

**Game History** ([src/components/GameHistoryDrawer.tsx:59-70](src/components/GameHistoryDrawer.tsx#L59-L70)):
```typescript
const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({})

audio.addEventListener('timeupdate', () => {
  setAudioCurrentTimes(prev => ({ ...prev, [submissionId]: audio.currentTime }))
})
```

## Testing the Feature

### Prerequisites

1. **Suno API Key**: Set `VITE_SUNO_API_KEY` in your `.env` file
   ```bash
   VITE_SUNO_API_KEY=your_actual_suno_api_key
   ```

2. **Database Migration**: Run [db/init.sql](db/init.sql) on your Supabase database
   ```sql
   -- The migration blocks will automatically add the new columns:
   -- - suno_audio_id TEXT
   -- - timestamped_lyrics JSONB
   ```

### Test Procedure

#### Test 1: Normal Gameplay Flow

1. Start a game and progress to the lyric selection phase
2. Submit a lyric card as an artist
3. Wait for song generation to complete (monitor console logs):
   ```
   [useGameState] Fetching timestamped lyrics for {taskId, audioId}
   [useGameState] Successfully fetched timestamped lyrics {count: X}
   ```
4. When the listening phase starts, verify:
   - ✅ Karaoke component displays instead of static lyrics
   - ✅ Lyrics highlight in sync with audio
   - ✅ Auto-scrolling keeps active lyric centered
   - ✅ Visual transitions are smooth

#### Test 2: Fallback Behavior

1. **Scenario A**: Lyrics fetch fails
   - Check console for: `[useGameState] Failed to fetch timestamped lyrics`
   - Verify static lyrics display instead
   - Song playback still works normally

2. **Scenario B**: No lyrics available (older songs)
   - Static lyrics display
   - No errors in console

#### Test 3: Game History

1. Complete a round with karaoke-enabled songs
2. Open Game History drawer (History button in header)
3. Expand a completed round
4. Click "Play Song" on a submission
5. Verify:
   - ✅ Karaoke displays when song plays
   - ✅ Lyrics sync correctly
   - ✅ Switching between songs works
   - ✅ Each song tracks its own playback time

### Debugging

**Enable Debug Logs**:
```bash
# In .env
VITE_DEBUG_LOGS=true
```

**Check Database**:
```sql
-- Verify timestamped lyrics are stored
SELECT
  id,
  suno_audio_id,
  jsonb_array_length(timestamped_lyrics) as lyric_count,
  song_status
FROM submissions
WHERE timestamped_lyrics IS NOT NULL;
```

**Common Issues**:

| Issue | Cause | Solution |
|-------|-------|----------|
| No karaoke display | Lyrics not fetched | Check console for errors, verify audioId exists |
| Lyrics out of sync | Wrong currentTime | Verify audio timeupdate events firing |
| Static lyrics show | timestampedLyrics is null/empty | Check Suno API response, verify DB storage |
| Fetch fails | Wrong taskId/audioId | Log values before API call |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Submits Lyrics                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Suno API: Generate Music                        │
│              POST /api/v1/generate                           │
│              Returns: taskId                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Poll for Completion                             │
│              GET /api/v1/generate/record-info                │
│              Returns: audioUrl, audioId, track info          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Fetch Timestamped Lyrics                        │
│              POST /api/v1/generate/get-timestamped-lyrics    │
│              Body: {taskId, audioId}                         │
│              Returns: alignedWords[] with timestamps         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Store in Database                               │
│              submissions table:                              │
│              - song_url                                      │
│              - suno_audio_id                                 │
│              - timestamped_lyrics (JSONB)                    │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Display in UI                                   │
│              ┌──────────────────┬──────────────────┐        │
│              │  Listening Phase │  Game History    │        │
│              │  (Live Playback) │  (Past Rounds)   │        │
│              └──────────────────┴──────────────────┘        │
│              KaraokeLyrics Component                         │
│              - Sync with audio.currentTime                   │
│              - Highlight active lyric                        │
│              - Auto-scroll                                   │
└─────────────────────────────────────────────────────────────┘
```

## File Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| [src/hooks/useGameState.ts](src/hooks/useGameState.ts#L330-L341) | Song generation & lyrics fetching | `useGameState()` |
| [src/services/sunoApi.ts](src/services/sunoApi.ts#L276-L302) | Suno API integration | `getTimestampedLyrics()` |
| [src/components/KaraokeLyrics.tsx](src/components/KaraokeLyrics.tsx) | Karaoke display component | `KaraokeLyrics` |
| [src/components/CacophonyGame.tsx](src/components/CacophonyGame.tsx#L331-L341) | Main game UI integration | `CacophonyGame` |
| [src/components/GameHistoryDrawer.tsx](src/components/GameHistoryDrawer.tsx#L202-L222) | History UI integration | `GameHistoryDrawer` |
| [src/types/game.ts](src/types/game.ts#L13-L17) | TypeScript types | `LyricSegment` |
| [src/types/suno.ts](src/types/suno.ts#L38-L61) | Suno API types | `SunoTimestampedLyricsResponse` |
| [src/utils/api.ts](src/utils/api.ts#L312-L323) | Database operations | `updateTimestampedLyrics()` |
| [db/init.sql](db/init.sql#L139-L153) | Database schema | SQL migrations |

## API Reference

### Suno API Endpoint

**Endpoint**: `POST /api/v1/generate/get-timestamped-lyrics`

**Request**:
```json
{
  "taskId": "string",
  "audioId": "string"
}
```

**Response**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "alignedWords": [
      {
        "word": "string",
        "success": true,
        "startS": 1.36,
        "endS": 1.79,
        "palign": 0
      }
    ],
    "waveformData": [0, 1, 0.5],
    "hootCer": 0.38,
    "isStreamed": false
  }
}
```

**Documentation**: https://docs.sunoapi.org/suno-api/get-timestamped-lyrics

## Future Enhancements

Potential improvements to consider:

1. **Retry Logic**: Automatically retry lyrics fetch if it fails initially
2. **Background Fetch**: Fetch lyrics in background after song generation completes
3. **Lyrics Editor**: Allow manual correction of misaligned timestamps
4. **Multi-language Support**: Handle lyrics in different languages
5. **Export Feature**: Download lyrics with timestamps (SRT/LRC format)
6. **Accessibility**: Screen reader support for karaoke display
7. **Performance**: Virtualize long lyric lists for better performance
8. **Theming**: Customizable karaoke colors and effects

## Troubleshooting

### Lyrics Not Displaying

**Check 1**: Verify data flow
```typescript
// In browser console during listening phase
console.log(currentSong.timestampedLyrics)
// Should show array of {text, startTime, endTime}
```

**Check 2**: Verify database
```sql
SELECT timestamped_lyrics FROM submissions WHERE id = 'submission_id';
```

**Check 3**: Check API response
- Enable `VITE_DEBUG_LOGS=true`
- Look for Suno API logs in console

### Lyrics Out of Sync

**Issue**: Lyrics highlight too early/late

**Solution**:
- Check audio element's `currentTime` is updating
- Verify `timeupdate` event is firing
- Check if timestamps from Suno are accurate

### Performance Issues

**Issue**: UI lags when displaying many lyric segments

**Solution**:
- Limit number of rendered segments (show only ±5 from current)
- Use `React.memo()` for KaraokeLyrics component
- Debounce scroll updates

## Summary

The karaoke feature is now fully integrated into your Cacophony Game! It:

✅ Fetches timestamped lyrics automatically after song generation
✅ Displays synchronized lyrics during gameplay
✅ Works in game history for past rounds
✅ Gracefully falls back to static lyrics if unavailable
✅ Stores lyrics in the database for persistence

The implementation is production-ready and thoroughly documented for future maintenance and enhancement.
