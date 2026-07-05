import { useState, useEffect, useCallback, useRef } from 'react'
import { syllables, difficultySettings } from '../data/hangul'
import GameControls from './GameControls'
import ProgressBar from './ProgressBar'
import CircularTimer from './CircularTimer'

const DECK_SIZE = 20

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickChoices(correct, pool) {
  const others = pool.filter(s => s.display !== correct.display)
  const shuffled = shuffle(others)
  const choices = [correct, ...shuffled.slice(0, 3)]
  return shuffle(choices)
}

export default function ListenGame({ onGameComplete, onBack }) {
  const [screen, setScreen] = useState('start')
  const [mode, setMode] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [choices, setChoices] = useState([])
  const [selected, setSelected] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)

  const timerRef = useRef(null)
  const currentSyllable = deck[currentIndex]

  const speakSyllable = useCallback(async (syl) => {
    if (syl?.audioFile) {
      setAudioPlaying(true)
      return new Promise((resolve) => {
        const audio = new Audio(`audio/${syl.audioFile}`)
        audio.onended = () => { setAudioPlaying(false); resolve() }
        audio.onerror = () => { setAudioPlaying(false); resolve() }
        audio.play().catch(() => { setAudioPlaying(false); resolve() })
      })
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
    if (timeRemaining === 0 && timerRef.current && currentSyllable && !showFeedback) {
      handleTimeout()
    }
  }, [timeRemaining, currentSyllable, showFeedback])

  const handleTimeout = useCallback(() => {
    if (!currentSyllable) return
    stopTimer()
    const result = {
      syllable: currentSyllable.display,
      romanization: currentSyllable.romanization,
      correct: false,
      selected: null,
      points: 0,
      timedOut: true,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setShowFeedback(true)
    speakSyllable(currentSyllable)
  }, [currentSyllable, stopTimer, speakSyllable])

  const startGame = useCallback((selectedMode, selectedDifficulty = null) => {
    const shuffled = shuffle(syllables).slice(0, DECK_SIZE)
    setDeck(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setSelected(null)
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
    setSelected(null)
    setShowFeedback(false)
    setFeedbackResult(null)
    setTimeRemaining(0)
    setConfirmQuit(false)
  }, [stopTimer])

  const requestQuit = useCallback(() => {
    if (results.length > 0) {
      setConfirmQuit(true)
    } else {
      confirmQuitGame()
    }
  }, [results, confirmQuitGame])

  const selectAnswer = useCallback((syl) => {
    if (showFeedback || !currentSyllable) return
    setSelected(syl)
    stopTimer()
    const isCorrect = syl.display === currentSyllable.display
    const points = isCorrect ? 2 : 0
    const result = {
      syllable: currentSyllable.display,
      romanization: currentSyllable.romanization,
      correct: isCorrect,
      selected: syl.display,
      points,
      timedOut: false,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setScore(prev => prev + points)
    setShowFeedback(true)
    playSfx(isCorrect ? 'correct' : 'wrong')
    speakSyllable(currentSyllable)
  }, [currentSyllable, showFeedback, stopTimer, speakSyllable, playSfx])

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= deck.length) {
      setScreen('complete')
      setShowFeedback(false)
      return
    }
    setCurrentIndex(next)
    setSelected(null)
    setShowFeedback(false)
    setFeedbackResult(null)
    if (mode === 'timer' && difficulty) {
      startTimer(difficultySettings[difficulty].timePerLetter)
    }
  }, [currentIndex, deck, mode, difficulty, startTimer])

  const handleFinishGame = useCallback(() => {
    const session = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      mode: mode || 'freeplay',
      difficulty: difficulty || undefined,
      score,
      totalPossible: deck.length * 2,
      completedLetters: deck.length,
      totalLetters: deck.length,
      letterResults: results.map(r => ({
        letter: r.syllable,
        romanization: r.romanization,
        typeCorrect: r.correct,
        soundCorrect: r.correct,
        typeAnswer: r.selected,
        soundAnswer: r.romanization,
        points: r.points,
      })),
      completedAt: new Date().toISOString(),
    }
    onGameComplete(session)
    confirmQuitGame()
  }, [mode, difficulty, score, deck, results, onGameComplete, confirmQuitGame])

  useEffect(() => {
    if (currentSyllable && screen === 'playing') {
      setChoices(pickChoices(currentSyllable, syllables))
      if (!showFeedback) {
        speakSyllable(currentSyllable)
      }
    }
  }, [currentSyllable, screen, showFeedback, speakSyllable])

  // Start Screen
  if (screen === 'start') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-lg w-full animate-fade-in">
          <div className="text-5xl mb-3 font-hangul opacity-80">🔊</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Listen It!
          </h1>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
            Hear a Korean syllable, pick the correct one.
          </p>

          <div className="card text-left p-4 max-w-md mx-auto mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔊</div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">How to Play</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  A Korean syllable will be played aloud. Tap the correct Hangul syllable from 4 choices.
                  Build your listening comprehension!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-4">
            <button
              onClick={() => setScreen('difficulty-select')}
              className="py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 animate-slide-up"
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

          <p className="text-zinc-600 text-xs">
            {DECK_SIZE} syllables • {DECK_SIZE * 2} points max
          </p>

          <button onClick={onBack} className="mt-4 text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
            ← Back to game selection
          </button>
        </div>
      </div>
    )
  }

  // Difficulty Select
  if (screen === 'difficulty-select') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full animate-slide-up">
          <div className="text-3xl mb-2">⏱️</div>
          <h2 className="text-xl font-bold mb-1">Select Difficulty</h2>
          <p className="text-zinc-400 mb-5 text-sm">Time per syllable to answer</p>
          <div className="space-y-2">
            {Object.entries(difficultySettings).map(([key, settings], i) => (
              <button
                key={key}
                onClick={() => startGame('timer', key)}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-cyan-500/50 hover:bg-zinc-800/50 transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-sm font-semibold text-white group-hover:text-cyan-400">{settings.label}</span>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className={`h-1.5 rounded-full ${key === 'easy' ? 'w-full' : key === 'medium' ? 'w-3/4' : key === 'hard' ? 'w-1/2' : 'w-1/4'} bg-cyan-500/30`}>
                    <div className={`h-full rounded-full ${key === 'easy' ? 'bg-green-500 w-full' : key === 'medium' ? 'bg-yellow-500 w-full' : key === 'hard' ? 'bg-orange-500 w-full' : 'bg-red-500 w-full'}`}></div>
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
    const maxScore = deck.length * 2
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const correctCount = results.filter(r => r.correct).length

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full animate-slide-up">
          <div className="text-5xl mb-2">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold mb-1">Listen Complete!</h2>
          <p className="text-zinc-400 mb-5 text-sm">{mode === 'timer' ? 'Timer Mode' : 'Freeplay'}</p>

          <div className="card p-4 mb-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
              {score} / {maxScore}
            </div>
            <div className="text-zinc-500 text-xs">Total Score</div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
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
          <ListenFeedback
            result={feedbackResult}
            syllable={currentSyllable}
            onNext={handleNext}
            onSpeak={() => speakSyllable(currentSyllable)}
            speaking={audioPlaying}
          />
        ) : currentSyllable ? (
          <div className="w-full max-w-md animate-slide-up">
            {/* Listen prompt */}
            <div className="text-center mb-6">
              <p className="text-zinc-500 text-xs mb-3">Which syllable did you hear?</p>
              <button
                onClick={() => speakSyllable(currentSyllable)}
                disabled={audioPlaying}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-700/50 transition-all disabled:opacity-50 group"
              >
                <span className="text-2xl">{audioPlaying ? '🔊' : '🔇'}</span>
                <span className="text-sm text-zinc-400 group-hover:text-cyan-400 transition-colors">
                  {audioPlaying ? 'Playing...' : 'Play Again'}
                </span>
              </button>
            </div>

            {/* Choice grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {choices.map((syl) => (
                <button
                  key={syl.display}
                  onClick={() => selectAnswer(syl)}
                  disabled={showFeedback}
                  className={`h-24 rounded-xl border-2 text-4xl font-hangul transition-all duration-200 ${
                    showFeedback
                      ? syl.display === currentSyllable.display
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : selected?.display === syl.display
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-zinc-700 bg-zinc-900/50 text-zinc-600'
                      : 'border-zinc-700 bg-zinc-900/50 text-white hover:border-cyan-500/50 hover:bg-zinc-800/50 active:scale-95'
                  }`}
                >
                  {syl.display}
                </button>
              ))}
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

function ListenFeedback({ result, syllable, onNext, onSpeak, speaking }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full animate-slide-up">
        <div className="text-center mb-4">
          <span className="text-5xl font-hangul font-light block">{result.syllable}</span>
          <p className="text-zinc-400 mt-1 text-xs font-mono">/{result.romanization}/</p>
        </div>

        <div className={`p-3 rounded-lg border-2 mb-4 text-center ${
          result.correct
            ? 'bg-green-900/30 border-green-500'
            : result.timedOut
              ? 'bg-yellow-900/30 border-yellow-500'
              : 'bg-red-900/30 border-red-500'
        }`}>
          {result.correct ? (
            <>
              <div className="text-green-400 text-sm font-bold mb-1">Correct!</div>
              <div className="text-zinc-300 text-xs">You picked the right syllable.</div>
            </>
          ) : result.timedOut ? (
            <>
              <div className="text-yellow-400 text-sm font-bold mb-1">Time's Up!</div>
              <div className="text-zinc-300 text-xs">
                Answer: <span className="font-hangul text-green-400">{result.syllable}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-400 text-sm font-bold mb-1">Not Quite</div>
              <div className="text-zinc-300 text-xs">
                You picked: <span className="font-hangul text-red-400">{result.selected}</span>
              </div>
              <div className="text-zinc-300 text-xs mt-1">
                Correct: <span className="font-hangul text-green-400">{result.syllable}</span>
              </div>
            </>
          )}
        </div>

        <div className={`p-2.5 rounded-lg text-center font-bold text-sm mb-4 ${
          result.points === 2 ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'
        } border-2`}>
          +{result.points} / 2 points
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSpeak}
            disabled={speaking}
            className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
          >
            {speaking ? 'Playing...' : '🔊 Hear Again'}
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
