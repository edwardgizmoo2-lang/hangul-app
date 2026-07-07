function getDates(weeksBack = 12) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const dates = []
  for (let w = weeksBack - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() - w * 7 + d)
      dates.push(date.toISOString().split('T')[0])
    }
  }
  return dates
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function getIntensity(dateStr, dateScores) {
  const score = dateScores[dateStr] || 0
  if (score === 0) return 0
  if (score <= 10) return 1
  if (score <= 30) return 2
  if (score <= 60) return 3
  return 4
}

const CELL_COLORS = [
  'bg-zinc-800',
  'bg-emerald-900/50',
  'bg-emerald-700/60',
  'bg-emerald-500/60',
  'bg-emerald-400',
]

export default function StreakCalendar({ gameSessions }) {
  const dates = getDates(12)

  const dateScores = {}
  ;(gameSessions || []).forEach(s => {
    const d = s.date
    dateScores[d] = (dateScores[d] || 0) + (s.score || 0)
  })

  const weeks = []
  for (let w = 0; w < dates.length / 7; w++) {
    weeks.push(dates.slice(w * 7, w * 7 + 7))
  }

  return (
    <div className="card p-3 animate-fade-in">
      <h3 className="text-sm font-semibold text-zinc-400 mb-2">Activity</h3>
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        <div className="flex flex-col gap-0.5 mr-1 pt-4">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 text-[8px] text-zinc-600 leading-3">{label}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((dateStr, di) => {
              const intensity = getIntensity(dateStr, dateScores)
              return (
                <div
                  key={dateStr}
                  className={`w-3 h-3 rounded-sm ${CELL_COLORS[intensity]} transition-colors`}
                  title={`${dateStr}: ${dateScores[dateStr] || 0}pts`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-1.5">
        <span className="text-[9px] text-zinc-600">Less</span>
        {CELL_COLORS.map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-zinc-600">More</span>
      </div>
    </div>
  )
}