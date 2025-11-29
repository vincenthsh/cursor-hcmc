import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Users, Loader, Trash2, HelpCircle } from 'lucide-react'
import { createRoom, createPlayer, getRoomByCode, getAvailableRooms, GameRoomRow, deleteRoom } from '@/utils/api'
import { saveSession } from '@/utils/session'
import { formatRoomCodeInput, isRoomCodeComplete } from '@/utils/roomCode'
import InstructionsModal from '@/components/InstructionsModal'

type Tab = 'create' | 'join' | 'browse'

export default function LandingPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('create')
  const [joinCode, setJoinCode] = useState('')
  const [availableRooms, setAvailableRooms] = useState<(GameRoomRow & { playerCount: number })[]>([])
  const [hostLoading, setHostLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [browseLoding, setBrowseLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<(GameRoomRow & { playerCount: number }) | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

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

  const loadAvailableRooms = async () => {
    setError(undefined)
    setBrowseLoading(true)
    try {
      const rooms = await getAvailableRooms()
      setAvailableRooms(rooms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available rooms')
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleBrowseTabClick = () => {
    setTab('browse')
    if (availableRooms.length === 0) {
      loadAvailableRooms()
    }
  }

  const handleJoinFromBrowse = async (roomCode: string) => {
    setError(undefined)
    setJoinLoading(true)
    try {
      const room = await getRoomByCode(roomCode)
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
          setError('Room no longer available')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to join room')
      }
      // Refresh the list
      loadAvailableRooms()
    } finally {
      setJoinLoading(false)
    }
  }

  const handleDeleteClick = (room: GameRoomRow & { playerCount: number }) => {
    setRoomToDelete(room)
    setShowDeleteModal(true)
    setDeletePassword('')
    setError(undefined)
  }

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return

    if (deletePassword !== '12345') {
      setError('Incorrect password')
      return
    }

    setError(undefined)
    setDeleteLoading(true)
    try {
      await deleteRoom(roomToDelete.id)
      setShowDeleteModal(false)
      setRoomToDelete(null)
      setDeletePassword('')
      // Refresh the list
      loadAvailableRooms()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setRoomToDelete(null)
    setDeletePassword('')
    setError(undefined)
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
          <p className="text-gray-400 text-lg mb-4">Create hilarious AI-generated songs with your friends</p>
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300">How to Play</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setTab('create')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              tab === 'create'
                ? 'border-b-2 border-purple-600 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Create Game
          </button>
          <button
            onClick={() => setTab('join')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              tab === 'join'
                ? 'border-b-2 border-blue-600 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Enter Code
          </button>
          <button
            onClick={handleBrowseTabClick}
            className={`pb-4 px-4 font-semibold transition-colors ${
              tab === 'browse'
                ? 'border-b-2 border-green-600 text-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Browse Games
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'create' && (
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Music className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Create a Game</h2>
            </div>
            <p className="text-gray-400 mb-8">Create a new lobby and invite your friends with the room code</p>
            <button
              onClick={handleHostGame}
              disabled={hostLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {hostLoading ? 'Creating room...' : 'Create Room'}
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Enter Room Code</h2>
            </div>
            <p className="text-gray-400 mb-6">Enter a 6-character room code from the host</p>
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
        )}

        {tab === 'browse' && (
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Browse Available Games</h2>
            </div>

            {browseLoding ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-green-400" />
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No available games at the moment</p>
                <button
                  onClick={loadAvailableRooms}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-mono font-bold text-lg mb-1">{room.room_code}</div>
                      <div className="text-sm text-gray-400">{room.playerCount}/8 players</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(room)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJoinFromBrowse(room.room_code)}
                        disabled={joinLoading || room.playerCount >= 8}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                      >
                        {joinLoading ? 'Joining...' : room.playerCount >= 8 ? 'Full' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && roomToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 text-red-400">Delete Room</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete room <span className="font-mono font-bold">{roomToDelete.room_code}</span>?
              </p>
              <p className="text-sm text-gray-400 mb-6">
                This will remove all {roomToDelete.playerCount} player{roomToDelete.playerCount !== 1 ? 's' : ''} from the game and delete all game data.
              </p>

              <div className="mb-6">
                <label htmlFor="deletePassword" className="block text-sm font-semibold mb-2 text-gray-300">
                  Enter password to confirm:
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-red-400 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmDelete()
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Instructions Modal */}
        <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />
      </div>
    </div>
  )
}
