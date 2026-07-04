export default function GameControls({ onQuit, disabled }) {
  return (
    <div className="p-3 border-t border-zinc-800">
      <button
        onClick={onQuit}
        disabled={disabled}
        className="w-full py-2 px-4 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:bg-zinc-700 hover:text-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Quit Game (No Progress Saved)
      </button>
    </div>
  )
}