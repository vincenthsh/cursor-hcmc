import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl?: string | null
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
  className?: string
  showControls?: boolean
}

export const AudioPlayer = ({
  audioUrl,
  isPlaying,
  onPlayStateChange,
  className = '',
  showControls = true
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Failed to play audio:', err)
        setError('Failed to play audio')
        onPlayStateChange(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, audioUrl, onPlayStateChange])

  // Update time and duration
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setIsLoading(false)
      setError('Audio failed to load')
      onPlayStateChange(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl, onPlayStateChange])

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted
      audioRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (error) {
      setError(null)
    }
    onPlayStateChange(!isPlaying)
  }

  if (!audioUrl) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-400">No audio available</p>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        loop={false}
      />

      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-sm text-red-200">
          {error}
        </div>
      )}

      {showControls && (
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
            title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono w-10">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
              }}
            />
            <span className="text-xs text-gray-400 font-mono w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* Track Info */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          {isPlaying ? 'Now Playing' : 'Paused'} • {formatTime(duration)}
        </p>
      </div>
    </div>
  )
}

export default AudioPlayer