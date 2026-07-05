import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import Header from './components/Header'
import ScrollToTopButton from './components/ScrollToTopButton'
import Loading from './components/Loading'
import { getStats, getLetterMastery, saveGameSession } from './utils/storage'

const LearnTab = lazy(() => import('./components/LearnTab'))
const HangulTab = lazy(() => import('./components/HangulTab'))
const ProgressTab = lazy(() => import('./components/ProgressTab'))

function App() {
  const [activeTab, setActiveTab] = useState('learn')
  const [stats, setStats] = useState(null)
  const [letterMastery, setLetterMastery] = useState({})
  const [gameInProgress, setGameInProgress] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
  const scrollRef = useRef(null)

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

  const handleGameComplete = async (gameResult) => {
    await saveGameSession(gameResult)
    await loadStats()
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
        onMaximize={() => window.electron?.window?.maximize?.()}
        onClose={() => window.electron?.window?.close?.()}
        isMaximized={false}
      />
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loading size="lg" /></div>}>
          {activeTab === 'learn' && (
            <LearnTab onGameComplete={handleGameComplete} onGameStateChange={setGameInProgress} />
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
