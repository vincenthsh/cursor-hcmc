import { useEffect, useState, useRef } from 'react'
import type { LyricSegment } from '@/types/game'

interface KaraokeLyricsProps {
  lyrics: LyricSegment[]
  currentTime: number
  className?: string
}

export const KaraokeLyrics = ({ lyrics, currentTime, className = '' }: KaraokeLyricsProps) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // Update active lyric based on current playback time
  useEffect(() => {
    const active = lyrics.findIndex(
      (segment) => currentTime >= segment.startTime && currentTime < segment.endTime
    )
    setActiveIndex(active)
  }, [currentTime, lyrics])

  // Auto-scroll to keep active lyric in view
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current
      const activeLine = activeLineRef.current

      const containerRect = container.getBoundingClientRect()
      const activeRect = activeLine.getBoundingClientRect()

      // Calculate if active line is outside visible area
      const isAbove = activeRect.top < containerRect.top
      const isBelow = activeRect.bottom > containerRect.bottom

      if (isAbove || isBelow) {
        // Scroll to center the active line
        const offset = activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2
        container.scrollBy({
          top: offset,
          behavior: 'smooth'
        })
      }
    }
  }, [activeIndex])

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className={`text-center text-gray-400 py-8 ${className}`}>
        <p className="text-sm">No timestamped lyrics available</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`karaoke-lyrics-container max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800 ${className}`}
    >
      <div className="space-y-2 px-4 py-6">
        {lyrics.map((segment, index) => {
          const isActive = index === activeIndex
          const isPast = currentTime > segment.endTime
          const isComing = currentTime < segment.startTime

          return (
            <div
              key={`${segment.startTime}-${index}`}
              ref={isActive ? activeLineRef : null}
              className={`
                transition-all duration-300 text-center leading-relaxed
                ${isActive ? 'scale-110 text-cyan-300 font-bold text-2xl glow-text' : ''}
                ${isPast ? 'text-gray-500 text-lg' : ''}
                ${isComing ? 'text-gray-400 text-lg' : ''}
                ${!isActive && !isPast && !isComing ? 'text-gray-300 text-lg' : ''}
              `}
              style={{
                textShadow: isActive ? '0 0 20px rgba(103, 232, 249, 0.8)' : 'none'
              }}
            >
              {segment.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default KaraokeLyrics
