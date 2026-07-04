export default function FeedbackOverlay({ 
  result, 
  letter, 
  onNext, 
  onSpeak,
  speaking 
}) {
  if (!result) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-5 max-w-sm w-full animate-slide-up">
        <div className="text-center mb-4">
          <span className="text-5xl font-hangul font-light block">{letter.character || letter.char}</span>
          <p className="text-zinc-400 mt-1 text-xs capitalize">{letter.type}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className={`p-2.5 rounded-lg border-2 ${
            result.typeCorrect 
              ? 'bg-green-900/30 border-green-500' 
              : 'bg-red-900/30 border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-zinc-400">Type</span>
              <span className={`text-sm ${result.typeCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {result.typeCorrect ? '✓' : '✗'}
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Your answer: <span className={`font-mono ${result.typeCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {result.typeAnswer ? result.typeAnswer.charAt(0).toUpperCase() + result.typeAnswer.slice(1) : 'No answer'}
              </span>
              {!result.typeCorrect && (
                (result.typeAnswer === null
                  ? <><span className="text-zinc-500"> — Correct: </span><span className="font-mono text-green-400">{letter.type}</span></>
                  : <><span className="text-zinc-500"> → </span><span className="font-mono text-green-400">{letter.type}</span></>
                )
              )}
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border-2 ${
            result.soundCorrect 
              ? 'bg-green-900/30 border-green-500' 
              : 'bg-red-900/30 border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-zinc-400">Sound</span>
              <span className={`text-sm ${result.soundCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {result.soundCorrect ? '✓' : '✗'}
              </span>
            </div>
            <div className="text-xs text-zinc-300">
              Your answer: <span className={`font-mono ${result.soundCorrect ? 'text-green-400' : 'text-red-400'}`}>
                /{result.soundAnswer || '—'}/
              </span>
              {!result.soundCorrect && (
                <><span className="text-zinc-500"> → </span><span className="font-mono text-green-400">/{letter.romanization}/</span></>
              )}
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg text-center font-bold text-sm mb-4 ${
          result.points === 2 ? 'bg-green-900/30 border-green-500 text-green-400' :
          result.points === 1 ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' :
          'bg-red-900/30 border-red-500 text-red-400'
        } border-2`}>
          +{result.points} / 2 points
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSpeak}
            disabled={speaking}
            className="flex-1 py-2 px-3 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {speaking ? 'Playing...' : '🔊 Hear Pronunciation'}
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}