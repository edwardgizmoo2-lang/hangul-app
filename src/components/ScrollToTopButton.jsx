import { useState, useEffect, useRef } from 'react'
import { isElectron } from '../utils/platform'

export default function ScrollToTopButton({ scrollRef }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    const onScroll = () => {
      setVisible(el.scrollTop > 300)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  const scrollToTop = () => {
    scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      className={`fixed z-50 w-11 h-11 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all duration-200 hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95 animate-fade-in ${
        isElectron()
          ? 'bottom-6 right-6'
          : 'bottom-6 left-1/2 -translate-x-1/2'
      }`}
      aria-label="Scroll to top"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
