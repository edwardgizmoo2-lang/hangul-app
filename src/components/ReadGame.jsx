import { useState, useEffect, useCallback, useRef } from 'react'
import { consonants, doubleConsonants, vowels, compoundVowels, difficultySettings } from '../data/hangul'
import GameControls from './GameControls'
import ProgressBar from './ProgressBar'
import CircularTimer from './CircularTimer'
import PerfectOverlay from './PerfectOverlay'

const ALL_LETTERS = [
  ...consonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...doubleConsonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...vowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
  ...compoundVowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
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

export default function ReadGame({ onGameComplete, onBack, gameType }) {
  const [screen, setScreen] = useState('start')
  const [mode, setMode] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [soundOptions, setSoundOptions] = useState([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [showPerfect, setShowPerfect] = useState(false)

  const timerRef = useRef(null)
  const currentLetter = deck[currentIndex]

  const speakLetter = useCallback(async (letter) => {
    if (letter?.audioFile) {
      const audio = new Audio(`audio/${letter.audioFile}`)
      await audio.play().catch(() => {})
    }
  }, [])

  const playSfx = useCallback((type) => {
    const audio = new Audio(`audio/sfx/${type}.mp3`)
    audio.play().catch(() => {})
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
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (timeRemaining === 0 && timerRef.current && currentLetter && !showFeedback) {
      handleTimeout()
    }
  }, [timeRemaining, currentLetter, showFeedback])

  useEffect(() => {
    if (currentLetter && screen === 'playing') {
      setSoundOptions(getSoundOptions(currentLetter.romanization))
    }
  }, [currentLetter, screen])

  const handleTimeout = useCallback(() => {
    if (!currentLetter) return
    stopTimer()
    const result = {
      letter: currentLetter.character || currentLetter.char,
      romanization: currentLetter.romanization,
      soundCorrect: false,
      points: 0,
      timedOut: true,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setShowFeedback(true)
    speakLetter(currentLetter)
  }, [currentLetter, stopTimer, speakLetter])

  const startGame = useCallback((selectedMode, selectedDifficulty = null) => {
    const shuffled = [...ALL_LETTERS].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setShowFeedback(false)
    setFeedbackResult(null)
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    setScreen('playing')
    if (selectedMode === 'timer' && selectedDifficulty) {
      startTimer(difficultySettings[selectedDifficulty].timePerLetter)
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
    setResults([])
    setShowFeedback(false)
    setFeedbackResult(null)
    setTimeRemaining(0)
    setConfirmQuit(false)
  }, [stopTimer])

  const requestQuit = useCallback(() => {
    if (results.length > 0) {
      playSfx('leave_game')
      setConfirmQuit(true)
    } else {
      confirmQuitGame()
    }
  }, [results, confirmQuitGame, playSfx])

  const selectAnswer = useCallback((answer) => {
    if (showFeedback || !currentLetter) return
    stopTimer()
    const soundCorrect = answer === currentLetter.romanization
    const points = soundCorrect ? 1 : 0
    const result = {
      letter: currentLetter.character || currentLetter.char,
      romanization: currentLetter.romanization,
      soundCorrect,
      soundAnswer: answer,
      points,
      timedOut: false,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setScore(prev => prev + points)
    setShowFeedback(true)
    playSfx(soundCorrect ? 'correct' : 'wrong')
    speakLetter(currentLetter)
  }, [currentLetter, showFeedback, stopTimer, speakLetter, playSfx])

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= deck.length) {
      setScreen('complete')
      setShowFeedback(false)
      return
    }
    setCurrentIndex(next)
    setShowFeedback(false)
    setFeedbackResult(null)
    if (mode === 'timer' && difficulty) {
      startTimer(difficultySettings[difficulty].timePerLetter)
    }
  }, [currentIndex, deck, mode, difficulty, startTimer])

  useEffect(() => {
    if (screen === 'complete') {
      const totalPossible = deck.length * 1
      const pct = score / totalPossible
      if (pct >= 1) playSfx('Perfect_Score')
      else if (pct >= 0.8) playSfx('High_Score')
      else if (pct >= 0.5) playSfx('Mid_Score')
      else playSfx('Low_Score')
      if (score >= totalPossible) {
        setShowPerfect(true)
      }
    }
  }, [screen, score, deck.length])

  const handleFinishGame = useCallback(() => {
    const totalPossible = deck.length * 1
    const isPerfect = score >= totalPossible
    const session = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      mode: mode || 'freeplay',
      difficulty: difficulty || undefined,
      gameType: gameType,
      score,
      totalPossible,
      completedLetters: deck.length,
      totalLetters: deck.length,
      letterResults: results.map(r => ({
        letter: r.letter,
        romanization: r.romanization,
        typeCorrect: r.soundCorrect,
        soundCorrect: r.soundCorrect,
        typeAnswer: r.soundAnswer || '',
        soundAnswer: r.soundAnswer || '',
        points: r.points,
      })),
      completedAt: new Date().toISOString(),
      perfect: isPerfect,
    }
    onGameComplete(session)
    confirmQuitGame()
  }, [mode, difficulty, score, deck, results, onGameComplete, confirmQuitGame, gameType])

  // Start Screen
  if (screen === 'start') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-lg w-full animate-fade-in">
          <div className="text-5xl mb-3 font-hangul opacity-80">📖</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Read It!
          </h1>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
            See a Korean letter, pick its correct sound from 4 choices.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
            <div className="card text-left p-4 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="text-xl mb-1">⏱️</div>
              <h3 className="text-white font-semibold text-sm mb-0.5">Timer Mode</h3>
              <p className="text-zinc-500 text-xs">Race against the clock</p>
            </div>
            <div className="card text-left p-4 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="text-xl mb-1">🧘</div>
              <h3 className="text-white font-semibold text-sm mb-0.5">Freeplay Mode</h3>
              <p className="text-zinc-500 text-xs">Learn at your own pace</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              onClick={() => setScreen('difficulty-select')}
              className="py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/25 animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              ⏱️ Timer Mode
            </button>
            <button
              onClick={() => startGame('freeplay')}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 animate-slide-up"
              style={{ animationDelay: '300ms' }}
            >
              🧘 Freeplay Mode
            </button>
          </div>

          <p className="text-zinc-600 text-xs mt-4">
            {ALL_LETTERS.length} letters
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
            {Object.entries(difficultySettings).map(([key, settings], i) => (
              <button
                key={key}
                onClick={() => startGame('timer', key)}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-green-500/50 hover:bg-zinc-800/50 transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-sm font-semibold text-white group-hover:text-green-400">{settings.label}</span>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className={`h-1.5 rounded-full ${key === 'easy' ? 'w-full' : key === 'medium' ? 'w-3/4' : key === 'hard' ? 'w-1/2' : 'w-1/4'} bg-rose-500/30`}>
                    <div className={`h-full rounded-full ${key === 'easy' ? 'bg-green-500 w-full' : key === 'medium' ? 'bg-yellow-500 w-full' : key === 'hard' ? 'bg-orange-500 w-full' : 'bg-red-500 w-full'}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setScreen('start')} className="mt-4 text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // Complete Screen
  if (screen === 'complete') {
    const totalPossible = deck.length * 1
    const pct = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
    const isPerfect = score >= totalPossible
    const correctCount = results.filter(r => r.soundCorrect).length

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        {showPerfect && <PerfectOverlay onDismiss={() => setShowPerfect(false)} />}
        <div className="text-center max-w-sm w-full animate-slide-up">
          <div className="text-5xl mb-2">{isPerfect ? '💯' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          {isPerfect ? (
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              PERFECT!
            </h2>
          ) : (
            <h2 className="text-2xl font-bold mb-1">Read Complete!</h2>
          )}
          <p className="text-zinc-400 mb-5 text-sm">{mode === 'timer' ? 'Timer Mode' : 'Freeplay'}</p>

          <div className={`card p-4 mb-5 animate-slide-up ${isPerfect ? 'border-amber-400/50 animate-perfect-glow' : ''}`} style={{ animationDelay: '100ms' }}>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
              {score} / {totalPossible}
            </div>
            <div className="text-zinc-500 text-xs">Total Score</div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-3 text-center animate-scale-in" style={{ animationDelay: '200ms' }}>
              <div className="text-lg font-bold text-green-400">{correctCount}</div>
              <div className="text-zinc-500 text-xs">Correct</div>
            </div>
            <div className="card p-3 text-center animate-scale-in" style={{ animationDelay: '300ms' }}>
              <div className="text-lg font-bold text-red-400">{deck.length - correctCount}</div>
              <div className="text-zinc-500 text-xs">Missed</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleFinishGame} className="flex-1 py-2.5 px-4 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-500 transition-all">
              Save & Finish
            </button>
            <button onClick={confirmQuitGame} className="py-2.5 px-4 bg-zinc-800 text-zinc-300 font-medium text-sm rounded-lg hover:bg-zinc-700 transition-all">
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
        <ProgressBar current={currentIndex + 1} total={deck.length} score={score} />
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
        {showFeedback && feedbackResult ? (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full animate-slide-up">
              <div className="text-center mb-4">
                <span className="text-5xl font-hangul font-light block">{currentLetter?.character || currentLetter?.char}</span>
                <p className="text-zinc-400 mt-1 text-xs font-mono">/{currentLetter?.romanization}/</p>
              </div>

              <div className={`p-3 rounded-lg border-2 mb-4 text-center ${
                feedbackResult.soundCorrect
                  ? 'bg-green-900/30 border-green-500'
                  : feedbackResult.timedOut
                    ? 'bg-yellow-900/30 border-yellow-500'
                    : 'bg-red-900/30 border-red-500'
              }`}>
                {feedbackResult.soundCorrect ? (
                  <>
                    <div className="text-green-400 text-sm font-bold mb-1">Correct!</div>
                    <div className="text-zinc-300 text-xs">/{currentLetter?.romanization}/ is the right sound.</div>
                  </>
                ) : feedbackResult.timedOut ? (
                  <>
                    <div className="text-yellow-400 text-sm font-bold mb-1">Time's Up!</div>
                    <div className="text-zinc-300 text-xs">
                      Answer: <span className="text-green-400 font-mono">/{currentLetter?.romanization}/</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-red-400 text-sm font-bold mb-1">Not Quite</div>
                    <div className="text-zinc-300 text-xs">
                      You picked: <span className="text-red-400 font-mono">/{feedbackResult.soundAnswer}/</span>
                    </div>
                    <div className="text-zinc-300 text-xs mt-1">
                      Correct: <span className="text-green-400 font-mono">/{currentLetter?.romanization}/</span>
                    </div>
                  </>
                )}
              </div>

              <div className={`p-2.5 rounded-lg text-center font-bold text-sm mb-4 ${
                feedbackResult.points === 1 ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'
              } border-2`}>
                {feedbackResult.points === 1 ? '+1 Point!' : '0 Point'}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => speakLetter(currentLetter)}
                  className="flex-1 py-2 px-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                >
                  🔊 Hear Pronunciation
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : currentLetter ? (
          <div className="w-full max-w-md animate-slide-up">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mb-4">
              <div className="text-center mb-5">
                <span className="text-6xl font-hangul font-light select-none block">{currentLetter.character || currentLetter.char}</span>
                <p className="text-zinc-500 mt-1 text-xs">What sound does this letter make?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {soundOptions.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(option)}
                    disabled={showFeedback}
                    className={`py-4 rounded-xl border-2 text-base font-bold transition-all duration-200 ${
                      showFeedback
                        ? option === currentLetter.romanization
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : feedbackResult?.soundAnswer === option
                            ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-zinc-700 bg-zinc-900/50 text-zinc-600'
                        : 'border-zinc-700 bg-zinc-900/50 text-white hover:border-green-500/50 hover:bg-zinc-800/50 active:scale-95'
                    }`}
                  >
                    /{option}/
                  </button>
                ))}
              </div>
            </div>
          </div>
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
              <button onClick={() => setConfirmQuit(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-all">
                Keep Playing
              </button>
              <button onClick={confirmQuitGame} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all">
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
