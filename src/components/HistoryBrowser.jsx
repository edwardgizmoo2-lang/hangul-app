import { useState } from 'react'

export default function HistoryBrowser({ gameSessions }) {
  const [showAll, setShowAll] = useState(false)
  const display = showAll ? gameSessions : (gameSessions || []).slice(-10)

  if (!gameSessions?.length) return null

  return (
    <div className="card p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-400">Game History</h3>
        {gameSessions.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showAll ? 'Show less' : `Show all (${gameSessions.length})`}
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {display.slice().reverse().map((s, i) => {
          const accuracy = s.totalPossible > 0 ? Math.round((s.score / s.totalPossible) * 100) : 0
          return (
            <div key={s.id || i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">{s.date}</span>
                <span className="text-[10px] text-zinc-400 capitalize">{s.mode || 'freeplay'}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] font-mono text-zinc-400">{accuracy}%</span>
                <span className="text-[10px] font-bold text-emerald-400">{s.score}pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}