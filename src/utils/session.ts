interface SessionData {
  playerId: string
  username: string
  roomCode: string
}

const SESSION_KEY = 'cacophony_session'

export const saveSession = (data: SessionData): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export const getSession = (): SessionData | null => {
  const stored = localStorage.getItem(SESSION_KEY)
  return stored ? JSON.parse(stored) : null
}

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY)
}

export const updateSessionUsername = (username: string): void => {
  const session = getSession()
  if (session) {
    saveSession({ ...session, username })
  }
}
