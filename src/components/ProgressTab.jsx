import { useState, useMemo } from 'react'
import { consonants, doubleConsonants, vowels } from '../data/hangul'
import { resetProgress } from '../utils/storage'

const ALL_LETTERS = [
  ...consonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...doubleConsonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...vowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
]

function getMasteryLabel(level) {
  switch (level) {
    case 5: return 'Mastered'
    case 4: return 'Strong'
    case 3: return 'Learning'
    case 2: return 'Struggling'
    case 1: return 'New'
    default: return 'Unattempted'
  }
}

function getMasteryColor(level) {
  switch (level) {
    case 5: return 'from-emerald-500 to-green-400'
    case 4: return 'from-emerald-400 to-green-300'
    case 3: return 'from-yellow-500 to-amber-400'
    case 2: return 'from-orange-500 to-amber-400'
    case 1: return 'from-red-500 to-red-400'
    default: return 'from-zinc-700 to-zinc-600'
  }
}

function getCardBorderColor(level) {
  switch (level) {
    case 5: return 'border-emerald-500/40'
    case 4: return 'border-emerald-400/30'
    case 3: return 'border-yellow-500/30'
    case 2: return 'border-orange-500/30'
    case 1: return 'border-red-500/30'
    default: return 'border-zinc-800'
  }
}

export default function ProgressTab({ stats, letterMastery, onRefresh }) {
  const [viewMode, setViewMode] = useState('grid')
  const [confirmReset, setConfirmReset] = useState(false)

  const handleReset = async () => {
    await resetProgress()
    setConfirmReset(false)
    onRefresh()
  }

  // Compute extended mastery data from game history
  const letterProgress = useMemo(() => {
    const masteryMap = letterMastery || {}
    const gameHistory = stats?.gameSessions || []

    // Build per-letter stats from history
    const perLetterStats = {}
    ALL_LETTERS.forEach(l => {
      const key = l.character || l.char
      perLetterStats[key] = { correct: 0, total: 0, consecutiveCorrect: 0, bestStreak: 0 }
    })

    let currentStreak = {}
    gameHistory.forEach(session => {
      (session.letterResults || []).forEach(result => {
        const key = result.letter
        if (!perLetterStats[key]) return
        perLetterStats[key].total++
        if (result.typeCorrect && result.soundCorrect) {
          perLetterStats[key].correct++
          currentStreak[key] = (currentStreak[key] || 0) + 1
          perLetterStats[key].consecutiveCorrect = currentStreak[key]
          perLetterStats[key].bestStreak = Math.max(perLetterStats[key].bestStreak, currentStreak[key])
        } else {
          currentStreak[key] = 0
        }
      })
    })

    // Merge with stored mastery level (0-5) and compute display levels
    return ALL_LETTERS.map(letter => {
      const key = letter.character || letter.char
      const storedLevel = masteryMap[key] || 0
      const computed = perLetterStats[key] || { correct: 0, total: 0, consecutiveCorrect: 0, bestStreak: 0 }

      // Use stored cumulative level as canonical mastery
      const level = storedLevel

      return {
        ...letter,
        key,
        level,
        stats: computed,
      }
    })
  }, [letterMastery, stats])

  const masteredCount = letterProgress.filter(l => l.level >= 4).length
  const learningCount = letterProgress.filter(l => l.level >= 1 && l.level < 4).length
  const unattemptedCount = letterProgress.filter(l => l.level === 0).length

  const streak = stats?.streak?.current || 0
  const longestStreak = stats?.streak?.longest || 0
  const totalScore = stats?.totalScore || 0
  const totalGames = stats?.totalGamesCompleted || 0
  const avgScore = totalGames > 0 ? (totalScore / totalGames).toFixed(1) : '0'

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Progress
            </h1>
            <p className="text-zinc-500 text-xs">Track your Hangul mastery journey</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-zinc-200 transition-colors text-xs font-medium"
            >
              Refresh
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 bg-zinc-800 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors text-xs font-medium"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            title="Total Score"
            value={totalScore}
            icon={<ScoreIcon />}
            color="purple"
            index={0}
          />
          <StatCard
            title="Games"
            value={totalGames}
            icon={<GamesIcon />}
            color="cyan"
            index={1}
          />
          <StatCard
            title="Streak"
            value={`${streak}d`}
            icon={<StreakIcon />}
            color="emerald"
            subtitle={streak > 0 ? `Best: ${longestStreak}d` : 'Start today!'}
            index={2}
          />
          <StatCard
            title="Avg Score"
            value={avgScore}
            icon={<AvgIcon />}
            color="amber"
            index={3}
          />
        </div>

        {/* Mastery Summary */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard
            title="Mastered"
            value={masteredCount}
            total={ALL_LETTERS.length}
            color="emerald"
            index={0}
          />
          <SummaryCard
            title="In Progress"
            value={learningCount}
            total={ALL_LETTERS.length}
            color="amber"
            index={1}
          />
          <SummaryCard
            title="Unattempted"
            value={unattemptedCount}
            total={ALL_LETTERS.length}
            color="zinc"
            index={2}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            List
          </button>
        </div>

        {/* Letter Mastery Grid/List */}
        <div className="card p-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
          {viewMode === 'grid' ? (
            <LetterGrid letters={letterProgress} />
          ) : (
            <LetterList letters={letterProgress} />
          )}
        </div>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-white font-bold text-base mb-1">Reset All Progress?</h3>
              <p className="text-zinc-400 text-xs">This will permanently delete all your scores, streaks, and letter mastery data. This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle, index = 0 }) {
  const colorMap = {
    purple: 'border-purple-500/30 bg-purple-500/10',
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
  }

  return (
    <div className={`card border p-3 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 ${colorMap[color] || colorMap.purple} animate-scale-in`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-medium text-zinc-400">{title}</p>
        <span className="w-5 h-5 flex items-center justify-center rounded bg-black/20">
          {icon}
        </span>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
    </div>
  )
}

function SummaryCard({ title, value, total, color, index = 0 }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    zinc: { bg: 'bg-zinc-700/30', text: 'text-zinc-400', border: 'border-zinc-700' },
  }

  const c = colorMap[color] || colorMap.zinc
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className={`card border p-3 ${c.border} text-center transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 animate-scale-in`} style={{ animationDelay: `${(index + 4) * 80}ms` }}>
      <p className={`text-xl font-bold ${c.text}`}>{value}</p>
      <p className="text-zinc-500 text-[10px]">{title}</p>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${c.bg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function LetterGrid({ letters }) {
  const grouped = useMemo(() => {
    const basicConsonants = letters.filter(l =>
      consonants.some(c => (c.character || c.char) === (l.character || l.char))
    )
    const doubleCons = letters.filter(l =>
      doubleConsonants.some(c => (c.character || c.char) === (l.character || l.char))
    )
    const vowelList = letters.filter(l =>
      vowels.some(v => (v.character || v.char) === (l.character || l.char))
    )
    return [
      ['Consonants', basicConsonants],
      ['Double Consonants', doubleCons],
      ['Vowels', vowelList],
    ].filter(([, arr]) => arr.length > 0)
  }, [letters])

  return (
    <div className="space-y-4">
      {grouped.map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            {category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {items.map(letter => (
              <MasteryCard key={letter.key} letter={letter} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LetterList({ letters }) {
  const grouped = useMemo(() => {
    const basicConsonants = letters.filter(l =>
      consonants.some(c => (c.character || c.char) === (l.character || l.char))
    )
    const doubleCons = letters.filter(l =>
      doubleConsonants.some(c => (c.character || c.char) === (l.character || l.char))
    )
    const vowelList = letters.filter(l =>
      vowels.some(v => (v.character || v.char) === (l.character || l.char))
    )
    return [
      ['Consonants', basicConsonants],
      ['Double Consonants', doubleCons],
      ['Vowels', vowelList],
    ].filter(([, arr]) => arr.length > 0)
  }, [letters])

  return (
    <div className="space-y-6">
      {grouped.map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-zinc-400 mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            {category}
          </h3>
          <div className="space-y-2">
            {items.map(letter => (
              <MasteryRow key={letter.key} letter={letter} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MasteryCard({ letter }) {
  const level = letter.level
  const borderColor = getCardBorderColor(level)
  const gradient = getMasteryColor(level)
  const label = getMasteryLabel(level)

  return (
    <div className={`bg-zinc-900/80 border ${borderColor} rounded-lg p-4 hover:scale-105 transition-all duration-200 group`}>
      <div className="text-center mb-2">
        <span className="text-4xl font-hangul font-light block leading-tight">{letter.character || letter.char}</span>
        <span className="text-[11px] text-zinc-500">{letter.romanization}</span>
      </div>
      <div className="flex gap-1 justify-center mb-1.5">
        {[1, 2, 3, 4, 5].map(segment => (
          <div
            key={segment}
            className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
              level >= segment
                ? `bg-gradient-to-r ${gradient}`
                : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
      <div className="text-center">
        <span className="text-[10px] text-zinc-600 leading-none">{label}</span>
      </div>
      {letter.stats && letter.stats.total > 0 && (
        <div className="text-center">
          <span className="text-[10px] text-zinc-600 font-mono">
            {letter.stats.correct}/{letter.stats.total}
          </span>
        </div>
      )}
      {letter.stats?.bestStreak > 1 && (
        <div className="text-center">
          <span className="text-[10px] text-emerald-400">🔥 {letter.stats.bestStreak}x</span>
        </div>
      )}
    </div>
  )
}

function MasteryRow({ letter }) {
  const level = letter.level
  const gradient = getMasteryColor(level)
  const label = getMasteryLabel(level)

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 hover:border-purple-500/30 transition-colors flex items-center gap-3">
      <span className="text-lg font-hangul font-light w-8 text-center">{letter.character || letter.char}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-zinc-300">{letter.romanization}</span>
          <span className="text-[10px] text-zinc-500">{label}</span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(segment => (
            <div
              key={segment}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                level >= segment
                  ? `bg-gradient-to-r ${gradient}`
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>
      {letter.stats && letter.stats.total > 0 && (
        <div className="text-right text-[10px] text-zinc-500 whitespace-nowrap">
          <div className="font-mono">{letter.stats.correct}/{letter.stats.total}</div>
          {letter.stats.bestStreak > 1 && (
            <div className="text-emerald-400 text-[9px]">🔥 {letter.stats.bestStreak}x</div>
          )}
        </div>
      )}
    </div>
  )
}

// SVG Icons
function ScoreIcon() {
  return (
    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function GamesIcon() {
  return (
    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function StreakIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  )
}

function AvgIcon() {
  return (
    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}