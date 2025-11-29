import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Users } from 'lucide-react'
import { createRoom, createPlayer, getRoomByCode } from '@/utils/api'
import { saveSession } from '@/utils/session'
import { formatRoomCodeInput, isRoomCodeComplete } from '@/utils/roomCode'

export default function LandingPage() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [hostLoading, setHostLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleHostGame = async () => {
    setError(undefined)
    setHostLoading(true)
    try {
      const room = await createRoom(3)
      const player = await createPlayer(room.id)
      saveSession({
        playerId: player.id,
        username: player.username,
        roomCode: room.room_code,
      })
      navigate(`/lobby/${room.room_code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setHostLoading(false)
    }
  }

  const handleJoinGame = async () => {
    setError(undefined)
    if (!isRoomCodeComplete(joinCode)) {
      setError('Please enter a valid room code (6 characters)')
      return
    }

    setJoinLoading(true)
    try {
      const room = await getRoomByCode(joinCode)
      const player = await createPlayer(room.id)
      saveSession({
        playerId: player.id,
        username: player.username,
        roomCode: room.room_code,
      })
      navigate(`/lobby/${room.room_code}`)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          setError('Invalid room code - please check and try again')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to join room')
      }
    } finally {
      setJoinLoading(false)
    }
  }

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomCodeInput(e.target.value)
    setJoinCode(formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold gradient-text">Cacophony</h1>
          </div>
          <p className="text-gray-400 text-lg">Create hilarious AI-generated songs with your friends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Host Game Section */}
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Music className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Host a Game</h2>
            </div>
            <p className="text-gray-400 mb-8">Create a new lobby and invite your friends</p>
            <button
              onClick={handleHostGame}
              disabled={hostLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {hostLoading ? 'Creating room...' : 'Create Room'}
            </button>
          </div>

          {/* Join Game Section */}
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Join a Game</h2>
            </div>
            <p className="text-gray-400 mb-6">Enter the room code from the host</p>
            <div className="space-y-4">
              <input
                type="text"
                value={joinCode}
                onChange={handleJoinCodeChange}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-center text-xl font-mono uppercase focus:outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={handleJoinGame}
                disabled={joinLoading || !isRoomCodeComplete(joinCode)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold text-lg hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {joinLoading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
