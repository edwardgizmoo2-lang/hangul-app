import { useState, useMemo, useCallback } from 'react'
import { consonants, doubleConsonants, vowels, compoundVowels } from '../data/hangul'
import { resetProgress, RANKS } from '../utils/storage'
import { isElectron } from '../utils/platform'
import ACHIEVEMENTS from '../data/achievements'
import { pickDailyChallenges } from '../data/challenges'
import TrendGraph from './TrendGraph'

const ALL_LETTERS = [
  ...consonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...doubleConsonants.map(c => ({ ...c, type: 'consonant', character: c.character || c.char })),
  ...vowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
  ...compoundVowels.map(v => ({ ...v, type: 'vowel', character: v.character || v.char })),
]

const TABS = ['Overview', 'Activity', 'Achievements']

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

function AchievementSection({ unlockedIds }) {
  const unlocked = useMemo(() => new Set(unlockedIds || []), [unlockedIds])
  const [showAll, setShowAll] = useState(false)
  const earned = ACHIEVEMENTS.filter(a => unlocked.has(a.id))
  const locked = ACHIEVEMENTS.filter(a => !unlocked.has(a.id))
  const displayed = showAll ? [...earned, ...locked] : earned

  if (earned.length === 0) {
    return (
      <div className="card p-3 animate-scale-in">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Achievements</h3>
        <p className="text-[11px] text-zinc-600">Complete games to unlock achievements</p>
      </div>
    )
  }

  return (
    <div className="card p-3 animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Achievements
          <span className="ml-1.5 text-[10px] text-zinc-500 font-normal normal-case">({earned.length}/{ACHIEVEMENTS.length})</span>
        </h3>
        <button onClick={() => setShowAll(!showAll)} className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
          {showAll ? 'Hide locked' : 'Show all'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {displayed.map(a => {
          const isUnlocked = unlocked.has(a.id)
          return (
            <div key={a.id} className={`p-2 rounded-lg border transition-all ${isUnlocked ? 'bg-purple-500/10 border-purple-500/30' : 'bg-zinc-800/30 border-zinc-800 opacity-50'}`}>
              <div className="text-lg text-center mb-0.5">{a.icon}</div>
              <p className={`text-[10px] font-bold text-center leading-tight ${isUnlocked ? 'text-zinc-200' : 'text-zinc-600'}`}>{a.title}</p>
              <p className="text-[8px] text-zinc-600 text-center mt-0.5 leading-tight">{a.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChallengeSection({ challengeProgress, challengeDay }) {
  const today = new Date().toISOString().split('T')[0]
  const daily = pickDailyChallenges(today)
  const stored = challengeDay === today && challengeProgress ? challengeProgress : {}
  const hasStored = Object.keys(stored).length > 0
  const completedCount = hasStored ? Object.values(stored).filter(c => c.completed).length : 0

  return (
    <div className="card p-3 animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Daily Challenges
          <span className="ml-1.5 text-[10px] text-zinc-500 font-normal normal-case">({completedCount}/{daily.length})</span>
        </h3>
      </div>
      <div className="space-y-1.5">
        {daily.map(c => {
          const cp = hasStored ? stored[c.id] : null
          const progress = cp ? cp.progress : 0
          const target = cp ? cp.target : c.target
          const completed = cp ? cp.completed : false
          const pct = Math.min((progress / target) * 100, 100)
          return (
            <div key={c.id} className={`p-2 rounded-lg border transition-all ${completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-800/30 border-zinc-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{c.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-bold truncate ${completed ? 'text-emerald-300' : 'text-zinc-300'}`}>{c.title}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{c.description}</p>
                  </div>
                </div>
                {completed && (
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-cyan-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-zinc-600 mt-0.5 text-right">{progress}/{target}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StreakCalendar({ sessions }) {
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const hasSession = sessions.some(s => s.date === dateStr)
    const isToday = dateStr === today.toISOString().split('T')[0]
    days.push({ date: dateStr, label: d.toLocaleDateString('en', { weekday: 'short' }), hasSession, isToday })
  }

  return (
    <div className="card p-3 animate-scale-in">
      <h3 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Activity (7 days)</h3>
      <div className="flex gap-2 justify-between">
        {days.map(day => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">{day.label}</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${day.isToday ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950' : ''} ${day.hasSession ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-zinc-800/50 border border-zinc-800'}`}>
              {day.hasSession ? (
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-zinc-700">•</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DailyGoal({ todayScore, dailyGoal }) {
  const progress = Math.min((todayScore / dailyGoal) * 100, 100)
  return (
    <div className="card p-3 animate-scale-in">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Goal</h3>
        <span className="text-xs text-zinc-500">{todayScore}/{dailyGoal}</span>
      </div>
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-purple-500 to-cyan-400'}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">{progress >= 100 ? 'Daily goal reached!' : `${Math.round(progress)}% of daily goal`}</p>
    </div>
  )
}

function HistoryBrowser({ sessions, onShowAll }) {
  if (sessions.length === 0) return null
  const maxVisible = 2
  const reversed = [...sessions].reverse()
  const needsScroll = sessions.length > maxVisible
  const itemHeight = 44

  return (
    <>
      <div className="card p-3 animate-scale-in cursor-pointer" onClick={onShowAll}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Games</h3>
          {sessions.length > maxVisible && (
            <span className="text-[10px] text-purple-400">View all ({sessions.length})</span>
          )}
        </div>
        <div className="space-y-1 overflow-y-auto" style={needsScroll ? { maxHeight: `${maxVisible * itemHeight}px` } : undefined}>
          {reversed.slice(0, maxVisible).map(session => {
            const accuracy = session.totalPossible > 0 ? Math.round((session.score / session.totalPossible) * 100) : 0
            const gameTypeLabel = session.gameType ? session.gameType.charAt(0).toUpperCase() + session.gameType.slice(1) : 'Game'
            return (
              <div key={session.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors gap-1">
                <div className="flex items-center gap-1.5 min-w-0 shrink">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${session.gameType === 'letter' ? 'bg-purple-500/20 text-purple-300' : session.gameType === 'spell' ? 'bg-cyan-500/20 text-cyan-300' : session.gameType === 'listen' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700 text-zinc-300'}`}>{gameTypeLabel}</span>
                  <span className="text-[11px] text-zinc-400 truncate">{session.date}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-zinc-300 whitespace-nowrap">{session.score}/{session.totalPossible}</span>
                  <span className={`text-[10px] font-bold whitespace-nowrap ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{accuracy}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default function ProgressTab({ stats, letterMastery, onRefresh }) {
  const [progressTab, setProgressTab] = useState('Overview')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('progressViewMode') || 'grid')
  const [confirmReset, setConfirmReset] = useState(false)
  const [rankModalOpen, setRankModalOpen] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const handleViewMode = (mode) => {
    setViewMode(mode)
    localStorage.setItem('progressViewMode', mode)
  }

  const handleReset = async () => {
    await resetProgress()
    setConfirmReset(false)
    onRefresh()
  }

  // Compute extended mastery data from game history
  const letterProgress = useMemo(() => {
    const masteryMap = letterMastery || {}
    const rawMap = stats?.rawLetterStats || {}
    const gameHistory = stats?.gameSessions || []

    const perLetterStats = {}
    ALL_LETTERS.forEach(l => {
      const key = l.character || l.char
      perLetterStats[key] = { correct: 0, total: 0, consecutiveCorrect: 0, bestStreak: 0, trend: '→', perMode: {} }
    })

    let currentStreak = {}
    gameHistory.forEach((session, si) => {
      const mode = session.gameType || 'unknown'
      ;(session.letterResults || []).forEach(result => {
        const key = result.letter
        if (!perLetterStats[key]) return
        perLetterStats[key].total++
        if (!perLetterStats[key].perMode[mode]) {
          perLetterStats[key].perMode[mode] = { correct: 0, total: 0 }
        }
        perLetterStats[key].perMode[mode].total++
        if (result.typeCorrect && result.soundCorrect) {
          perLetterStats[key].correct++
          perLetterStats[key].perMode[mode].correct++
          currentStreak[key] = (currentStreak[key] || 0) + 1
          perLetterStats[key].consecutiveCorrect = currentStreak[key]
          perLetterStats[key].bestStreak = Math.max(perLetterStats[key].bestStreak, currentStreak[key])
        } else {
          currentStreak[key] = 0
        }
        if (si === gameHistory.length - 1) {
          perLetterStats[key].trend = (result.typeCorrect && result.soundCorrect) ? '↑' : '↓'
        }
        if (si === gameHistory.length - 2 && perLetterStats[key].trend === '→') {
          perLetterStats[key].trend = (result.typeCorrect && result.soundCorrect) ? '↑' : '↓'
        }
      })
    })

    return ALL_LETTERS.map(letter => {
      const key = letter.character || letter.char
      const storedLevel = masteryMap[key] || 0
      const rawLevel = rawMap[key] || 0
      const decayed = rawLevel > storedLevel
      const computed = perLetterStats[key] || { correct: 0, total: 0, consecutiveCorrect: 0, bestStreak: 0, trend: '→' }
      return { ...letter, key, level: storedLevel, rawLevel, decayed, stats: computed }
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
  const personalBests = stats?.personalBests || {}
  const lastPlayDate = stats?.streak?.lastPlayDate
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const streakAtRisk = streak > 0 && lastPlayDate === yesterday
  const streakMilestones = [7, 14, 30, 60, 100]
  const nextMilestone = streakMilestones.find(m => m > streak)
  const milestoneProgress = nextMilestone ? Math.min((streak / nextMilestone) * 100, 100) : 100

  const handleRankClick = useCallback(() => {
    setRankModalOpen(o => !o)
  }, [])

  const handleShowAllHistory = useCallback(() => setShowHistoryModal(true), [])

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
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 bg-zinc-800 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-all text-sm font-medium hover:scale-105 active:scale-95 animate-fade-in"
          >
            Reset Progress
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setProgressTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-center ${
                progressTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {progressTab === 'Overview' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <StatCard title="Total Score" value={totalScore} icon={<ScoreIcon />} color="purple" index={0} onClick={handleRankClick} />
              <StatCard title="Games" value={totalGames} icon={<GamesIcon />} color="cyan" index={1} />
              <StatCard title="Streak" value={`${streak}d`} icon={<StreakIcon />} color="emerald" subtitle={streak > 0 ? `Best: ${longestStreak}d` : 'Start today!'} index={2} />
              <StatCard title="Avg Score" value={avgScore} icon={<AvgIcon />} color="amber" index={3} />
            </div>
            {rankModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={handleRankClick}>
                <div className="bg-zinc-900/95 border border-purple-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🏆</div>
                    <h3 className="text-white font-bold text-lg mb-1">Rankings</h3>
                    <p className="text-zinc-400 text-xs">Your current rank and progress toward the next tier</p>
                  </div>
                  {RANKS.map((r, i) => {
                    const unlocked = totalScore >= r.minScore
                    const nextRank = RANKS[i + 1]
                    const progress = nextRank ? Math.min(100, Math.round(((totalScore - r.minScore) / (nextRank.minScore - r.minScore)) * 100)) : 100
                    return (
                      <div key={r.title} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${unlocked ? 'bg-purple-500/5' : ''}`}>
                        <span className={`text-sm font-bold w-20 ${r.color}`}>{r.title}</span>
                        <span className="text-xs text-zinc-400">{r.minScore.toLocaleString()} pts</span>
                        {unlocked && <span className="text-xs text-emerald-400 ml-auto">&#10003; Unlocked</span>}
                        {nextRank && !unlocked && (
                          <div className="flex-1 flex items-center gap-2 ml-auto">
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-500 w-8 text-right">{progress}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button onClick={handleRankClick} className="w-full mt-4 py-2.5 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all active:scale-95">
                    Got it!
                  </button>
                </div>
              </div>
            )}
            {personalBests.bestScore > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="card p-3 border border-purple-500/20 bg-purple-500/5 animate-scale-in" style={{ animationDelay: '320ms' }}>
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Best Score</p>
                  <p className="text-lg font-bold text-purple-400">{personalBests.bestScore}</p>
                </div>
                <div className="card p-3 border border-amber-500/20 bg-amber-500/5 animate-scale-in" style={{ animationDelay: '400ms' }}>
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Best Accuracy</p>
                  <p className="text-lg font-bold text-amber-400">{personalBests.bestAccuracy}%</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard title="Mastered" value={masteredCount} total={ALL_LETTERS.length} color="emerald" index={0} />
              <SummaryCard title="In Progress" value={learningCount} total={ALL_LETTERS.length} color="amber" index={1} />
              <SummaryCard title="Unattempted" value={unattemptedCount} total={ALL_LETTERS.length} color="zinc" index={2} />
            </div>
            <TrendGraph sessions={stats?.gameSessions || []} />
            <div className="flex items-center gap-2 animate-scale-in" style={{ animationDelay: '560ms' }}>
              <button onClick={() => handleViewMode('grid')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                Grid
              </button>
              <button onClick={() => handleViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 ${viewMode === 'list' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                List
              </button>
            </div>
            <div className="card p-4 animate-scale-in">
              {viewMode === 'grid' ? <LetterGrid letters={letterProgress} /> : <LetterList letters={letterProgress} />}
            </div>
          </>
        )}

        {/* Tab: Activity */}
        {progressTab === 'Activity' && (
          <>
            <StreakCalendar sessions={stats?.gameSessions || []} />
            {nextMilestone && streak > 0 && (
              <div className="card p-3 animate-scale-in">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-400">Next milestone</span>
                  <span className="text-xs text-zinc-500">{streak}/{nextMilestone}d</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500" style={{ width: `${milestoneProgress}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {streak >= nextMilestone ? 'Milestone reached! Keep going!' : `${nextMilestone}-day streak — ${Math.round(milestoneProgress)}% there`}
                </p>
              </div>
            )}
            {(stats?.streakFreezes || 0) > 0 && (
              <div className="card p-3 border border-sky-500/20 bg-sky-500/5 animate-scale-in">
                <div className="flex items-center gap-2">
                  <span className="text-lg">❄️</span>
                  <div>
                    <p className="text-xs font-bold text-sky-300">{stats.streakFreezes} Streak Freeze{(stats.streakFreezes || 0) > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-zinc-500">Auto-protects your streak when you miss a day</p>
                  </div>
                </div>
              </div>
            )}
            {isElectron() ? (
              <>
                <DailyGoal todayScore={stats?.todayScore || 0} dailyGoal={stats?.dailyGoal || 100} />
                <HistoryBrowser sessions={stats?.gameSessions || []} onShowAll={handleShowAllHistory} />
                <ChallengeSection challengeProgress={stats?.challengeProgress || {}} challengeDay={stats?.challengeDay || ''} />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <DailyGoal todayScore={stats?.todayScore || 0} dailyGoal={stats?.dailyGoal || 100} />
                  <HistoryBrowser sessions={stats?.gameSessions || []} onShowAll={handleShowAllHistory} />
                </div>
                <ChallengeSection challengeProgress={stats?.challengeProgress || {}} challengeDay={stats?.challengeDay || ''} />
              </>
            )}
          </>
        )}

        {/* Tab: Achievements */}
        {progressTab === 'Achievements' && (
          <AchievementSection unlockedIds={stats?.achievements || []} />
        )}
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
              <button onClick={() => setConfirmReset(false)} className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-all">Cancel</button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all">Reset Everything</button>
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-lg w-full flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">All Games</h3>
              <span className="text-xs text-zinc-500">{stats?.gameSessions?.length || 0} total</span>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[216px] pr-1">
              {[...(stats?.gameSessions || [])].reverse().map(session => {
                const accuracy = session.totalPossible > 0 ? Math.round((session.score / session.totalPossible) * 100) : 0
                const gameTypeLabel = session.gameType ? session.gameType.charAt(0).toUpperCase() + session.gameType.slice(1) : 'Game'
                return (
                  <div key={session.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 shrink">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${session.gameType === 'letter' ? 'bg-purple-500/20 text-purple-300' : session.gameType === 'spell' ? 'bg-cyan-500/20 text-cyan-300' : session.gameType === 'listen' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700 text-zinc-300'}`}>{gameTypeLabel}</span>
                      <span className="text-[11px] text-zinc-400 truncate">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono text-zinc-300 whitespace-nowrap">{session.score}/{session.totalPossible}</span>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{accuracy}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full mt-3 py-2 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all active:scale-95">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle, index = 0, onMouseMove, onMouseLeave, onClick }) {
  const colorMap = {
    purple: 'border-purple-500/30 bg-purple-500/10',
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
  }

  return (
    <div onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onClick={onClick} className={`card border p-3 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 ${colorMap[color] || colorMap.purple} animate-scale-in ${onClick ? 'cursor-pointer' : ''}`} style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-medium text-zinc-400">{title}</p>
        <span className="w-5 h-5 flex items-center justify-center rounded bg-black/20">
          {icon}
        </span>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
      {onClick && <p className="text-[9px] text-zinc-400 text-right mt-0.5">[ Tap for more info ]</p>}
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
      [...vowels, ...compoundVowels].some(v => (v.character || v.char) === (l.character || l.char))
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
        <div key={category} className="animate-fade-in">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 pb-1 border-b border-zinc-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
            {category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {items.map((letter, idx) => (
              <MasteryCard key={letter.key} letter={letter} index={idx} />
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
      [...vowels, ...compoundVowels].some(v => (v.character || v.char) === (l.character || l.char))
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
        <div key={category} className="animate-fade-in">
          <h3 className="text-lg font-semibold text-zinc-400 mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((letter, idx) => (
              <MasteryRow key={letter.key} letter={letter} index={idx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MasteryCard({ letter, index = 0 }) {
  const level = letter.level
  const borderColor = getCardBorderColor(level)
  const gradient = getMasteryColor(level)
  const label = getMasteryLabel(level)
  const trend = letter.stats?.trend || '→'
  const trendColor = trend === '↑' ? 'text-emerald-400' : trend === '↓' ? 'text-red-400' : 'text-zinc-600'

  return (
    <div className={`bg-zinc-900/80 border ${borderColor} rounded-lg p-4 hover:scale-105 transition-all duration-200 group animate-scale-in`} style={{ animationDelay: `${index * 40}ms` }}>
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
      <div className="flex items-center justify-center gap-1">
        <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>
        <span className="text-[10px] text-zinc-600">{label}</span>
      </div>
      {letter.stats && letter.stats.total > 0 && (
        <div className="text-center">
          <span className="text-[10px] text-zinc-600 font-mono">
            {letter.stats.correct}/{letter.stats.total}
          </span>
        </div>
      )}
      {letter.decayed && (
        <div className="text-center mt-1">
          <span className="text-[10px] text-rose-400" title={`Was level ${letter.rawLevel} – decayed from inactivity`}>[Decayed]</span>
        </div>
      )}
      {letter.stats?.bestStreak > 1 && (
        <div className="text-center">
          <span className="text-[10px] text-emerald-400">🔥 {letter.stats.bestStreak}x</span>
        </div>
      )}
      {letter.stats?.perMode && Object.keys(letter.stats.perMode).length > 0 && (
        <div className="flex gap-1 justify-center mt-1">
          {Object.entries(letter.stats.perMode).map(([mode, m]) => {
            const acc = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
            const color = acc >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                          acc >= 50 ? 'bg-amber-500/20 text-amber-300' :
                          'bg-red-500/20 text-red-300'
            return (
              <span key={mode} className={`text-[8px] font-bold px-1 py-0.5 rounded ${color}`}>
                {mode.charAt(0).toUpperCase()}:{acc}%
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MasteryRow({ letter, index = 0 }) {
  const level = letter.level
  const gradient = getMasteryColor(level)
  const label = getMasteryLabel(level)
  const trend = letter.stats?.trend || '→'
  const trendColor = trend === '↑' ? 'text-emerald-400' : trend === '↓' ? 'text-red-400' : 'text-zinc-600'

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 hover:border-purple-500/30 transition-colors flex items-center gap-3 animate-scale-in" style={{ animationDelay: `${index * 30}ms` }}>
      <span className="text-lg font-hangul font-light w-8 text-center">{letter.character || letter.char}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-zinc-300">{letter.romanization}</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>
            <span className="text-[10px] text-zinc-500">{label}</span>
          </div>
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
          {letter.decayed && <div className="text-rose-400 text-[9px]">[Decayed]</div>}
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