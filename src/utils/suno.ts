const SUNO_API_URL = 'https://api.suno.ai/v1'
const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY
const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === 'true'
const log = (...args: unknown[]) => {
  if (DEBUG_LOGS) console.debug('[suno]', ...args)
}

export interface SunoTaskResult {
  taskId: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  songUrl?: string
  error?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const requestSunoSong = async (params: {
  vibeCardText: string
  finalLyric: string
}): Promise<SunoTaskResult> => {
  if (!SUNO_API_KEY) {
    // Dev fallback so flows still work without an API key
    log('requestSunoSong (dev fallback)')
    return {
      taskId: `dev-mock-${Date.now()}`,
      status: 'completed',
      songUrl: 'https://example.com/mock-song.mp3',
    }
  }

  const response = await fetch(`${SUNO_API_URL}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUNO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `${params.vibeCardText}\n\nLyrics: ${params.finalLyric}`,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Suno generate failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { task_id?: string }
  const result = {
    taskId: data.task_id || '',
    status: 'generating' as const,
  }
  log('requestSunoSong', { taskId: result.taskId })
  return result
}

export const pollSunoTask = async (taskId: string, maxAttempts = 20): Promise<SunoTaskResult> => {
  if (!SUNO_API_KEY) {
    await sleep(800)
    const fallback = { taskId, status: 'completed' as const, songUrl: 'https://example.com/mock-song.mp3' }
    log('pollSunoTask (dev fallback)', fallback)
    return fallback
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(`${SUNO_API_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      log('pollSunoTask error', { taskId, status: response.status, text })
      return { taskId, status: 'failed', error: text }
    }

    const data = (await response.json()) as { status?: string; song_url?: string; error?: string }
    if (data.status === 'completed') {
      const res = { taskId, status: 'completed' as const, songUrl: data.song_url }
      log('pollSunoTask completed', res)
      return res
    }
    if (data.status === 'failed') {
      const res = { taskId, status: 'failed' as const, error: data.error }
      log('pollSunoTask failed', res)
      return res
    }

    await sleep(1500)
  }

  const timeout = { taskId, status: 'failed' as const, error: 'Timed out waiting for Suno task' }
  log('pollSunoTask timeout', timeout)
  return timeout
}
