import { useState, useCallback, useMemo } from 'react'
import { consonants, doubleConsonants, vowels, compoundVowels, syllables } from '../data/hangul'

const ALL_CONSONANTS = [...consonants, ...doubleConsonants]
const ALL_VOWELS = [...vowels, ...compoundVowels]

const VOWEL_ORDER = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

export default function HangulTab() {
  const [subTab, setSubTab] = useState('letters')
  const [playing, setPlaying] = useState(null)
  const [filter, setFilter] = useState('')

  const syllablesByVowel = useMemo(() => {
    const groups = {}
    VOWEL_ORDER.forEach(v => { groups[v] = [] })
    syllables.forEach(syl => {
      const vowel = syl.letters[1]
      if (groups[vowel]) groups[vowel].push(syl)
    })
    return groups
  }, [])

  const filteredByVowel = useMemo(() => {
    if (!filter.trim()) return syllablesByVowel
    const q = filter.toLowerCase()
    const filtered = {}
    VOWEL_ORDER.forEach(v => {
      filtered[v] = syllablesByVowel[v].filter(s =>
        s.romanization.toLowerCase().includes(q) ||
        s.display.includes(q)
      )
    })
    return filtered
  }, [filter, syllablesByVowel])

  const playLetterAudio = useCallback(async (audioFile) => {
    setPlaying(audioFile)
    return new Promise((resolve) => {
      const audio = new Audio(`/audio/${audioFile}`)
      audio.onended = () => { setPlaying(null); resolve() }
      audio.onerror = () => { setPlaying(null); resolve() }
      audio.play().catch(() => { setPlaying(null); resolve() })
    })
  }, [])

  const speakSyllable = useCallback(async (text) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ko-KR'
      u.rate = 0.85
      u.onend = () => resolve()
      u.onerror = () => resolve()
      speechSynthesis.speak(u)
    })
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <button
          onClick={() => setSubTab('letters')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'letters'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Letters
        </button>
        <button
          onClick={() => setSubTab('syllables')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'syllables'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Syllables
        </button>
      </div>

      {subTab === 'syllables' && (
        <div className="px-4 pb-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by romanization (e.g. ga, myo, hae)..."
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {subTab === 'letters' ? (
          <LettersView allConsonants={ALL_CONSONANTS} allVowels={ALL_VOWELS} playLetterAudio={playLetterAudio} playing={playing} />
        ) : (
          <SyllablesView syllablesByVowel={filteredByVowel} speakSyllable={speakSyllable} filter={filter} />
        )}
      </div>
    </div>
  )
}

function LettersView({ allConsonants, allVowels, playLetterAudio, playing }) {
  return (
    <div className="space-y-6 pt-2">
      <Section title="Consonants" letters={allConsonants} playLetterAudio={playLetterAudio} playing={playing} />
      <Section title="Vowels" letters={allVowels} playLetterAudio={playLetterAudio} playing={playing} />
    </div>
  )
}

function Section({ title, letters, playLetterAudio, playing }) {
  return (
    <div>
      <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {letters.map((letter) => (
          <button
            key={letter.char}
            onClick={() => playLetterAudio(letter.audioFile)}
            disabled={playing === letter.audioFile}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 ${
              playing === letter.audioFile
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            <span className="text-3xl font-bold mb-1">{letter.char}</span>
            <span className="text-zinc-300 text-sm font-medium">{letter.romanization}</span>
            <span className="text-zinc-500 text-[10px] mt-0.5">{letter.name} / {letter.audio}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SyllablesView({ syllablesByVowel, speakSyllable, filter }) {
  const [playingKey, setPlayingKey] = useState(null)

  const handlePlay = useCallback(async (syl, key) => {
    setPlayingKey(key)
    await speakSyllable(syl.display)
    setPlayingKey(null)
  }, [speakSyllable])

  const totalFiltered = Object.values(syllablesByVowel).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="pt-2 space-y-6">
      {filter && (
        <p className="text-zinc-500 text-xs">{totalFiltered} syllables matching "{filter}"</p>
      )}
      {VOWEL_ORDER.map(vowel => {
        const syls = syllablesByVowel[vowel]
        if (!syls || syls.length === 0) return null
        const vowelRoman = syls[0]?.romanization.slice(-1) || vowel
        return (
          <div key={vowel}>
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
              {vowel} <span className="text-zinc-600">— {vowelRoman} combinations</span>
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {syls.map((syl, idx) => {
                const key = `${vowel}-${idx}`
                return (
                  <button
                    key={key}
                    onClick={() => handlePlay(syl, key)}
                    disabled={playingKey === key}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                      playingKey === key
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-2xl font-bold">{syl.display}</span>
                    <span className="text-zinc-400 text-[10px] mt-0.5">{syl.romanization}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
