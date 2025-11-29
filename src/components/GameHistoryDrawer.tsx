import { useState } from 'react'
import { X, History, Play, Pause, Trophy, Music, ChevronDown, ChevronUp } from 'lucide-react'

interface HistoricalRound {
  roundNumber: number
  vibeCard: string
  producer: {
    id: string
    name: string
  }
  submissions: {
    id: string
    playerId: string
    playerName: string
    lyric: string
    audioUrl: string | null
    isWinner: boolean
    producerRating: number | null
  }[]
  winner?: {
    id: string
    name: string
  }
}

interface GameHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  rounds: HistoricalRound[]
  currentRound: number
}

export default function GameHistoryDrawer({ isOpen, onClose, rounds, currentRound }: GameHistoryDrawerProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({})

  const toggleRound = (roundNumber: number) => {
    setExpandedRound(expandedRound === roundNumber ? null : roundNumber)
  }

  const playAudio = (submissionId: string, audioUrl: string) => {
    // Stop currently playing audio
    if (playingAudio && audioElements[playingAudio]) {
      audioElements[playingAudio].pause()
      audioElements[playingAudio].currentTime = 0
    }

    // If clicking the same audio, just stop it
    if (playingAudio === submissionId) {
      setPlayingAudio(null)
      return
    }

    // Create or get audio element
    let audio = audioElements[submissionId]
    if (!audio) {
      audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => setPlayingAudio(null))
      setAudioElements(prev => ({ ...prev, [submissionId]: audio }))
    }

    audio.play()
    setPlayingAudio(submissionId)
  }

  const pauseAudio = (submissionId: string) => {
    if (audioElements[submissionId]) {
      audioElements[submissionId].pause()
      setPlayingAudio(null)
    }
  }

  // Cleanup audio elements when drawer closes
  const handleClose = () => {
    if (playingAudio && audioElements[playingAudio]) {
      audioElements[playingAudio].pause()
      audioElements[playingAudio].currentTime = 0
    }
    setPlayingAudio(null)
    onClose()
  }

  if (!isOpen) return null

  const completedRounds = rounds.filter(r => r.roundNumber < currentRound)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col animate-slideInFromRight">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <History className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Game History</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close history"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-400">
            {completedRounds.length} {completedRounds.length === 1 ? 'round' : 'rounds'} completed
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {completedRounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <History className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No History Yet</h3>
              <p className="text-gray-500">Complete your first round to see the history here!</p>
            </div>
          ) : (
            completedRounds.map((round) => (
              <div
                key={round.roundNumber}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all"
              >
                {/* Round Header */}
                <button
                  type="button"
                  onClick={() => toggleRound(round.roundNumber)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-full font-bold">
                      {round.roundNumber}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg">Round {round.roundNumber}</h3>
                      <p className="text-sm text-gray-400">Producer: {round.producer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {round.winner && (
                      <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-600/40">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-400">
                          {round.winner.name}
                        </span>
                      </div>
                    )}
                    {expandedRound === round.roundNumber ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedRound === round.roundNumber && (
                  <div className="border-t border-gray-700 p-4 space-y-4 animate-fadeIn">
                    {/* Vibe Card */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="w-5 h-5 text-purple-400" />
                        <h4 className="font-bold text-purple-400">Vibe Card</h4>
                      </div>
                      <p className="text-gray-200">{round.vibeCard}</p>
                    </div>

                    {/* Submissions */}
                    <div>
                      <h4 className="font-bold mb-3 text-gray-300">Submissions:</h4>
                      <div className="space-y-3">
                        {round.submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className={`rounded-lg p-4 border transition-all ${
                              submission.isWinner
                                ? 'bg-yellow-900/20 border-yellow-600/40'
                                : 'bg-gray-700/50 border-gray-600'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-200">
                                    {submission.playerName}
                                  </span>
                                  {submission.isWinner && (
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 italic">"{submission.lyric}"</p>
                              </div>
                            </div>

                            {/* Audio Playback */}
                            {submission.audioUrl && (
                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    playingAudio === submission.id
                                      ? pauseAudio(submission.id)
                                      : playAudio(submission.id, submission.audioUrl!)
                                  }
                                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors font-semibold text-sm"
                                >
                                  {playingAudio === submission.id ? (
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
                                {playingAudio === submission.id && (
                                  <div className="flex items-center gap-2 text-purple-400 animate-pulse">
                                    <div className="flex gap-1">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="w-1 h-4 bg-purple-400 rounded-full animate-bounce"
                                          style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm">Now Playing</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Rating */}
                            {submission.producerRating !== null && (
                              <div className="mt-2 text-xs text-gray-400">
                                Rating: {submission.producerRating}/5.0
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
