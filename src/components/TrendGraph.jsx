import { useMemo } from 'react'

export default function TrendGraph({ sessions, maxPoints = 20 }) {
  const data = useMemo(() => {
    const recent = [...sessions].reverse().slice(0, maxPoints).reverse()
    return recent.map(s => ({
      score: s.score || 0,
      total: s.totalPossible || 1,
      accuracy: s.totalPossible > 0 ? Math.round((s.score / s.totalPossible) * 100) : 0,
    }))
  }, [sessions, maxPoints])

  if (data.length < 2) {
    return (
      <div className="card p-3 animate-scale-in">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Score Trend</h3>
        <p className="text-[11px] text-zinc-600">Play at least 2 games to see your trend</p>
      </div>
    )
  }

  const width = 280
  const height = 100
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxScore = 100
  const scores = data.map(d => d.accuracy)

  const xScale = (i) => padding.left + (i / (data.length - 1)) * chartW
  const yScale = (v) => padding.top + chartH - (v / maxScore) * chartH

  const points = scores.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ')

  const polyPoints = points
  const areaD = `M${points} L${xScale(data.length - 1)},${padding.top + chartH} L${xScale(0)},${padding.top + chartH} Z`
  const gradientId = 'scoreGradient'

  return (
    <div className="card p-3 animate-scale-in" style={{ animationDelay: '480ms' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Score Trend</h3>
        <span className="text-[10px] text-zinc-500">Last {data.length} games</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padding.top + chartH - ratio * chartH
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#27272a" strokeWidth="0.5" />
              <text x={padding.left - 4} y={y + 3} textAnchor="end" className="fill-zinc-600" fontSize="8">{Math.round(maxScore * ratio)}%</text>
            </g>
          )
        })}
        {/* Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />
        {/* Line */}
        <polyline points={polyPoints} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {scores.map((v, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(v)} r="2" fill="#a855f7" stroke="#18181b" strokeWidth="1" />
        ))}
        {/* Labels */}
        {data.length > 1 && (
          <>
            <text x={xScale(0)} y={height - 2} textAnchor="start" className="fill-zinc-600" fontSize="7">-{data.length - 1}</text>
            <text x={xScale(data.length - 1)} y={height - 2} textAnchor="end" className="fill-zinc-600" fontSize="7">now</text>
          </>
        )}
      </svg>
    </div>
  )
}
