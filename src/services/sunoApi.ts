import type {
  SunoGenerateRequest,
  SunoGenerateResponse,
  SunoRecordInfoResponse,
  SunoTimestampedLyricsResponse,
  SunoLyricSegment,
  SunoConfig
} from '@/types/suno'

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === 'true'
const log = (...args: unknown[]) => {
  if (DEBUG_LOGS) console.debug('[sunoApi]', ...args)
}

class SunoApiService {
  private config: SunoConfig
  private readonly DEFAULT_BASE_URL = 'https://api.sunoapi.org'

  constructor(config: SunoConfig) {
    this.config = {
      baseUrl: this.DEFAULT_BASE_URL,
      defaultCallbackUrl: `${window.location.origin}/api/suno/callback`,
      ...config
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    log(`🎵 Suno API Request: ${options.method || 'GET'} ${url}`)
    if (options.body) {
      log('📝 Request body:', JSON.parse(options.body as string))
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...options.headers,
      },
      ...options,
    })

    log(`📡 Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = {
          code: response.status,
          msg: response.statusText,
          details: 'Unknown error occurred'
        }
      }

      // Determine error type
      let errorType: 'credits' | 'api' | 'network' | 'timeout' | 'unknown' = 'unknown'
      if (response.status === 429 || errorData.msg?.includes('insufficient credits') || errorData.msg?.includes('top up')) {
        errorType = 'credits'
      } else if (response.status >= 500) {
        errorType = 'api'
      } else if (response.status === 408) {
        errorType = 'timeout'
      } else if (response.status === 0 || response.statusText === 'Network Error') {
        errorType = 'network'
      }

      log('❌ Suno API Error:', { ...errorData, type: errorType })
      throw new SunoApiError(errorData.msg || errorData.message || 'API Error', errorData.code || response.status, errorData.details, errorType)
    }

    const data = await response.json()
    log('✅ Suno API Response:', data)
    return data
  }

  /**
   * Generate music based on prompt and style
   */
  async generateMusic(params: SunoGenerateRequest): Promise<string> {
    const payload: SunoGenerateRequest = {
      ...params,
      callBackUrl: 'https://dummy-callback.com/polling-mode', // Dummy callback for polling mode
    }

    const response: SunoGenerateResponse = await this.makeRequest(
      '/api/v1/generate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    if (response.code !== 200) {
      throw new SunoApiError(response.msg, response.code)
    }

    return response.data.taskId
  }

  /**
   * Get generation task details and results
   */
  async getGenerationDetails(taskId: string): Promise<SunoRecordInfoResponse> {
    log(`🔍 Checking details for task: ${taskId}`)
    const response: SunoRecordInfoResponse = await this.makeRequest(
      `/api/v1/generate/record-info?taskId=${taskId}`
    )

    if (response.code !== 200) {
      throw new SunoApiError(response.msg, response.code)
    }

    log(`📋 Task ${taskId} details:`, {
      status: response.data.status,
      hasTracks: response.data.response?.sunoData?.length > 0,
      errorMessage: response.data.errorMessage
    })

    return response
  }

  
  /**
   * Wait for generation completion with progress callbacks
   */
  async waitForCompletionWithProgress(
    taskId: string,
    progressCallback?: (progress: number) => void,
    options: {
      maxWaitTime?: number
      pollInterval?: number
    } = {}
  ): Promise<SunoRecordInfoResponse> {
    const { maxWaitTime = 5 * 60 * 1000, pollInterval = 3000 } = options

    log(`⏳ Starting progress polling for taskId: ${taskId}`)

    const startTime = Date.now()
    let pollCount = 0
    let lastProgress = 0 // Track last progress to ensure monotonic increase
    let status = 'UNKNOWN' // Track status changes

    while (Date.now() - startTime < maxWaitTime) {
      pollCount++

      try {
        log(`🔍 Progress poll ${pollCount} for taskId: ${taskId}`)

        const response = await fetch(`${this.config.baseUrl}/api/v1/generate/record-info?taskId=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new SunoApiError(`Failed to poll result: ${response.statusText}`, response.status)
        }

        const data = await response.json()
        const currentStatus = data.data.status

        log(`📊 Poll ${pollCount} status: ${currentStatus}`)

        // Calculate progress based on status, ensuring monotonic increase
        let progress = lastProgress // Start with last progress to avoid going backwards

        if (currentStatus === 'SUCCESS') {
          progress = 100
        } else if (currentStatus === 'TEXT_SUCCESS') {
          progress = Math.max(lastProgress, 40)
        } else if (currentStatus === 'FIRST_SUCCESS') {
          progress = Math.max(lastProgress, 80)
        } else if (currentStatus === 'RUNNING' && status !== 'RUNNING') {
          // First time entering RUNNING state
          progress = Math.max(lastProgress, 20)
        } else if (currentStatus === 'RUNNING') {
          // Continue in RUNNING state - increase gradually based on time
          const elapsedPercent = (Date.now() - startTime) / maxWaitTime
          const timeBasedProgress = Math.min(20 + elapsedPercent * 60, 75)
          progress = Math.max(lastProgress, Math.round(timeBasedProgress))
        } else if (currentStatus === 'PENDING' && status !== 'PENDING') {
          // First time entering PENDING state
          progress = Math.max(lastProgress, 0)
        } else if (currentStatus === 'PENDING') {
          // Continue in PENDING state - stay at 0
          progress = Math.max(lastProgress, 0)
        } else if (currentStatus === 'FAILED') {
          // Reset progress to 0 and continue polling for retry
          log(`❌ Generation failed for taskId: ${taskId}, resetting progress to 0`)
          progress = 0
          lastProgress = 0
        } else {
          // UNKNOWN or other status - minimal progress
          progress = Math.max(lastProgress, 0)
        }

        // Update status tracking
        status = currentStatus
        lastProgress = progress

        log(`📈 Progress updated: ${progress}% (status: ${currentStatus})`)

        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(progress)
        }

        if (data.data.status === 'SUCCESS') {
          log(`✅ Generation completed for taskId: ${taskId}`)
          return data
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))

      } catch (error) {
        log(`❌ Error in progress poll ${pollCount}:`, error)
        if (error instanceof SunoApiError && error.code === 404) {
          // Task not found, continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          continue
        }
        throw error
      }
    }

    throw new SunoApiError(`Timeout waiting for task completion after ${maxWaitTime}ms`, 408)
  }

  /**
   * Generate music for a game round (combines multiple lyrics)
   */
  async generateGameMusic(
    vibeCard: string,
    lyrics: { playerId: number; lyric: string }[],
    options: {
      style?: string
      model?: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'
      instrumental?: boolean
    } = {}
  ): Promise<{ playerId: number; taskId: string }[]> {
    const { model = 'V4_5', instrumental = false } = options

    const tasks = lyrics.map(async ({ playerId, lyric }) => {
      const prompt = this.createPrompt(vibeCard, lyric)

      const taskId = await this.generateMusic({
        prompt,
        customMode: true,
        instrumental,
        model,
        negativeTags: instrumental ? 'vocals, singing' : '',
        vocalGender: instrumental ? undefined : undefined,
        styleWeight: 0.7,
        weirdnessConstraint: 0.5,
        audioWeight: 0.8
      })

      return { playerId, taskId }
    })

    return Promise.all(tasks)
  }

  /**
   * Get timestamped lyrics for a generated song
   * @param taskId - The task ID of the music generation task
   * @param audioId - Audio ID of the track to retrieve lyrics for
   */
  async getTimestampedLyrics(taskId: string, audioId: string): Promise<SunoLyricSegment[]> {
    log(`🎤 Fetching timestamped lyrics for task: ${taskId}, audio: ${audioId}`)

    const response: SunoTimestampedLyricsResponse = await this.makeRequest(
      `/api/v1/generate/get-timestamped-lyrics`,
      {
        method: 'POST',
        body: JSON.stringify({ taskId, audioId })
      }
    )

    if (response.code !== 200) {
      throw new SunoApiError(response.msg, response.code)
    }

    // Transform aligned words into lyric segments
    const segments: SunoLyricSegment[] = response.data.alignedWords
      .filter(word => word.success)
      .map(word => ({
        text: word.word,
        startTime: word.startS,
        endTime: word.endS
      }))

    log(`✅ Retrieved ${segments.length} lyric segments for task: ${taskId}`)
    return segments
  }

  private createPrompt(vibeCard: string, lyric: string): string {
    return `Create a ${vibeCard.toLowerCase()} song with this lyric: "${lyric}". Make it catchy and memorable.`
  }
}

// Custom error class for Suno API errors
class SunoApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: string,
    public type?: 'credits' | 'api' | 'network' | 'timeout' | 'unknown'
  ) {
    super(message)
    this.name = 'SunoApiError'
  }
}

export { SunoApiService, SunoApiError }
export default SunoApiService