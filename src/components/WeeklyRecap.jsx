function getWeekBounds() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const prevMonday = new Date(monday)
  prevMonday.setDate(monday.getDate() - 7)
  const prevSunday = new Date(monday)
  prevSunday.setDate(monday.getDate() - 1)
  prevSunday.setHours(23, 59, 59, 999)
  return { thisWeekStart: monday, prevWeekStart: prevMonday, prevWeekEnd: prevSunday }
}

function computeWeekStats(sessions, start, end) {
  const filtered = sessions.filter(s => {
    const d = new Date(s.date)
    return d >= start && d <= end
  })
  return {
    games: filtered.length,
    score: filtered.reduce((sum, s) => sum + (s.score || 0), 0),
    accuracy: filtered.length > 0
      ? Math.round(filtered.reduce((sum, s) => sum + (s.score || 0), 0) / filtered.reduce((sum, s) => sum + (s.totalPossible || 1), 0) * 100)
      : 0,
  }
}

export default function WeeklyRecap({ gameSessions, onDismiss }) {
  const { thisWeekStart, prevWeekStart, prevWeekEnd } = getWeekBounds()
  const thisWeek = computeWeekStats(gameSessions || [], thisWeekStart, new Date())
  const lastWeek = computeWeekStats(gameSessions || [], prevWeekStart, prevWeekEnd)

  const scoreDiff = thisWeek.score - lastWeek.score
  const gamesDiff = thisWeek.games - lastWeek.games

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onDismiss}>
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-1">Weekly Recap</h2>
        <p className="text-zinc-500 text-xs mb-4">How you did this week vs last week</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-500 mb-0.5">Score</p>
            <p className="text-lg font-bold text-purple-400">{thisWeek.score}</p>
            <p className={`text-[10px] ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {scoreDiff >= 0 ? '↑' : '↓'} {Math.abs(scoreDiff)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-500 mb-0.5">Games</p>
            <p className="text-lg font-bold text-cyan-400">{thisWeek.games}</p>
            <p className={`text-[10px] ${gamesDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {gamesDiff >= 0 ? '↑' : '↓'} {Math.abs(gamesDiff)}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-800/50 text-center mb-4">
          <p className="text-[10px] text-zinc-500 mb-0.5">Accuracy</p>
          <p className="text-lg font-bold text-emerald-400">{thisWeek.accuracy}%</p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Keep going!
        </button>
      </div>
    </div>
  )
}