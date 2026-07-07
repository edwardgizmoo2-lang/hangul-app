import { useState, useEffect, useCallback, useRef } from 'react'
import { consonants, doubleConsonants, vowels, compoundVowels } from '../data/hangul'
import SpellGame from './SpellGame'
import ListenGame from './ListenGame'
import ClassifyGame from './ClassifyGame'
import ReadGame from './ReadGame'

const ALL_LETTERS = [
  ...consonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...doubleConsonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...vowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
  ...compoundVowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
]

export default function LearnTab({ onGameComplete, onGameStateChange, backSignal }) {
  const [gameType, setGameType] = useState(null) // null | 'classify' | 'read' | 'spell' | 'listen'

  const setGameTypeWrapped = useCallback((type) => {
    setGameType(type)
    onGameStateChange(type !== null)
  }, [onGameStateChange])

  const gameTypeRef = useRef(gameType)
  gameTypeRef.current = gameType

  useEffect(() => {
    if (gameTypeRef.current !== null) {
      setGameType(null)
      onGameStateChange(false)
    }
  }, [backSignal, onGameStateChange])

  if (gameType === 'listen') {
    return <ListenGame onGameComplete={onGameComplete} onBack={() => setGameTypeWrapped(null)} gameType="listen" />
  }

  if (gameType === 'spell') {
    return <SpellGame onGameComplete={onGameComplete} onBack={() => setGameTypeWrapped(null)} gameType="spell" />
  }

  if (gameType === 'classify') {
    return <ClassifyGame onGameComplete={onGameComplete} onBack={() => setGameTypeWrapped(null)} gameType="classify" />
  }

  if (gameType === 'read') {
    return <ReadGame onGameComplete={onGameComplete} onBack={() => setGameTypeWrapped(null)} gameType="read" />
  }

  // Game Type Selection
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="text-center max-w-lg w-full animate-fade-in">
        <div className="text-5xl mb-3 font-hangul opacity-80">한글</div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Hangul Learn
        </h1>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
          Choose a game mode to start learning.
        </p>

        <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => setGameTypeWrapped('classify')}
            className="card p-5 text-left hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group animate-scale-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-4">
              <img src="icons/classify_icon.png" className="w-[3.75rem] h-[3.75rem]" alt="" />
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-purple-400 transition-colors">Classify It!</h3>
                <p className="text-zinc-500 text-xs">See a letter, is it consonant or vowel? {ALL_LETTERS.length} letters.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setGameTypeWrapped('read')}
            className="card p-5 text-left hover:border-green-500/50 hover:bg-zinc-800/50 transition-all group animate-scale-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center gap-4">
              <img src="icons/read_icon.png" className="w-[3.75rem] h-[3.75rem]" alt="" />
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-green-400 transition-colors">Read It!</h3>
                <p className="text-zinc-500 text-xs">See a letter, pick its sound from 4 choices. {ALL_LETTERS.length} letters.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setGameTypeWrapped('listen')}
            className="card p-5 text-left hover:border-cyan-500/50 hover:bg-zinc-800/50 transition-all group animate-scale-in"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center gap-4">
              <img src="icons/listen_icon.png" className="w-[3.75rem] h-[3.75rem]" alt="" />
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-cyan-400 transition-colors">Listen It!</h3>
                <p className="text-zinc-500 text-xs">Hear a Korean syllable, pick the correct Hangul from 4 choices.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setGameTypeWrapped('spell')}
            className="card p-5 text-left hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group animate-scale-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-4">
              <img src="icons/spell_icon.png" className="w-[3.75rem] h-[3.75rem]" alt="" />
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-amber-400 transition-colors">Spell It!</h3>
                <p className="text-zinc-500 text-xs">See the romanization, pick Korean letters to spell it.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
