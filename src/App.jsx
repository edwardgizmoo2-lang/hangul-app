import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import Header from './components/Header'
import ScrollToTopButton from './components/ScrollToTopButton'
import Loading from './components/Loading'
import CelebrationOverlay from './components/CelebrationOverlay'
import WeeklyRecap from './components/WeeklyRecap'
import AchievementUnlock from './components/AchievementUnlock'
import { getStats, getLetterMastery, saveGameSession, RANKS } from './utils/storage'
import { isNative, isElectron } from './utils/platform'
import { version as APP_VERSION } from '../package.json'

const LearnTab = lazy(() => import('./components/LearnTab'))
const HangulTab = lazy(() => import('./components/HangulTab'))
const ProgressTab = lazy(() => import('./components/ProgressTab'))

function App() {
  const [activeTab, setActiveTab] = useState('learn')
  const [stats, setStats] = useState(null)
  const [letterMastery, setLetterMastery] = useState({})
  const [gameInProgress, setGameInProgress] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
  const [gameSessionCounter, setGameSessionCounter] = useState(0)
  const [isMaximized, setIsMaximized] = useState(false)
  const [milestone, setMilestone] = useState(null)
  const [showRecap, setShowRecap] = useState(false)
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(false)
  const [streakBannerClosing, setStreakBannerClosing] = useState(false)
  const [streakBannerVisible, setStreakBannerVisible] = useState(false)
  const [newAchievements, setNewAchievements] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setStreakBannerVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const rank = RANKS.filter(r => (stats?.totalScore || 0) >= r.minScore).pop() || RANKS[0]
  const prevRankRef = useRef(null)

  useEffect(() => {
    const currentRank = RANKS.filter(r => (stats?.totalScore || 0) >= r.minScore).pop() || RANKS[0]
    if (prevRankRef.current && prevRankRef.current !== currentRank.title) {
      const audio = new Audio('audio/sfx/rank_up.mp3')
      audio.play().catch(() => {})
    }
    prevRankRef.current = currentRank.title
  }, [stats?.totalScore])

  useEffect(() => {
    if (!window.electronAPI?.isMaximized) return
    window.electronAPI.isMaximized().then(setIsMaximized)
    window.electronAPI.onMaximizedChange(setIsMaximized)
  }, [])

  useEffect(() => {
    if (!pendingTab) return
    const audio = new Audio('audio/sfx/leave_game.mp3')
    audio.play().catch(() => {})
  }, [pendingTab])

  const loadStats = useCallback(async () => {
    const [s, lm] = await Promise.all([getStats(), getLetterMastery()])
    setStats(s)
    setLetterMastery(lm)
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isNative()) return
    let remove = () => {}
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        if (gameInProgress) {
          setPendingTab('learn')
        } else if (activeTab !== 'learn') {
          setActiveTab('learn')
        }
      }).then(h => { remove = h.remove })
    })
    return () => remove()
  }, [gameInProgress, activeTab])

  // Auto-dismiss streak banner after 10 seconds
  useEffect(() => {
    if (!streakBannerDismissed) {
      const timer = setTimeout(() => {
        setStreakBannerClosing(true)
        setTimeout(() => setStreakBannerDismissed(true), 300)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [streakBannerDismissed])

  const handleGameComplete = async (gameResult) => {
    const result = await saveGameSession(gameResult)
    await loadStats()
    if (result?.newlyUnlocked?.length > 0) {
      setNewAchievements(result.newlyUnlocked)
    }
    if (result?.milestone) {
      setMilestone(result.milestone)
    }
    setShowRecap(true)
    setStreakBannerDismissed(false)
    setStreakBannerClosing(false)
  }

  const handleTabChange = (tab) => {
    if (tab === activeTab) return
    if (gameInProgress) {
      setPendingTab(tab)
      return
    }
    switchTab(tab)
  }

  const switchTab = (tab) => {
    if (tab === 'progress') {
      loadStats()
    }
    setActiveTab(tab)
  }

  const cancelTabChange = () => {
    setPendingTab(null)
  }

  const confirmTabChange = () => {
    setGameInProgress(false)
    setGameSessionCounter(c => c + 1)
    const tab = pendingTab
    setPendingTab(null)
    switchTab(tab)
  }

  return (
    <div className="dark bg-zinc-950 h-full flex flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMinimize={() => window.electron?.window?.minimize?.()}
        onMaximize={async () => { const m = await window.electron?.window?.maximize?.(); if (m !== undefined) setIsMaximized(m) }}
        onClose={() => window.electron?.window?.close?.()}
        isMaximized={isMaximized}
        rank={rank}
      />
      <main ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loading size="lg" /></div>}>
          {activeTab === 'learn' && (
            <>
              {streakBannerVisible && stats?.streak?.current > 0 && stats?.streak?.lastPlayDate && stats.streak.lastPlayDate !== new Date().toISOString().split('T')[0] && !streakBannerDismissed && (
                <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-full max-w-sm pointer-events-none">
                  <div className={`relative p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm pointer-events-auto ${streakBannerClosing ? 'animate-fade-out' : 'animate-slide-up'}`}>
                    <button
                      onClick={() => { setStreakBannerClosing(true); setTimeout(() => setStreakBannerDismissed(true), 300) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm font-medium text-emerald-300 text-center">
                      🔥 Play today to keep your {stats.streak.current}-day streak!
                    </p>
                  </div>
                </div>
              )}
              <LearnTab key={gameSessionCounter} onLeave={() => setPendingTab('learn')} onGameComplete={handleGameComplete} onGameStateChange={setGameInProgress} />
            </>
          )}
          {activeTab === 'hangul' && (
            <HangulTab />
          )}
          {activeTab === 'progress' && (
            <ProgressTab stats={stats} letterMastery={letterMastery} onRefresh={loadStats} />
          )}
        </Suspense>
      </main>
      {activeTab !== 'hangul' && <ScrollToTopButton scrollRef={scrollRef} />}

      {activeTab === 'learn' && !gameInProgress && (
        <p className={`fixed bottom-2 text-zinc-500 text-xs font-medium pointer-events-none select-none ${
          isElectron() ? 'right-4' : 'left-1/2 -translate-x-1/2'
        }`}>
          Made by Edward · v{APP_VERSION}
        </p>
      )}

      {milestone && (
        <CelebrationOverlay milestone={milestone} onDismiss={() => setMilestone(null)} />
      )}

      {newAchievements.length > 0 && (
        <AchievementUnlock achievements={newAchievements} onDismiss={() => setNewAchievements([])} />
      )}

      {showRecap && stats?.gameSessions?.length > 0 && (
        <WeeklyRecap gameSessions={stats.gameSessions} onDismiss={() => setShowRecap(false)} />
      )}

      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full mx-4 animate-slide-up shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-white font-bold text-base mb-1">Leave game?</h3>
              <p className="text-zinc-400 text-xs">Your progress in this game will not be saved.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelTabChange}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-all"
              >
                Keep Playing
              </button>
              <button
                onClick={confirmTabChange}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
