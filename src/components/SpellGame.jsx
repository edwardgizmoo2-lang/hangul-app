import { useState, useEffect, useCallback, useRef } from 'react'
import { syllables, SPELL_CONSONANTS, SPELL_VOWELS, difficultySettings, consonants, doubleConsonants, vowels, compoundVowels } from '../data/hangul'
import GameControls from './GameControls'
import ProgressBar from './ProgressBar'
import CircularTimer from './CircularTimer'

const DECK_SIZE = 20

const ALL_LETTERS = [...consonants, ...doubleConsonants, ...vowels, ...compoundVowels]
const AUDIO_MAP = Object.fromEntries(ALL_LETTERS.map(l => [l.char, l.audioFile]))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SpellGame({ onGameComplete, koreanVoiceAvailable, onBack }) {
  const [screen, setScreen] = useState('start')
  const [mode, setMode] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [picked, setPicked] = useState([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [showTTSWarning, setShowTTSWarning] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)

  const timerRef = useRef(null)
  const currentSyllable = deck[currentIndex]

  const speakKorean = useCallback(async (text) => {
    if (!('speechSynthesis' in window)) {
      setShowTTSWarning(true)
      setTimeout(() => setShowTTSWarning(false), 3000)
      return
    }
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ko-KR'
      u.rate = 0.85
      u.pitch = 1
      u.volume = 1
      u.onend = () => resolve()
      u.onerror = () => resolve()
      speechSynthesis.speak(u)
    })
  }, [])

  const speakSyllable = useCallback(async (text) => {
    await speakKorean(text)
  }, [speakKorean])

  const playSfx = useCallback((type) => {
    const audio = new Audio(`/audio/sfx/${type}.mp3`)
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
      picked: [...picked],
      points: 0,
      timedOut: true,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setShowFeedback(true)
    speakSyllable(currentSyllable.display)
  }, [currentSyllable, picked, stopTimer, speakSyllable])

  const startGame = useCallback((selectedMode, selectedDifficulty = null) => {
    const shuffled = shuffle(syllables).slice(0, DECK_SIZE)
    setDeck(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setPicked([])
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
    setPicked([])
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

  const playLetterAudio = useCallback(async (char) => {
    const audioFile = AUDIO_MAP[char]
    if (!audioFile) return
    return new Promise((resolve) => {
      const audio = new Audio(`/audio/${audioFile}`)
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }, [])

  const pickTile = useCallback(async (char) => {
    if (showFeedback || !currentSyllable) return
    if (picked.length >= currentSyllable.letters.length) return
    const newPicked = [...picked, char]
    setPicked(newPicked)
    await playLetterAudio(char)
  }, [picked, currentSyllable, showFeedback, playLetterAudio])

  const clearPicks = useCallback(() => {
    setPicked([])
  }, [])

  const submitAnswer = useCallback(() => {
    if (!currentSyllable) return
    stopTimer()
    const isCorrect = picked.length === currentSyllable.letters.length &&
      picked.every((c, i) => c === currentSyllable.letters[i])
    const points = isCorrect ? 2 : 0
    const result = {
      syllable: currentSyllable.display,
      romanization: currentSyllable.romanization,
      correct: isCorrect,
      picked: [...picked],
      points,
      timedOut: false,
    }
    setFeedbackResult(result)
    setResults(prev => [...prev, result])
    setScore(prev => prev + points)
    setShowFeedback(true)
    playSfx(isCorrect ? 'correct' : 'wrong')
    speakSyllable(currentSyllable.display)
  }, [currentSyllable, picked, stopTimer, speakSyllable, playSfx])

  const handleNext = useCallback(() => {
    const next = currentIndex + 1
    if (next >= deck.length) {
      setScreen('complete')
      setShowFeedback(false)
      return
    }
    setCurrentIndex(next)
    setPicked([])
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
        typeAnswer: r.picked.join(''),
        soundAnswer: r.romanization,
        points: r.points,
      })),
      completedAt: new Date().toISOString(),
    }
    onGameComplete(session)
    confirmQuitGame()
  }, [mode, difficulty, score, deck, results, onGameComplete, confirmQuitGame])

  const canSubmit = picked.length === (currentSyllable?.letters.length || 0)

  // Start Screen
  if (screen === 'start') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-lg w-full animate-fade-in">
          <div className="text-5xl mb-3 font-hangul opacity-80">拼</div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Spell It!
          </h1>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
            See the romanization, pick the Korean letters to spell it.
          </p>

          {!koreanVoiceAvailable && (
            <div className="mb-4 p-3 bg-amber-900/30 border border-amber-600/30 rounded-lg text-amber-300 text-xs max-w-sm mx-auto">
              Korean TTS voice not detected. Install Korean language pack in Windows Settings.
            </div>
          )}

          <div className="card text-left p-4 max-w-md mx-auto mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔤</div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">How to Play</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  You'll see a romanized Korean syllable like <span className="text-purple-400 font-mono">gya</span>.
                  Pick the consonant and vowel tiles to build it. Each tile plays its sound.
                  Get it right to hear the full syllable!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-4">
            <button
              onClick={() => setScreen('difficulty-select')}
              className="py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/25"
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
          <p className="text-zinc-400 mb-5 text-sm">Time per syllable to spell</p>
          <div className="space-y-2">
            {Object.entries(difficultySettings).map(([key, settings]) => (
              <button
                key={key}
                onClick={() => startGame('timer', key)}
                className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group"
              >
                <span className="text-sm font-semibold text-white group-hover:text-amber-400">{settings.label}</span>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <div className={`h-1.5 rounded-full ${key === 'easy' ? 'w-full' : key === 'medium' ? 'w-3/4' : key === 'hard' ? 'w-1/2' : 'w-1/4'} bg-amber-500/30`}>
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
          <h2 className="text-2xl font-bold mb-1">Spell Complete!</h2>
          <p className="text-zinc-400 mb-5 text-sm">{mode === 'timer' ? 'Timer Mode' : 'Freeplay'}</p>

          <div className="card p-4 mb-5">
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent mb-1">
              {score} / {maxScore}
            </div>
            <div className="text-zinc-500 text-xs">Total Score</div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-3 text-center">
              <div className="text-lg font-bold text-green-400">{correctCount}</div>
              <div className="text-zinc-500 text-xs">Correct</div>
            </div>
            <div className="card p-3 text-center">
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
          <SpellFeedback
            result={feedbackResult}
            syllable={currentSyllable}
            onNext={handleNext}
            onSpeak={() => speakSyllable(currentSyllable?.display)}
            speaking={false}
          />
        ) : currentSyllable ? (
          <div className="w-full max-w-md animate-slide-up">
            {/* Target romanization */}
            <div className="text-center mb-5">
              <p className="text-zinc-500 text-xs mb-2">Spell this syllable</p>
              <div className="text-4xl font-mono font-bold text-white tracking-wider">
                /{currentSyllable.romanization}/
              </div>
            </div>

            {/* Picked slots */}
            <div className="flex justify-center gap-3 mb-6">
              {currentSyllable.letters.map((_, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-hangul transition-all duration-200 ${
                    picked[i]
                      ? 'border-amber-500 bg-amber-500/10 text-white scale-110 shadow-lg shadow-amber-500/20'
                      : 'border-zinc-700 bg-zinc-900/50 text-zinc-700'
                  }`}
                >
                  {picked[i] || '?'}
                </div>
              ))}
            </div>

            {showTTSWarning && (
              <div className="mb-3 p-2 bg-amber-900/30 border border-amber-600/30 rounded-lg text-amber-300 text-xs text-center">
                Korean voice not available
              </div>
            )}

            {/* Tile grid */}
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap justify-center gap-1.5">
                {SPELL_CONSONANTS.map(c => (
                  <button
                    key={c}
                    onClick={() => pickTile(c)}
                    disabled={showFeedback || picked.length >= currentSyllable.letters.length}
                    className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-lg font-hangul text-zinc-300 hover:bg-zinc-700 hover:border-purple-500/50 hover:text-white active:scale-95 transition-all disabled:opacity-30"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {SPELL_VOWELS.map(v => (
                  <button
                    key={v}
                    onClick={() => pickTile(v)}
                    disabled={showFeedback || picked.length >= currentSyllable.letters.length}
                    className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 text-lg font-hangul text-cyan-300 hover:bg-zinc-700 hover:border-cyan-500/50 hover:text-white active:scale-95 transition-all disabled:opacity-30"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearPicks}
                disabled={picked.length === 0 || showFeedback}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-medium text-sm hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={submitAnswer}
                disabled={!canSubmit || showFeedback}
                className={`flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all ${
                  canSubmit && !showFeedback
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                Submit
              </button>
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

function SpellFeedback({ result, syllable, onNext, onSpeak, speaking }) {
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
              <div className="text-zinc-300 text-xs">
                {result.picked.join(' + ')} = {result.syllable}
              </div>
            </>
          ) : result.timedOut ? (
            <>
              <div className="text-yellow-400 text-sm font-bold mb-1">Time's Up!</div>
              <div className="text-zinc-300 text-xs">
                Answer: <span className="font-hangul text-green-400">{syllable?.letters.join(' + ')}</span> = {result.syllable}
              </div>
            </>
          ) : (
            <>
              <div className="text-red-400 text-sm font-bold mb-1">Not Quite</div>
              <div className="text-zinc-300 text-xs">
                You picked: <span className="font-hangul text-red-400">{result.picked.join(' + ')}</span>
              </div>
              <div className="text-zinc-300 text-xs mt-1">
                Correct: <span className="font-hangul text-green-400">{syllable?.letters.join(' + ')}</span> = {result.syllable}
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
            className="flex-1 py-2 px-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            {speaking ? 'Playing...' : '🔊 Hear Syllable'}
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
