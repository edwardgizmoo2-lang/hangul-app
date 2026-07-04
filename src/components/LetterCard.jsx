export default function LetterCard({ 
  letter, 
  soundOptions, 
  typeAnswer, 
  soundAnswer, 
  onTypeSelect, 
  onSoundSelect, 
  onSubmit, 
  canSubmit, 
  speaking,
  showTTSWarning
}) {
  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="text-center mb-5">
          <span className="text-6xl font-hangul font-light select-none block">{letter.character || letter.char}</span>
          <p className="text-zinc-500 mt-1 text-xs">What type is this?</p>
        </div>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-zinc-400 mb-1">Type</legend>
            <div className="grid grid-cols-2 gap-2">
              {['consonant', 'vowel'].map(type => (
                <button
                  key={type}
                  onClick={() => onTypeSelect(type)}
                  className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                    typeAnswer === type
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
                >
                  {type === 'consonant' ? 'Consonant' : 'Vowel'}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-zinc-400 mb-1">Sound</legend>
            <div className="grid grid-cols-2 gap-2">
              {soundOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => onSoundSelect(option)}
                  className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                    soundAnswer === option
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
                >
                  /{option}/
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {showTTSWarning && (
          <div className="mt-3 p-2 bg-amber-900/30 border border-amber-600/30 rounded-lg text-amber-300 text-xs text-center">
            Korean voice not available - install Korean language pack
          </div>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || speaking}
        className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all ${
          canSubmit && !speaking
            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        {speaking ? 'Playing...' : 'Submit Answer'}
      </button>
    </div>
  )
}