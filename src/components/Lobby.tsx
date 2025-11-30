import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { useLobbyState } from '@/hooks'
import { getSession, updateSessionUsername } from '@/utils/session'
import { updatePlayerUsername } from '@/utils/api'
import { Music } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function Lobby() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const session = getSession()
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState<string>()
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [startGameLoading, setStartGameLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!roomCode || !session) {
    return <div className="text-center py-20">Loading...</div>
  }

  const { room, players, currentPlayer, isHost, canStartGame, loading, error, refetch } = useLobbyState(
    roomCode,
    session.playerId
  )

  // Show username modal if player has guest username
  useEffect(() => {
    if (currentPlayer && currentPlayer.username.startsWith('Guest-')) {
      setShowUsernameModal(true)
    }
  }, [currentPlayer])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSetUsername = async () => {
    const trimmed = usernameInput.trim()
    if (!trimmed) {
      setUsernameError('Username cannot be empty')
      return
    }
    if (trimmed.length > 20) {
      setUsernameError('Username must be 20 characters or less')
      return
    }

    // Check for duplicates
    if (players.some((p) => p.id !== currentPlayer?.id && p.username.toLowerCase() === trimmed.toLowerCase())) {
      setUsernameError('Username already taken')
      return
    }

    setUsernameLoading(true)
    setUsernameError(undefined)
    try {
      if (currentPlayer) {
        await updatePlayerUsername(currentPlayer.id, trimmed)
        updateSessionUsername(trimmed)
        setShowUsernameModal(false)
        setUsernameInput('')
        await refetch()
      }
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setUsernameLoading(false)
    }
  }

  const handleStartGame = async () => {
    if (!room || !isHost) return

    setStartGameLoading(true)
    try {
      const { startGame } = await import('@/utils/api')
      await startGame(room.id)
      // The polling will auto-navigate us to the game
    } catch (err) {
      console.error('Failed to start game:', err)
    } finally {
      setStartGameLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex items-center gap-3">
              <Music className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold gradient-text">Cacophony</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <Navigation roomCode={roomCode} />
            </div>
          </div>
          <p className="text-gray-400">Game Lobby</p>
        </div>

        {/* Room Code Section */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 shadow-lg border border-gray-700">
          <div className="text-center">
            <h2 className="text-lg text-gray-400 mb-4">Room Code</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl font-mono font-bold tracking-widest text-purple-300">{roomCode}</div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Copy room code"
              >
                {copied ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            {copied && <p className="text-green-400 text-sm mt-2">Copied to clipboard!</p>}
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 shadow-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl font-bold">Players ({players.length}/8)</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading players...</div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Waiting for players to join...</div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    player.id === currentPlayer?.id ? 'bg-blue-900 bg-opacity-50 border border-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{player.username}</span>
                    {player.join_order === 0 && (
                      <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-yellow-100">HOST</span>
                    )}
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded text-blue-100">YOU</span>
                    )}
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Section */}
        {error && !error.includes('Game has already started') && (
          <div className="mb-8 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Start Game Button */}
        {isHost && (
          <div className="space-y-4">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame || startGameLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {startGameLoading ? 'Starting game...' : 'Start Game'}
            </button>
            {!canStartGame && (
              <p className="text-center text-gray-400 text-sm">Need at least 3 players to start (current: {players.length})</p>
            )}
          </div>
        )}

        {/* Wait for Host Message */}
        {!isHost && (
          <div className="text-center p-6 bg-gray-700 bg-opacity-50 rounded-lg">
            <p className="text-gray-300">Waiting for host to start the game...</p>
          </div>
        )}
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Enter Your Username</h2>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value)
                setUsernameError(undefined)
              }}
              placeholder="Your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-blue-400 transition-colors mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSetUsername()
                }
              }}
            />
            {usernameError && <p className="text-red-400 text-sm mb-4">{usernameError}</p>}
            <button
              onClick={handleSetUsername}
              disabled={usernameLoading || !usernameInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {usernameLoading ? 'Setting username...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Navigation Widget - Shows when game has started */}
      {room?.status === 'in_progress' && <Navigation roomCode={roomCode} variant="floating" />}
    </div>
  )
}
