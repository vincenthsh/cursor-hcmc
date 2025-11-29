import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Music, Users, Mic2, Star, Trophy, Clock } from 'lucide-react'

interface InstructionsModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  {
    title: 'Welcome to Cacophony!',
    icon: Music,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">
          Cacophony is a multiplayer music battle game where you compete to create the{' '}
          <span className="text-purple-400 font-bold">funniest AI-generated songs</span>.
        </p>
        <p className="text-gray-300">
          Match wild music genres with ridiculous lyrics to make your friends laugh!
        </p>
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30 mt-6">
          <div className="flex items-center justify-center gap-4">
            <Music className="w-16 h-16 text-purple-400" />
            <div className="text-4xl font-bold">+</div>
            <Mic2 className="w-16 h-16 text-pink-400" />
            <div className="text-4xl font-bold">=</div>
            <Star className="w-16 h-16 text-yellow-400" />
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">Genre + Lyrics = Hilarious Songs</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Game Setup',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">
          <span className="font-bold text-purple-400">3-8 players</span> can join a game using a room code.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <h4 className="font-bold text-purple-400 mb-2">Host</h4>
            <p className="text-sm text-gray-300">Create a room and share the 6-character code with friends</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <h4 className="font-bold text-blue-400 mb-2">Join</h4>
            <p className="text-sm text-gray-300">Enter the room code to join an existing game</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-600 mt-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users className="w-8 h-8 text-green-400" />
            <div className="text-2xl font-mono font-bold text-green-400">ABC123</div>
          </div>
          <p className="text-center text-sm text-gray-400">Share this code to invite players!</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Roles: Producer vs Artists',
    icon: Star,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">Each round has two roles that rotate:</p>
        <div className="space-y-4 mt-6">
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-5 border border-yellow-600/40">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <h4 className="font-bold text-xl text-yellow-400">The Producer</h4>
            </div>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Draws a <strong>Vibe Card</strong> (e.g., "A sad country song about ___")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Listens to all submitted songs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Votes for the funniest one</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-600/40">
            <div className="flex items-center gap-3 mb-3">
              <Mic2 className="w-8 h-8 text-blue-400" />
              <h4 className="font-bold text-xl text-blue-400">The Artists</h4>
            </div>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Select a <strong>Lyric Card</strong> from their hand</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Fill in creative blanks to complete the lyrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Submit to generate an AI song</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center mt-4">
          The Producer role rotates each round so everyone gets a turn!
        </p>
      </div>
    ),
  },
  {
    title: 'How a Round Works',
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">Each round follows these steps:</p>
        <div className="space-y-3 mt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h5 className="font-bold text-purple-400 mb-1">Vibe Card Revealed</h5>
              <p className="text-sm text-gray-300">Producer's genre card is shown to all players</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h5 className="font-bold text-blue-400 mb-1">Artists Select & Create</h5>
              <p className="text-sm text-gray-300">
                Pick a lyric card, fill in the blanks, and submit (60 seconds)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h5 className="font-bold text-pink-400 mb-1">Songs Generate</h5>
              <p className="text-sm text-gray-300">AI creates songs from your submissions</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h5 className="font-bold text-green-400 mb-1">Producer Listens & Votes</h5>
              <p className="text-sm text-gray-300">Producer picks the funniest song</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h5 className="font-bold text-yellow-400 mb-1">Winner Gets a Point!</h5>
              <p className="text-sm text-gray-300">The chosen artist scores, then next round begins</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30 mt-6">
          <p className="text-sm text-gray-300 text-center">
            <Clock className="w-4 h-4 inline mr-2" />
            Each round takes about <strong className="text-purple-400">2-3 minutes</strong>
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Lyric Cards Explained',
    icon: Mic2,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">
          Lyric cards have templates with <span className="text-pink-400 font-bold">blanks</span> you fill in:
        </p>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
          <div className="text-center mb-4">
            <div className="inline-block bg-pink-600 text-white px-4 py-2 rounded-lg font-bold mb-4">
              Lyric Card
            </div>
          </div>
          <p className="text-xl text-gray-200 text-center mb-6 font-mono">
            "I can't stop thinking about{' '}
            <span className="text-pink-400 font-bold underline">[your answer]</span>"
          </p>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Example fill-ins:</p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-pink-400">→</span>
                <span>"I can't stop thinking about <strong>my therapist's therapist</strong>"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400">→</span>
                <span>"I can't stop thinking about <strong>garlic bread at 3am</strong>"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400">→</span>
                <span>"I can't stop thinking about <strong>existential dread</strong>"</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center mt-4">
          The funnier and more creative, the better chance you have to win!
        </p>
      </div>
    ),
  },
  {
    title: 'Winning the Game',
    icon: Trophy,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300">
          The game continues for <span className="text-purple-400 font-bold">3 rounds</span> (or custom amount).
        </p>
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-600/40 mt-6">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-400" />
          </div>
          <p className="text-xl text-center text-gray-200 mb-2">
            Player with the <strong className="text-yellow-400">most points</strong> wins!
          </p>
          <p className="text-sm text-center text-gray-400">
            (Points are earned by winning rounds as an Artist)
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mt-6">
          <h4 className="font-bold text-purple-400 mb-3 text-center">Pro Tips:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">💡</span>
              <span>
                <strong>Be creative:</strong> Unexpected combinations are usually the funniest
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">💡</span>
              <span>
                <strong>Know your producer:</strong> What makes them laugh?
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">💡</span>
              <span>
                <strong>Embrace the chaos:</strong> The AI songs are unpredictable and that's the fun!
              </span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Ready to Play!',
    icon: Music,
    content: (
      <div className="space-y-4">
        <p className="text-lg text-gray-300 text-center">You're all set to create musical chaos!</p>
        <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 rounded-xl p-8 border border-purple-500/30 mt-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Music className="w-12 h-12 text-purple-400 animate-pulse" />
            <h3 className="text-3xl font-bold gradient-text">Let's Go!</h3>
            <Mic2 className="w-12 h-12 text-pink-400 animate-pulse" />
          </div>
          <div className="space-y-3 text-center">
            <p className="text-gray-300">Create a room or join one to get started</p>
            <p className="text-sm text-gray-400">Remember: the goal is to make each other laugh!</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-6">
          <p className="text-xs text-gray-400 text-center">
            <strong>Note:</strong> Song generation powered by AI - results may be gloriously unpredictable!
          </p>
        </div>
      </div>
    ),
  },
]

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    onClose()
  }

  const CurrentIcon = STEPS[currentStep].icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-3xl w-full border border-gray-700 shadow-2xl my-8 animate-slideInFromBottom">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700 p-6 rounded-t-2xl">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <CurrentIcon className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold gradient-text">{STEPS[currentStep].title}</h2>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((step, index) => (
              <button
                key={`step-${step.title}-${index}`}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full flex-1 transition-all cursor-pointer hover:scale-y-150 ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : index < currentStep
                      ? 'bg-purple-600/50 hover:bg-purple-500/70'
                      : 'bg-gray-700 hover:bg-gray-600'
                }`}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div key={currentStep} className="animate-fadeIn">{STEPS[currentStep].content}</div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 rounded-b-2xl bg-gray-900/50">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentStep === STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                Get Started!
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
