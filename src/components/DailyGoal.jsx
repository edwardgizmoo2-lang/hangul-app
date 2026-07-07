export default function DailyGoal({ todayScore, dailyGoal, gameSessions }) {
  const today = new Date().toISOString().split('T')[0]
  const playedToday = (gameSessions || []).some(s => s.date === today)
  const progress = Math.min((todayScore / dailyGoal) * 100, 100)

  return (
    <div className="card p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-zinc-400">Daily Goal</h3>
        <span className="text-xs text-zinc-500">{todayScore}/{dailyGoal}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress >= 100
              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
              : 'bg-gradient-to-r from-purple-500 to-cyan-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">
        {progress >= 100
          ? 'Goal reached! 🎉'
          : playedToday
            ? `${Math.round(progress)}% of daily goal`
            : 'Play a game to start'}
      </p>
    </div>
  )
}