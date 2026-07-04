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
  const [koreanVoiceAvailable, setKoreanVoiceAvailable] = useState(false)
  const scrollRef = useRef(null)

  const loadStats = useCallback(async () => {
    const [s, lm] = await Promise.all([getStats(), getLetterMastery()])
    setStats(s)
    setLetterMastery(lm)
  }, [])

  useEffect(() => {
    loadStats()
    checkTTS()
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

  const checkTTS = () => {
    if ('speechSynthesis' in window) {
      const check = () => {
        const voices = speechSynthesis.getVoices()
        const krVoice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'))
        setKoreanVoiceAvailable(!!krVoice)
      }
      if (speechSynthesis.getVoices().length > 0) {
        check()
      } else {
        speechSynthesis.onvoiceschanged = check
      }
    }
  }

  const handleGameComplete = async (gameResult) => {
    await saveGameSession(gameResult)
    await loadStats()
  }

  const handleTabChange = (tab) => {
    if (tab === 'progress') {
      loadStats()
    }
    setActiveTab(tab)
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
            <LearnTab onGameComplete={handleGameComplete} koreanVoiceAvailable={koreanVoiceAvailable} />
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
    </div>
  )
}

export default App
