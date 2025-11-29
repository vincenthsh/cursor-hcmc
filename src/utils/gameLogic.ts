import { GamePhase } from '@/types'

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const shouldAutoSubmit = (
  gamePhase: GamePhase,
  timer: number,
  submittedCount: number,
  totalArtists: number
): boolean => {
  return gamePhase === 'selecting' && timer <= 1 && submittedCount < totalArtists
}

export const shouldMoveToGeneration = (
  gamePhase: GamePhase,
  submittedCount: number,
  totalArtists: number
): boolean => {
  return gamePhase === 'selecting' && submittedCount === totalArtists
}

export const computeFinalLyric = (
  template: string,
  blanks: Record<string, string>
): string => {
  return Object.entries(blanks).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, value || '___')
  }, template)
}

export const countPlaceholders = (template?: string | null): number => {
  if (!template) return 0
  const matches = template.match(/\{\d+\}/g)
  return matches ? matches.length : 0
}
