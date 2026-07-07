import { useState, useEffect } from 'react'

export default function AchievementUnlock({ achievements, onDismiss }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index === 0) {
      const audio = new Audio('audio/sfx/achievement_unlocked.mp3')
      audio.play().catch(() => {})
    }
  }, [index])

  useEffect(() => {
    if (index >= achievements.length) return
    const timer = setTimeout(() => setIndex(i => i + 1), 2500)
    return () => clearTimeout(timer)
  }, [index, achievements.length])

  useEffect(() => {
    if (index >= achievements.length) {
      const timer = setTimeout(onDismiss, 3000)
      return () => clearTimeout(timer)
    }
  }, [index, achievements.length, onDismiss])

  if (index >= achievements.length) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onDismiss}>
        <div className="bg-zinc-900/95 border border-purple-500/30 rounded-xl p-6 max-w-sm w-full text-center animate-slide-up">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-white font-bold text-lg mb-1">Achievements Unlocked!</h3>
          <p className="text-zinc-400 text-xs">You unlocked {achievements.length} new achievement{achievements.length > 1 ? 's' : ''}</p>
        </div>
      </div>
    )
  }

  const a = achievements[index]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onDismiss}>
      <div className="bg-zinc-900/95 border border-purple-500/30 rounded-xl p-6 max-w-sm w-full text-center animate-slide-up">
        <div className="text-5xl mb-3 animate-bounce">{a.icon}</div>
        <h3 className="text-white font-bold text-lg mb-1">Achievement Unlocked!</h3>
        <p className="text-purple-400 font-bold text-base mb-1">{a.title}</p>
        <p className="text-zinc-400 text-sm">{a.description}</p>
        <p className="text-zinc-600 text-[10px] mt-3">{index + 1} / {achievements.length}</p>
      </div>
    </div>
  )
}
