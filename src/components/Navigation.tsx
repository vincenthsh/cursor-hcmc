import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ArrowLeft, Music } from 'lucide-react'

interface NavigationProps {
  roomCode?: string
  variant?: 'default' | 'floating'
}

export default function Navigation({ roomCode, variant = 'default' }: NavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isInGame = location.pathname.startsWith('/game/')
  const isInLobby = location.pathname.startsWith('/lobby/')
  const isHome = location.pathname === '/'

  const handleBack = () => {
    if (isInGame && roomCode) {
      // From game, go back to lobby
      navigate(`/lobby/${roomCode}`)
    } else if (isInLobby) {
      // From lobby, go back to home
      navigate('/')
    } else {
      // Default: go back
      navigate(-1)
    }
  }

  const handleHome = () => {
    navigate('/')
  }

  const handleBackToGame = () => {
    if (roomCode) {
      navigate(`/game/${roomCode}`)
    }
  }

  // Floating variant - shows a small widget to jump back to game
  if (variant === 'floating') {
    // Only show when in lobby but game has started
    if (!isInLobby || !roomCode) return null

    return (
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={handleBackToGame}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full shadow-lg transition-all transform hover:scale-105 font-semibold"
          aria-label="Return to game"
        >
          <Music className="w-5 h-5" />
          <span>Back to Game</span>
        </button>
      </div>
    )
  }

  // Default variant - shows navigation buttons
  if (isHome) {
    // Don't show navigation on home page
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {!isHome && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium border border-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}
      <button
        type="button"
        onClick={handleHome}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium border border-gray-700"
        aria-label="Go to home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </button>
    </div>
  )
}
