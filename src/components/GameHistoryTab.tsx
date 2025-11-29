import { useState, useEffect } from 'react'
import { Loader, ChevronDown, ChevronUp, Music, Play, Pause, Trophy, Users, Calendar } from 'lucide-react'
import { getGameHistory, getRoundsWithSubmissions, getPlayersForRoom, GameHistoryRoom, RoundWithSubmissions, PlayerRow } from '@/utils/api'
import { computeFinalLyric } from '@/utils/gameLogic'

export default function GameHistoryTab() {
  const [games, setGames] = useState<GameHistoryRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [expandedGame, setExpandedGame] = useState<string | null>(null)
  const [gameDetails, setGameDetails] = useState<{
    [roomId: string]: { players: PlayerRow[]; rounds: RoundWithSubmissions[] }
  }>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<{ roundId: string; submissionId: string } | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadGames()
  }, [])

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
    }
  }, [audioElement])

  const loadGames = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const history = await getGameHistory()
      setGames(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game history')
    } finally {
      setLoading(false)
    }
  }

  const loadGameDetails = async (roomId: string) => {
    if (gameDetails[roomId]) {
      // Already loaded
      return
    }

    setLoadingDetails(roomId)
    try {
      const [players, rounds] = await Promise.all([
        getPlayersForRoom(roomId),
        getRoundsWithSubmissions(roomId),
      ])

      setGameDetails((prev) => ({
        ...prev,
        [roomId]: { players, rounds },
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game details')
    } finally {
      setLoadingDetails(null)
    }
  }

  const handleToggleGame = async (roomId: string) => {
    if (expandedGame === roomId) {
      setExpandedGame(null)
    } else {
      setExpandedGame(roomId)
      await loadGameDetails(roomId)
    }
  }

  const handlePlayAudio = (roundId: string, submissionId: string, songUrl: string) => {
    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ''
    }

    if (playingAudio?.roundId === roundId && playingAudio?.submissionId === submissionId) {
      // Already playing this - pause it
      setPlayingAudio(null)
      setAudioElement(null)
      return
    }

    // Play new audio
    const audio = new Audio(songUrl)
    audio.play().catch((err) => {
      console.error('Failed to play audio:', err)
    })

    audio.addEventListener('ended', () => {
      setPlayingAudio(null)
      setAudioElement(null)
    })

    setAudioElement(audio)
    setPlayingAudio({ roundId, submissionId })
  }

  const handlePauseAudio = () => {
    if (audioElement) {
      audioElement.pause()
      setPlayingAudio(null)
      setAudioElement(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      waiting: 'bg-gray-600 text-gray-100',
      in_progress: 'bg-blue-600 text-blue-100',
      completed: 'bg-green-600 text-green-100',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-600 text-gray-100'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProducerName = (producerId: string, players: PlayerRow[]) => {
    return players.find((p) => p.id === producerId)?.username || 'Unknown'
  }

  return (
    <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-600 rounded-lg">
            <Music className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Game History</h2>
        </div>
        <button
          onClick={loadGames}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadGames}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No game history available</p>
          <p className="text-sm text-gray-500">Complete a game to see it here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const isExpanded = expandedGame === game.id
            const details = gameDetails[game.id]
            const isLoadingDetails = loadingDetails === game.id

            return (
              <div key={game.id} className="bg-gray-700 rounded-lg overflow-hidden">
                {/* Game Summary */}
                <button
                  onClick={() => handleToggleGame(game.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-650 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-mono font-bold text-lg">{game.room_code}</div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(game.status)}`}>
                        {game.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{game.playerCount} players</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        <span>
                          {game.completedRounds}/{game.target_rounds} rounds
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(game.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-600 p-4">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-orange-400" />
                      </div>
                    ) : details ? (
                      <div className="space-y-6">
                        {/* Players */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-200">Players</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {details.players
                              .sort((a, b) => b.score - a.score)
                              .map((player, index) => (
                                <div
                                  key={player.id}
                                  className="p-3 bg-gray-800 rounded-lg flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                                    <span className="font-medium">{player.username}</span>
                                  </div>
                                  <span className="text-purple-400 font-bold">{player.score} pts</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Rounds */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-200">Rounds</h3>
                          <div className="space-y-4">
                            {details.rounds.map((round) => (
                              <div key={round.id} className="bg-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-purple-300">Round {round.round_number}</h4>
                                    <p className="text-sm text-gray-400">
                                      Producer: {getProducerName(round.producer_id, details.players)}
                                    </p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(round.status)}`}>
                                    {round.status}
                                  </span>
                                </div>

                                {/* Vibe Card */}
                                <div className="mb-3 p-3 bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg">
                                  <p className="text-sm text-gray-400 mb-1">Vibe Card:</p>
                                  <p className="text-purple-200 font-medium">{round.vibe_card_text}</p>
                                </div>

                                {/* Submissions */}
                                {round.submissions.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-400 mb-2">Submissions:</p>
                                    {round.submissions.map((submission) => {
                                      const finalLyric = computeFinalLyric(submission.lyric_card_text, submission.filled_blanks || {})
                                      const isPlaying =
                                        playingAudio?.roundId === round.id &&
                                        playingAudio?.submissionId === submission.id
                                      const hasAudio = submission.song_url && submission.song_status === 'completed'

                                      return (
                                        <div
                                          key={submission.id}
                                          className={`p-3 rounded-lg ${
                                            submission.is_winner
                                              ? 'bg-yellow-900 bg-opacity-30 border border-yellow-600'
                                              : 'bg-gray-700'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-cyan-300">
                                                {submission.playerUsername}
                                              </span>
                                              {submission.is_winner && (
                                                <Trophy className="w-4 h-4 text-yellow-400" />
                                              )}
                                            </div>
                                            {submission.producer_rating && (
                                              <span className="text-xs text-yellow-400">
                                                {submission.producer_rating}/5
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-300 italic mb-2">"{finalLyric}"</p>
                                          {hasAudio && (
                                            <button
                                              onClick={() =>
                                                isPlaying
                                                  ? handlePauseAudio()
                                                  : handlePlayAudio(round.id, submission.id, submission.song_url!)
                                              }
                                              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
                                            >
                                              {isPlaying ? (
                                                <>
                                                  <Pause className="w-4 h-4" />
                                                  Pause
                                                </>
                                              ) : (
                                                <>
                                                  <Play className="w-4 h-4" />
                                                  Play Song
                                                </>
                                              )}
                                            </button>
                                          )}
                                          {submission.song_status === 'generating' && (
                                            <p className="text-xs text-gray-500">Generating song...</p>
                                          )}
                                          {submission.song_status === 'failed' && (
                                            <p className="text-xs text-red-400">Failed to generate song</p>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">Failed to load game details</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
