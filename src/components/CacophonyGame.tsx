import {
  Clock,
  Music,
  Pause,
  Play,
  SkipForward,
  Trophy,
  Users,
} from 'lucide-react'
import { useGameState } from '@/hooks'

const CacophonyGame = () => {
  const {
    gameState,
    yourPlayer,
    producer,
    submittedCount,
    totalArtists,
    currentSong,
    startNewRound,
    selectCard,
    submitCard,
    togglePlaySong,
    nextSong,
    selectWinner,
    nextRound,
    formatTime,
  } = useGameState()

  const renderWaiting = () => (
    <div className="text-center py-20">
      <Music className="w-24 h-24 mx-auto mb-6 text-purple-500 animate-pulse" />
      <h2 className="text-3xl font-bold mb-4">Getting Ready...</h2>
      <p className="text-gray-400">Tune your instruments</p>
    </div>
  )

  const renderSelecting = () => (
    <div className="max-w-4xl mx-auto">
      {/* Vibe Card Display */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-xl shadow-2xl transform rotate-1">
          <h3 className="text-sm uppercase tracking-wider text-purple-200 mb-2">
            Vibe Card
          </h3>
          <p className="text-2xl font-bold text-white">{gameState.vibeCard}</p>
        </div>
      </div>

      {/* Timer and Status */}
      <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="font-mono text-xl">{formatTime()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          <span className="text-lg">
            {submittedCount}/{totalArtists} submitted
          </span>
        </div>
      </div>

      {yourPlayer?.isProducer ? (
        <div className="text-center py-12 bg-gray-800 rounded-xl border-2 border-yellow-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2">You're the Producer!</h3>
          <p className="text-gray-400">Wait for the artists to submit their lyric cards...</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {gameState.players
              .filter((p) => !p.isProducer)
              .map((p) => (
                <div
                  key={p.id}
                  className={`px-4 py-2 rounded-lg ${
                    p.submitted ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  {p.name} {p.submitted ? '✓' : '...'}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold mb-4 text-center">
            {yourPlayer?.submitted ? 'Card Submitted! ✓' : 'Choose Your Lyric Card'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {gameState.yourHand.map((card, idx) => (
              <button
                key={idx}
                onClick={() => selectCard(card)}
                disabled={yourPlayer?.submitted}
                className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
                  gameState.selectedCard === card
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 ring-4 ring-cyan-400 shadow-2xl'
                    : 'bg-gray-800 hover:bg-gray-700'
                } ${
                  yourPlayer?.submitted
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="text-sm text-gray-400 mb-2">Lyric Card #{idx + 1}</div>
                <div className="font-semibold">{card}</div>
              </button>
            ))}
          </div>
          {!yourPlayer?.submitted && (
            <button
              onClick={submitCard}
              disabled={!gameState.selectedCard}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
            >
              Submit Card
            </button>
          )}
        </div>
      )}
    </div>
  )

  const renderGenerating = () => (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="mb-8">
        <Music className="w-32 h-32 mx-auto mb-6 text-purple-500 animate-spin" />
        <h2 className="text-3xl font-bold mb-4">Studio Recording in Progress...</h2>
        <p className="text-gray-400 mb-8">AI musicians are creating your masterpieces</p>
      </div>

      <div className="bg-gray-800 rounded-full h-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 transition-all duration-300 flex items-center justify-end pr-4"
          style={{ width: `${gameState.generationProgress}%` }}
        >
          <span className="text-white font-bold text-sm">
            {Math.round(gameState.generationProgress)}%
          </span>
        </div>
      </div>
    </div>
  )

  const renderListening = () => (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">🎧 Listening Party</h2>

      {/* Song Counter */}
      <div className="text-center mb-6 text-gray-400">
        Song {gameState.currentSongIndex + 1} of {gameState.submissions.length}
      </div>

      {/* Current Song Display */}
      {currentSong && (
        <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl shadow-2xl mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-purple-300 mb-2">Now Playing</div>
            <h3 className="text-2xl font-bold mb-4">{gameState.vibeCard}</h3>
            <div className="inline-block bg-black/30 px-6 py-3 rounded-lg">
              <p className="text-xl font-semibold text-cyan-300">{currentSong.lyric}</p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={togglePlaySong}
              className="bg-white text-purple-900 p-4 rounded-full hover:bg-gray-200 transition-all shadow-lg"
            >
              {gameState.isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </button>
            {gameState.currentSongIndex < gameState.submissions.length - 1 && (
              <button
                onClick={nextSong}
                className="bg-gray-700 text-white p-4 rounded-full hover:bg-gray-600 transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Simulated Waveform */}
          {gameState.isPlaying && (
            <div className="flex justify-center items-center gap-1 mt-6 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Producer Voting Interface */}
      {yourPlayer?.isProducer ? (
        <div>
          <h3 className="text-xl font-bold text-center mb-4">Pick the Funniest!</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameState.submissions.map((sub, idx) => (
              <button
                key={sub.playerId}
                onClick={() => selectWinner(sub.playerId)}
                className={`p-6 rounded-xl text-left transition-all transform hover:scale-105 ${
                  idx === gameState.currentSongIndex
                    ? 'bg-gradient-to-br from-yellow-600 to-orange-600 ring-4 ring-yellow-400'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-sm text-gray-400 mb-2">{sub.playerName}</div>
                <div className="font-semibold">{sub.lyric}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-800 rounded-xl">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
          <p className="text-gray-400">The Producer is choosing the winner...</p>
        </div>
      )}
    </div>
  )

  const renderResults = () => {
    const winningPlayer = gameState.players.find((p) => p.id === gameState.winner)
    const winningSubmission = gameState.submissions.find(
      (s) => s.playerId === gameState.winner
    )

    if (!winningPlayer || !winningSubmission) return null

    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <Trophy className="w-32 h-32 mx-auto mb-6 text-yellow-500 animate-bounce" />
          <h2 className="text-4xl font-bold mb-4">🎵 Platinum Record Awarded! 🎵</h2>
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-8 rounded-2xl shadow-2xl mb-6">
            <div className="text-3xl font-bold mb-2">{winningPlayer.name}</div>
            <div className="text-xl italic">"{winningSubmission.lyric}"</div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-gray-800 p-6 rounded-xl mb-8">
          <h3 className="text-2xl font-bold mb-4">Scoreboard</h3>
          <div className="space-y-3">
            {[...gameState.players]
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}
                    </div>
                    <span className="font-semibold">{player.name}</span>
                    {player.isYou && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">YOU</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{player.score}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={nextRound}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
        >
          Next Round →
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Music className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold gradient-text">Cacophony</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Round {gameState.currentRound}</div>
            <div className="text-lg font-semibold">
              Producer:{' '}
              <span className="text-yellow-400">{producer?.name}</span>
            </div>
          </div>
        </div>

        {/* Player Status Bar */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap gap-4">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  player.isProducer
                    ? 'bg-yellow-500'
                    : player.submitted
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}
              />
              <span className="font-medium">{player.name}</span>
              {player.isYou && (
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">YOU</span>
              )}
              <div className="flex items-center gap-1 ml-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{player.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-6xl mx-auto">
        {gameState.gamePhase === 'waiting' && renderWaiting()}
        {gameState.gamePhase === 'selecting' && renderSelecting()}
        {gameState.gamePhase === 'generating' && renderGenerating()}
        {gameState.gamePhase === 'listening' && renderListening()}
        {gameState.gamePhase === 'results' && renderResults()}
      </div>
    </div>
  )
}

export default CacophonyGame