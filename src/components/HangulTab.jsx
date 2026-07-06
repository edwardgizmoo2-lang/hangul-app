import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { consonants, doubleConsonants, vowels, compoundVowels, syllables } from '../data/hangul'
import { isElectron } from '../utils/platform'

const ALL_CONSONANTS = [...consonants, ...doubleConsonants]
const ALL_VOWELS = [...vowels, ...compoundVowels]

const VOWEL_ORDER = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

const GYEP_BATCHIM = new Set(['ㄳ','ㄵ','ㄶ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅄ'])

const FILTER_OPTIONS = [
  { key: 'open', label: 'Open', desc: '2-letter', color: 'purple' },
  { key: 'batchim', label: 'Batchim', desc: 'single final', color: 'cyan' },
  { key: 'gyep', label: 'Gyep-Batchim', desc: 'double final', color: 'amber' },
  { key: 'all', label: 'All', desc: 'all syllables', color: 'emerald' },
]

const FILTER_COLORS = {
  purple: { text: 'text-purple-400', bg: 'bg-purple-600/20', border: 'border-purple-500' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-600/20', border: 'border-cyan-500' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-600/20', border: 'border-amber-500' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600/20', border: 'border-emerald-500' },
}

export default function HangulTab() {
  const [subTab, setSubTab] = useState('letters')
  const [playing, setPlaying] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('open')
  const [filterOpen, setFilterOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const searchRef = useRef(null)
  const filterRef = useRef(null)
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
      if (filterMode === 'open' && syl.letters.length > 2) return
      if (filterMode === 'batchim' && (syl.letters.length <= 2 || GYEP_BATCHIM.has(syl.letters[2]))) return
      if (filterMode === 'gyep' && (syl.letters.length <= 2 || !GYEP_BATCHIM.has(syl.letters[2]))) return
      const vowel = syl.letters[1]
      if (groups[vowel]) groups[vowel].push(syl)
    })
    return groups
  }, [filterMode])

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

  useEffect(() => {
    if (!filterOpen) return
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

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
        <div className="px-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative w-full sm:flex-1">
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
              <span className="text-zinc-400 text-[10px] font-medium shrink-0">Filter By:</span>
              <div className="relative shrink-0" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen(prev => !prev)}
                  className="flex items-center justify-between gap-1.5 w-32 py-2.5 px-3 rounded-lg text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-200 hover:border-zinc-500 transition-all"
                >
                  <span>{FILTER_OPTIONS.find(o => o.key === filterMode)?.label}</span>
                  <svg className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {filterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl shadow-black/40 z-10 overflow-hidden animate-fade-in">
                    {FILTER_OPTIONS.map(opt => {
                      const c = FILTER_COLORS[opt.color]
                      const isActive = filterMode === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => { setFilterMode(opt.key); setFilterOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                            isActive ? `${c.bg} ${c.text}` : 'text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <span className="font-bold">{opt.label}</span>
                          <span className="text-zinc-500 ml-1.5">— {opt.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium shrink-0 min-w-[5.5rem] ${FILTER_COLORS[FILTER_OPTIONS.find(o => o.key === filterMode).color].text}`}>
                {Object.values(syllablesByVowel).reduce((s, a) => s + a.length, 0).toLocaleString()} syllables
              </span>
            </div>
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
    <div className="animate-fade-in">
      <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {letters.map((letter, idx) => (
          <button
            key={letter.char}
            onClick={() => playLetterAudio(letter.audioFile)}
            disabled={playing === letter.audioFile}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 animate-scale-in ${
              playing === letter.audioFile
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-md hover:shadow-purple-500/10'
            }`}
            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
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

const ROW_SIZE = 7

function SyllablesView({ syllablesByVowel, speakSyllable, virtuosoRef, onScrollChange }) {
  const [playingKey, setPlayingKey] = useState(null)
  const vowelColors = useRef(new Map())
  const lastColorIdx = useRef(-1)
  const colorKeys = ['purple', 'cyan', 'amber', 'emerald']

  const getColorForVowel = useCallback((vowel) => {
    if (vowelColors.current.has(vowel)) return vowelColors.current.get(vowel)
    let idx
    do {
      idx = Math.floor(Math.random() * colorKeys.length)
    } while (idx === lastColorIdx.current)
    lastColorIdx.current = idx
    const key = colorKeys[idx]
    vowelColors.current.set(vowel, key)
    return key
  }, [])

  const handlePlay = useCallback(async (syl, key) => {
    setPlayingKey(key)
    await speakSyllable(syl)
    setPlayingKey(null)
  }, [speakSyllable])

  const { groups, rowItems } = useMemo(() => {
    const groups = []
    const rowItems = []
    VOWEL_ORDER.forEach(vowel => {
      const syls = syllablesByVowel[vowel]
      if (!syls || syls.length === 0) return
      const vowelRoman = syls[0]?.romanization.slice(-1) || vowel
      const count = syls.length
      const rowCount = Math.ceil(count / ROW_SIZE)
      groups.push({ vowel, roman: vowelRoman, count, rowCount })
      for (let i = 0; i < count; i += ROW_SIZE) {
        rowItems.push({ vowel, syllables: syls.slice(i, i + ROW_SIZE) })
      }
    })
    return { groups, rowItems }
  }, [syllablesByVowel])

  const groupCounts = useMemo(() => groups.map(g => g.rowCount), [groups])
  const totalRows = rowItems.length

  if (totalRows === 0) {
    return <p className="text-zinc-500 text-xs text-center py-4">No syllables match the selected filters</p>
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      totalCount={totalRows}
      groupCounts={groupCounts}
      overscan={100}
      onScroll={(e) => {
        onScrollChange(e.target.scrollTop > 300)
      }}
      groupContent={(groupIndex) => {
        const g = groups[groupIndex]
        const colorKey = getColorForVowel(g.vowel)
        const c = FILTER_COLORS[colorKey]
        return (
          <div className="sticky top-0 z-10 bg-zinc-950 pb-3 pt-2 animate-fade-in">
            <h3 className={`text-lg font-bold uppercase tracking-wider ${c.text}`}>
              <span className="text-2xl">{g.vowel}</span> <span className={`font-bold normal-case ${c.text}`}>— {g.roman} combinations ({g.count})</span>
            </h3>
          </div>
        )
      }}
      itemContent={(index) => {
        const item = rowItems[index]
        return (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 mb-2 animate-fade-in">
            {item.syllables.map((syl, idx) => {
              const key = `${item.vowel}-${syl.display}`
              return (
                <button
                  key={key}
                  onClick={() => handlePlay(syl, key)}
                  disabled={playingKey === key}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-200 animate-scale-in ${
                    playingKey === key
                      ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-md hover:shadow-cyan-500/10'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="text-3xl font-bold">{syl.display}</span>
                  <span className="text-zinc-400 text-[10px] mt-0.5">{syl.romanization}</span>
                </button>
              )
            })}
          </div>
        )
      }}
    />
  )
}
