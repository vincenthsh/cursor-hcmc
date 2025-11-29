import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomByCode } from '@/utils/api'
import { getSession, clearSession } from '@/utils/session'
import CacophonyGame from './CacophonyGame'

export default function GameRouter() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const session = getSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!roomCode || !session) {
      navigate('/')
      return
    }

    // Validate room exists and is in progress
    const validateAccess = async () => {
      try {
        const room = await getRoomByCode(roomCode)
        if (room.status === 'waiting') {
          navigate(`/lobby/${roomCode}`, { replace: true })
        }
      } catch (err) {
        // Room not found or error accessing it
        clearSession()
        navigate('/')
      }
    }

    validateAccess()
  }, [roomCode, session, navigate])

  if (!roomCode || !session) {
    return <div className="text-center py-20">Loading...</div>
  }

  return <CacophonyGame roomCode={roomCode} playerId={session.playerId} />
}
