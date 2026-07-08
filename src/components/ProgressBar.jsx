export default function ProgressBar({ current, total, score }) {
  const percent = ((current - 1) / total) * 100
  const maxScore = total

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-400">
          {current} / {total}
        </span>
        <span className="text-xs font-bold text-emerald-400">
          {score} / {maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}