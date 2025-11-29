import { SunoConfig } from '@/types/suno'

export const getSunoConfig = (): SunoConfig => {
  // Debug: Log all environment variables
  console.log('🔍 Available env vars:', {
    VITE_SUNO_API_KEY: import.meta.env.VITE_SUNO_API_KEY,
    VITE_SUNO_BASE_URL: import.meta.env.VITE_SUNO_BASE_URL,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  })

  const apiKey = import.meta.env.VITE_SUNO_API_KEY

  console.log('🔑 API Key Debug:', {
    exists: Boolean(apiKey),
    length: apiKey?.length || 0,
    first5: apiKey?.substring(0, 5) + '...',
    isPlaceholder: apiKey === 'your_suno_api_key_here'
  })

  if (!apiKey) {
    console.error('❌ NO API KEY FOUND!');
    console.error('Make sure VITE_SUNO_API_KEY is set in .env file');
  } else if (apiKey === 'your_suno_api_key_here') {
    console.error('❌ API KEY IS STILL THE PLACEHOLDER!');
    console.error('Please replace with your actual Suno API key');
  } else {
    console.log('✅ API Key found and appears valid');
  }

  return {
    apiKey: apiKey || '',
    baseUrl: import.meta.env.VITE_SUNO_BASE_URL || 'https://api.sunoapi.org',
    defaultCallbackUrl: '' // Using polling mode, no callback URL needed
  }
}

export const isSunoConfigured = (): boolean => {
  const config = getSunoConfig()
  return Boolean(config.apiKey && config.apiKey !== 'your_suno_api_key_here')
}