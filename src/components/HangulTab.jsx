import { useState, useCallback, useMemo, useRef } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { consonants, doubleConsonants, vowels, compoundVowels, syllables } from '../data/hangul'
import { isElectron } from '../utils/platform'

const ALL_CONSONANTS = [...consonants, ...doubleConsonants]
const ALL_VOWELS = [...vowels, ...compoundVowels]

const VOWEL_ORDER = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

export default function HangulTab() {
  const [subTab, setSubTab] = useState('letters')
  const [playing, setPlaying] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBatchim, setShowBatchim] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const searchRef = useRef(null)
  const letterScrollRef = useRef(null)
  const virtuosoRef = useRef(null)

  const switchSubTab = useCallback((tab) => {
    setSubTab(tab)
    setShowScrollTop(false)
  }, [])

  const syllablesByVowel = useMemo(() => {
    const groups = {}
    VOWEL_ORDER.forEach(v => { groups[v] = [] })
    syllables.forEach(syl => {
      if (!showBatchim && syl.letters.length > 2) return
      const vowel = syl.letters[1]
      if (groups[vowel]) groups[vowel].push(syl)
    })
    return groups
  }, [showBatchim])

  const filteredByVowel = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return syllablesByVowel
    const filtered = {}
    VOWEL_ORDER.forEach(v => {
      filtered[v] = syllablesByVowel[v].filter(s => {
        return (
          s.display === q ||
          s.display.toLowerCase() === q ||
          s.romanization.toLowerCase().includes(q) ||
          s.letters.some(l => l === q || l.toLowerCase() === q) ||
          (s.letters.length === 3 && s.letters[2] && s.letters[2].toLowerCase().includes(q))
        )
      })
    })
    return filtered
  }, [searchQuery, syllablesByVowel])

  const playLetterAudio = useCallback(async (audioFile) => {
    setPlaying(audioFile)
    return new Promise((resolve) => {
      const audio = new Audio(`audio/${audioFile}`)
      audio.onended = () => { setPlaying(null); resolve() }
      audio.onerror = () => { setPlaying(null); resolve() }
      audio.play().catch(() => { setPlaying(null); resolve() })
    })
  }, [])

  const speakSyllable = useCallback(async (syl) => {
    if (!syl?.audioFile) return
    return new Promise((resolve) => {
      const audio = new Audio(`audio/${syl.audioFile}`)
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <button
          onClick={() => switchSubTab('letters')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            subTab === 'letters'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Letters
        </button>
        <button
          onClick={() => switchSubTab('syllables')}
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
        <div className="px-4 pb-2 space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllable or romanization..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatchim(!showBatchim)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                showBatchim
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {showBatchim ? 'Batchim ON' : 'Batchim OFF'}
            </button>
            <span className="text-zinc-600 text-[10px]">3-letter syllables</span>
          </div>
        </div>
      )}

      {subTab === 'letters' ? (
        <div
          ref={letterScrollRef}
          className="flex-1 overflow-y-auto px-4 pb-4"
          onScroll={(e) => setShowScrollTop(e.target.scrollTop > 300)}
        >
          <LettersView allConsonants={ALL_CONSONANTS} allVowels={ALL_VOWELS} playLetterAudio={playLetterAudio} playing={playing} />
        </div>
      ) : (
        <div className="flex-1 px-4 pb-4">
          <SyllablesView
            syllablesByVowel={filteredByVowel}
            speakSyllable={speakSyllable}
            virtuosoRef={virtuosoRef}
            onScrollChange={setShowScrollTop}
          />
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => {
            if (subTab === 'letters') {
              letterScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' })
            }
          }}
          className={`fixed z-50 w-11 h-11 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all duration-200 hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95 animate-fade-in ${
            isElectron() ? 'bottom-6 right-6' : 'bottom-6 left-1/2 -translate-x-1/2'
          }`}
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
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
    <div className="animate-slide-up">
      <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {letters.map((letter) => (
          <button
            key={letter.char}
            onClick={() => playLetterAudio(letter.audioFile)}
            disabled={playing === letter.audioFile}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
              playing === letter.audioFile
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-md hover:shadow-purple-500/10'
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

function SyllablesView({ syllablesByVowel, speakSyllable, virtuosoRef, onScrollChange }) {
  const [playingKey, setPlayingKey] = useState(null)

  const handlePlay = useCallback(async (syl, key) => {
    setPlayingKey(key)
    await speakSyllable(syl)
    setPlayingKey(null)
  }, [speakSyllable])

  const sections = useMemo(() => {
    const result = []
    VOWEL_ORDER.forEach(vowel => {
      const syls = syllablesByVowel[vowel]
      if (!syls || syls.length === 0) return
      const vowelRoman = syls[0]?.romanization.slice(-1) || vowel
      result.push({ vowel, roman: vowelRoman, count: syls.length, syllables: syls })
    })
    return result
  }, [syllablesByVowel])

  const totalSyllables = sections.reduce((sum, s) => sum + s.count, 0)

  if (totalSyllables === 0) {
    return <p className="text-zinc-500 text-xs text-center py-4">No syllables match the selected filters</p>
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      totalCount={sections.length}
      overscan={300}
      onScroll={(e) => {
        onScrollChange(e.target.scrollTop > 300)
      }}
      itemContent={(index) => {
        const section = sections[index]
        return (
          <div className="mb-5">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3 pt-2">
              {section.vowel} <span className="text-zinc-600">— {section.roman} combinations ({section.count})</span>
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {section.syllables.map((syl, idx) => {
                const key = `${section.vowel}-${idx}`
                return (
                  <button
                    key={key}
                    onClick={() => handlePlay(syl, key)}
                    disabled={playingKey === key}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-200 ${
                      playingKey === key
                        ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-md hover:shadow-cyan-500/10'
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
      }}
    />
  )
}
