import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

export default function PerfectOverlay({ onDismiss, autoDismissMs = 5000 }) {
  const [visible, setVisible] = useState(true)

  const animateOut = useCallback(() => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }, [onDismiss])

  useEffect(() => {
    const count = 200
    const defaults = { origin: { y: 0.7 } }

    function fire(particleRatio, opts) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) })
    }

    function round() {
      fire(0.25, { spread: 26, startVelocity: 55 })
      fire(0.2,  { spread: 60 })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      fire(0.1,  { spread: 120, startVelocity: 45 })
    }

    round()
    const t1 = setTimeout(round, 700)
    const t2 = setTimeout(round, 1400)

    const autoDismiss = setTimeout(animateOut, autoDismissMs)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(autoDismiss) }
  }, [animateOut, autoDismissMs])

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${visible ? '' : 'opacity-0'}`} onClick={animateOut}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? '' : 'opacity-0'}`} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" onClick={animateOut}>
        <div className={`text-center transition-all duration-300 ${visible ? 'animate-slide-up' : 'opacity-0 scale-90'}`}>
          <div className="text-7xl mb-3 animate-bounce-in">💯</div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            PERFECT!
          </h1>
          <p className="text-zinc-200 mt-2 text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">Every answer correct</p>
        </div>
      </div>
    </div>
  )
}