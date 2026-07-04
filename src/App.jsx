import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import LearnTab from './components/LearnTab'
import ProgressTab from './components/ProgressTab'
import { getStats, getLetterMastery, saveGameSession } from './utils/storage'
import { isElectron } from './utils/platform'

function App() {
  const [activeTab, setActiveTab] = useState('learn')
  const [stats, setStats] = useState(null)
  const [letterMastery, setLetterMastery] = useState({})
  const [koreanVoiceAvailable, setKoreanVoiceAvailable] = useState(false)

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
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'learn' && (
          <LearnTab onGameComplete={handleGameComplete} koreanVoiceAvailable={koreanVoiceAvailable} />
        )}
        {activeTab === 'progress' && (
          <ProgressTab stats={stats} letterMastery={letterMastery} onRefresh={loadStats} />
        )}
      </main>
    </div>
  )
}

export default App
