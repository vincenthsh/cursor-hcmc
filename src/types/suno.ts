// Suno API Types based on documentation

export interface SunoGenerateRequest {
  prompt: string
  style: string
  title: string
  customMode: boolean
  instrumental: boolean
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'
  callBackUrl?: string
  negativeTags?: string
  vocalGender?: 'm' | 'f'
  styleWeight?: number
  weirdnessConstraint?: number
  audioWeight?: number
  personaId?: string
}

export interface SunoGenerateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

export interface SunoTrack {
  id: string
  audioUrl: string
  streamAudioUrl: string
  imageUrl: string
  prompt: string
  modelName: string
  title: string
  tags: string
  createTime: string
  duration: number
}

export interface SunoRecordInfoResponse {
  code: number
  msg: string
  data: {
    taskId: string
    parentMusicId: string
    param: string
    response: {
      taskId: string
      sunoData: SunoTrack[]
    }
    status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' | 'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR'
    type: 'GENERATE'
    errorCode: string | null
    errorMessage: string | null
  }
}

// Configuration
export interface SunoConfig {
  apiKey: string
  baseUrl?: string
  defaultCallbackUrl?: string
}

// Helper type for generation parameters stored in game
export interface SongGenerationParams {
  playerId: number
  lyric: string
  vibeCard: string
  taskId?: string
  status?: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' | 'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR'
  tracks?: SunoTrack[]
  error?: string
}