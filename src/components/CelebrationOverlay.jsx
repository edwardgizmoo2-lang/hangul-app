const MILESTONE_LABELS = {
  7: { emoji: '🔥', label: '7-Day Streak!' },
  14: { emoji: '⚡', label: '14-Day Streak!' },
  30: { emoji: '💪', label: '30-Day Streak!' },
  60: { emoji: '🌟', label: '60-Day Streak!' },
  100: { emoji: '👑', label: '100-Day Streak!' },
}

export default function CelebrationOverlay({ milestone, onDismiss }) {
  const info = MILESTONE_LABELS[milestone] || { emoji: '🎉', label: 'Milestone!' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onDismiss}>
      <div className="text-center animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4 animate-bounce">{info.emoji}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{info.label}</h2>
        <p className="text-zinc-400 text-sm mb-6">Keep up the great work!</p>
        <button
          onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all"
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}