import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameRoomRow, PlayerRow, getRoomByCode, getPlayersForRoom } from '@/utils/api'

interface LobbyState {
  room: GameRoomRow | null
  players: PlayerRow[]
  currentPlayer: PlayerRow | null
  isHost: boolean
  canStartGame: boolean
  loading: boolean
  error: string | undefined
}

const initialState: LobbyState = {
  room: null,
  players: [],
  currentPlayer: null,
  isHost: false,
  canStartGame: false,
  loading: true,
  error: undefined,
}

export const useLobbyState = (roomCode: string, currentPlayerId: string) => {
  const navigate = useNavigate()
  const [state, setState] = useState<LobbyState>(initialState)

  const loadLobbyState = useCallback(async () => {
    try {
      const room = await getRoomByCode(roomCode)
      const players = await getPlayersForRoom(room.id)
      const current = players.find((p) => p.id === currentPlayerId)

      setState({
        room,
        players,
        currentPlayer: current || null,
        isHost: current?.join_order === 0 || false,
        canStartGame: players.length >= 3,
        loading: false,
        error: undefined,
      })

      // Auto-navigate if game has started
      if (room.status === 'in_progress') {
        navigate(`/game/${roomCode}`)
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load lobby state',
      }))
    }
  }, [roomCode, currentPlayerId, navigate])

  // Initial load
  useEffect(() => {
    loadLobbyState()
  }, [loadLobbyState])

  // Polling
  useEffect(() => {
    const interval = setInterval(() => {
      loadLobbyState()
    }, 2000)

    return () => clearInterval(interval)
  }, [loadLobbyState])

  return {
    ...state,
    refetch: loadLobbyState,
  }
}
