import { useState, useEffect, useCallback, useRef } from 'react'
import { consonants, doubleConsonants, vowels, difficultySettings } from '../data/hangul'
import LetterCard from './LetterCard'
import GameControls from './GameControls'
import ProgressBar from './ProgressBar'
import FeedbackOverlay from './FeedbackOverlay'
import CircularTimer from './CircularTimer'
import SpellGame from './SpellGame'

const ALL_LETTERS = [
  ...consonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...doubleConsonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...vowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
]

function getSoundOptions(correctAnswer) {
  const allRomanizations = [...new Set(ALL_LETTERS.map(l => l.romanization))]
  const options = [correctAnswer]
  while (options.length < 4) {
    const random = allRomanizations[Math.floor(Math.random() * allRomanizations.length)]
    if (!options.includes(random)) {
      options.push(random)
    }
  }
  return options.sort(() => Math.random() - 0.5)
}

export default function LearnTab({ onGameComplete, koreanVoiceAvailable }) {
  const [gameType, setGameType] = useState(null) // null | 'letter' | 'spell'

  if (gameType === 'spell') {
    return <SpellGame onGameComplete={onGameComplete} koreanVoiceAvailable={koreanVoiceAvailable} onBack={() => setGameType(null)} />
  }

  if (gameType === 'letter') {
    return <LetterGame onGameComplete={onGameComplete} koreanVoiceAvailable={koreanVoiceAvailable} onBack={() => setGameType(null)} />
  }

  // Game Type Selection
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="text-center max-w-lg w-full animate-fade-in">
        <div className="text-5xl mb-3 font-hangul opacity-80">한글</div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Hangul Master
        </h1>
        <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
          Choose a game mode to start learning.
        </p>

        {!koreanVoiceAvailable && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-600/30 rounded-lg text-amber-300 text-xs max-w-sm mx-auto">
            Korean TTS voice not detected. Install Korean language pack in Windows Settings.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => setGameType('letter')}
            className="card p-5 text-left hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🇰🇷</div>
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-purple-400 transition-colors">Letter Recognition</h3>
                <p className="text-zinc-500 text-xs">See a Korean letter, pick its type and sound. {ALL_LETTERS.length} letters.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setGameType('spell')}
            className="card p-5 text-left hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔤</div>
              <div>
                <h3 className="text-white font-bold text-base mb-0.5 group-hover:text-amber-400 transition-colors">Spell It!</h3>
                <p className="text-zinc-500 text-xs">See the romanization, pick Korean letters to spell it. Hear each letter as you pick.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function LetterGame({ onGameComplete, koreanVoiceAvailable, onBack }) {
  const [screen, setScreen] = useState('start') // 'start' | 'mode-select' | 'difficulty-select' | 'playing' | 'feedback' | 'complete'
  const [mode, setMode] = useState(null) // 'timer' | 'freeplay'
  const [difficulty, setDifficulty] = useState(null)
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [letterResults, setLetterResults] = useState([])
  const [typeAnswer, setTypeAnswer] = useState(null)
  const [soundAnswer, setSoundAnswer] = useState(null)
  const [soundOptions, setSoundOptions] = useState([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [showTTSWarning, setShowTTSWarning] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)

  const timerRef = useRef(null)
  const currentLetter = deck[currentIndex]

  const speakKorean = useCallback(async (text) => {
    if (!('speechSynthesis' in window)) {
      setShowTTSWarning(true)
      setTimeout(() => setShowTTSWarning(false), 3000)
      return
    }
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR'
      utterance.rate = 0.85
      utterance.pitch = 1
      utterance.volume = 1
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      speechSynthesis.speak(utterance)
    })
  }, [])

  const startTimer = useCallback((seconds) => {
    setTimeRemaining(seconds)
    setTotalTime(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleTimeout = useCallback(() => {
    if (!currentLetter) return
    stopTimer()
    const result = {
      letter: currentLetter.character || currentLetter.char,
      type: currentLetter.type,
      romanization: currentLetter.romanization,
      typeAnswer: null,
      soundAnswer: null,
      typeCorrect: false,
      soundCorrect: false,
      points: 0,
    }
    setLetterResults(prev => [...prev, result])
    setScore(prev => prev)
    setShowFeedback(true)
    setTypeAnswer(null)
    setSoundAnswer(null)
    speakLetter(currentLetter.character || currentLetter.char)
  }, [currentLetter, stopTimer])

  const speakLetter = useCallback(async (text) => {
    if (!koreanVoiceAvailable) {
      setShowTTSWarning(true)
      setTimeout(() => setShowTTSWarning(false), 3000)
      return
    }
    await speakKorean(text)
  }, [koreanVoiceAvailable, speakKorean])

  useEffect(() => {
    if (timeRemaining === 0 && timerRef.current && currentLetter && !showFeedback) {
      handleTimeout()
    }
  }, [timeRemaining, currentLetter, showFeedback, handleTimeout])

  const startGame = useCallback((selectedMode, selectedDifficulty = null) => {
    const shuffled = [...ALL_LETTERS].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setLetterResults([])
    setTypeAnswer(null)
    setSoundAnswer(null)
    setShowFeedback(false)
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setScreen('playing')
    if (selectedMode === 'timer' && selectedDifficulty) {
      const time = difficultySettings[selectedDifficulty].timePerLetter
      startTimer(time)
    }
  }, [startTimer])

  const confirmQuitGame = useCallback(() => {
    stopTimer()
    setScreen('start')
    setMode(null)
    setDifficulty(null)
    setDeck([])
    setCurrentIndex(0)
    setScore(0)
    setLetterResults([])
    setTypeAnswer(null)
    setSoundAnswer(null)
    setShowFeedback(false)
    setTimeRemaining(0)
    setConfirmQuit(false)
  }, [stopTimer])

  const requestQuit = useCallback(() => {
    if (letterResults.length > 0) {
      setConfirmQuit(true)
    } else {
      confirmQuitGame()
    }
  }, [letterResults, confirmQuitGame])

  const selectTypeAnswer = useCallback((answer) => {
    setTypeAnswer(answer)
  }, [])

  const selectSoundAnswer = useCallback((answer) => {
    setSoundAnswer(answer)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!currentLetter) return
    stopTimer()
    const typeCorrect = typeAnswer === currentLetter.type
    const soundCorrect = soundAnswer === currentLetter.romanization
    const points = (typeCorrect ? 1 : 0) + (soundCorrect ? 1 : 0)
    const result = {
      letter: currentLetter.character || currentLetter.char,
      type: currentLetter.type,
      romanization: currentLetter.romanization,
      typeAnswer,
      soundAnswer,
      typeCorrect,
      soundCorrect,
      points,
    }
    setLetterResults(prev => [...prev, result])
    setScore(prev => prev + points)
    setShowFeedback(true)
    if (!koreanVoiceAvailable) {
      setShowTTSWarning(true)
      setTimeout(() => setShowTTSWarning(false), 3000)
    }
    speakLetter(currentLetter.character || currentLetter.char)
  }, [currentLetter, typeAnswer, soundAnswer, stopTimer, speakLetter, koreanVoiceAvailable])

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= deck.length) {
      setScreen('complete')
      setShowFeedback(false)
      return
    }
    setCurrentIndex(nextIndex)
    setTypeAnswer(null)
    setSoundAnswer(null)
    setShowFeedback(false)
    if (mode === 'timer' && difficulty) {
      startTimer(difficultySettings[difficulty].timePerLetter)
    }
    setSoundOptions(getSoundOptions(deck[nextIndex].romanization))
  }, [currentIndex, deck, mode, difficulty, startTimer])

  useEffect(() => {
    if (currentLetter && screen === 'playing') {
      setSoundOptions(getSoundOptions(currentLetter.romanization))
    }
  }, [currentLetter, screen])

  const handleFinishGame = useCallback(() => {
    const session = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      mode: mode || 'freeplay',
      difficulty: difficulty || undefined,
      score: score,
      totalPossible: deck.length * 2,
      completedLetters: deck.length,
      totalLetters: deck.length,
      letterResults: letterResults,
      completedAt: new Date().toISOString(),
    }
    onGameComplete(session)
    confirmQuitGame()
  }, [mode, difficulty, score, deck, letterResults, onGameComplete, confirmQuitGame])

  const canSubmit = typeAnswer !== null && soundAnswer !== null

  // Start Screen
  if (screen === 'start') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-lg w-full animate-fade-in">
          <div className="text-5xl mb-3 font-hangul opacity-80">🇰🇷</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Letter Recognition
          </h1>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
            Master the Korean alphabet through interactive practice.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
            <div className="card text-left p-4">
              <div className="text-xl mb-1">⏱️</div>
              <h3 className="text-white font-semibold text-sm mb-0.5">Timer Mode</h3>
              <p className="text-zinc-500 text-xs">Race against the clock</p>
            </div>
            <div className="card text-left p-4">
              <div className="text-xl mb-1">🧘</div>
              <h3 className="text-white font-semibold text-sm mb-0.5">Freeplay Mode</h3>
              <p className="text-zinc-500 text-xs">Learn at your own pace</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              onClick={() => setScreen('difficulty-select')}
              className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              ⏱️ Timer Mode
            </button>
            <button
              onClick={() => startGame('freeplay')}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25"
            >
              🧘 Freeplay Mode
            </button>
          </div>

          <p className="text-zinc-600 text-xs mt-4">
            {ALL_LETTERS.length} letters • {ALL_LETTERS.length * 2} points max
          </p>

          <button onClick={onBack} className="mt-4 text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
            ← Back to game selection
          </button>
        </div>
      </div>
    )
  }

  // Difficulty Select Screen
  if (screen === 'difficulty-select') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full animate-slide-up">
          <div className="text-3xl mb-2">⏱️</div>
          <h2 className="text-xl font-bold mb-1">Select Difficulty</h2>
          <p className="text-zinc-400 mb-5 text-sm">Choose how much time you get per letter</p>

          <div className="space-y-2">
            {Object.entries(difficultySettings).map(([key, settings]) => (
              <button
                key={key}
                onClick={() => startGame('timer', key)}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group"
              >
                <span className="text-sm font-semibold text-white group-hover:text-purple-400">{settings.label}</span>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className={`h-1.5 rounded-full ${key === 'easy' ? 'w-full' : key === 'medium' ? 'w-3/4' : key === 'hard' ? 'w-1/2' : 'w-1/4'} bg-purple-500/30`}>
                    <div className={`h-full rounded-full ${key === 'easy' ? 'bg-green-500 w-full' : key === 'medium' ? 'bg-yellow-500 w-full' : key === 'hard' ? 'bg-orange-500 w-full' : 'bg-red-500 w-full'}`}></div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setScreen('start')}
            className="mt-4 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
          >
            ← Back to mode selection
          </button>
        </div>
      </div>
    )
  }

  // Complete Screen
  if (screen === 'complete') {
    const maxScore = deck.length * 2
    const percentage = Math.round((score / maxScore) * 100)
    const typeCorrectCount = letterResults.filter(r => r.typeCorrect).length
    const soundCorrectCount = letterResults.filter(r => r.soundCorrect).length

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full animate-slide-up">
          <div className="text-5xl mb-2">{percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold mb-1">Game Complete!</h2>
          <p className="text-zinc-400 mb-5 text-sm">{mode === 'timer' ? 'Timer Mode' : 'Freeplay'}</p>

          <div className="card p-4 mb-5">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              {score} / {maxScore}
            </div>
            <div className="text-zinc-500 text-xs">Total Score</div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-3 text-center">
              <div className="text-lg font-bold text-green-400">{typeCorrectCount}</div>
              <div className="text-zinc-500 text-xs">Type Correct</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">{soundCorrectCount}</div>
              <div className="text-zinc-500 text-xs">Sound Correct</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFinishGame}
              className="flex-1 py-2.5 px-4 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-500 transition-all"
            >
              Save & Finish
            </button>
            <button
              onClick={confirmQuitGame}
              className="py-2.5 px-4 bg-zinc-800 text-zinc-300 font-medium text-sm rounded-lg hover:bg-zinc-700 transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Playing Screen
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 pb-0">
        <ProgressBar
          current={currentIndex + 1}
          total={deck.length}
          score={score}
        />
        {mode === 'timer' && difficulty && (
          <div className="flex justify-center my-4">
            <CircularTimer
              timeRemaining={timeRemaining}
              totalTime={totalTime}
              isRunning={!showFeedback && timerRef.current !== null}
              onTimeout={handleTimeout}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {showFeedback && currentLetter && letterResults.length > 0 ? (
          <FeedbackOverlay
            result={letterResults[letterResults.length - 1]}
            letter={currentLetter}
            onNext={handleNext}
            onSpeak={() => speakLetter(currentLetter.character || currentLetter.char)}
            speaking={false}
          />
        ) : currentLetter ? (
          <LetterCard
            letter={currentLetter}
            soundOptions={soundOptions}
            typeAnswer={typeAnswer}
            soundAnswer={soundAnswer}
            onTypeSelect={selectTypeAnswer}
            onSoundSelect={selectSoundAnswer}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            speaking={false}
            showTTSWarning={showTTSWarning}
          />
        ) : null}
      </div>

      <GameControls onQuit={requestQuit} disabled={showFeedback} />

      {confirmQuit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-white font-bold text-base mb-1">Quit Game?</h3>
              <p className="text-zinc-400 text-xs">Your progress in this game will not be saved.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmQuit(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-all"
              >
                Keep Playing
              </button>
              <button
                onClick={confirmQuitGame}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}