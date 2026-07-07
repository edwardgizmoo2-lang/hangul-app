import { isElectron } from '../utils/platform'

export default function Header({ activeTab, onTabChange, onMinimize, onMaximize, onClose, isMaximized }) {
  const electron = isElectron()

  return (
    <div className="flex flex-col bg-zinc-900/80 border-b border-zinc-800 pt-1">
      {/* Title bar with window controls (Electron only) */}
      {electron && (
        <div className="h-8 flex items-center justify-between px-2 -webkit-app-region:drag">
          <div className="flex-1" />
          <div className="flex items-center -webkit-app-region:no-drag">
            <button
              onClick={onMinimize}
              className="w-11 h-8 flex items-center justify-center rounded hover:bg-zinc-700/50 transition-colors"
              aria-label="Minimize"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={onMaximize}
              className="w-11 h-8 flex items-center justify-center rounded hover:bg-zinc-700/50 transition-colors"
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMaximized ? (
                  <>
                    <rect x="6" y="5" width="9" height="9" rx="1.5" strokeWidth="1.5" />
                    <rect x="9" y="10" width="9" height="9" rx="1.5" strokeWidth="1.5" />
                  </>
                ) : (
                  <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-11 h-8 flex items-center justify-center rounded hover:bg-red-500/30 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Nav bar with title and tabs */}
      <div className={`flex items-center gap-4 px-4 ${electron ? 'pb-2 pt-2.5 -webkit-app-region:drag' : 'pb-2 pt-3 safe-area-top'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none font-bold">한글</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Hangul Learn</span>
        </div>
        <div className="w-px h-5 bg-zinc-700" />
        <nav className="flex items-center gap-1.5" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'learn'}
            onClick={() => onTabChange('learn')}
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${!electron ? '' : '-webkit-app-region:no-drag'} ${
              activeTab === 'learn'
                ? 'border border-purple-500/30 bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'border border-purple-500/20 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Learn
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'hangul'}
            onClick={() => onTabChange('hangul')}
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${!electron ? '' : '-webkit-app-region:no-drag'} ${
              activeTab === 'hangul'
                ? 'border border-purple-500/30 bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'border border-purple-500/20 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Hangul
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'progress'}
            onClick={() => onTabChange('progress')}
            className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${!electron ? '' : '-webkit-app-region:no-drag'} ${
              activeTab === 'progress'
                ? 'border border-purple-500/30 bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                : 'border border-purple-500/20 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Progress
          </button>
        </nav>
      </div>
    </div>
  )
}
