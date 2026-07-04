import { useEffect, useRef } from 'react'

interface CircularTimerProps {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  onTimeout: () => void
}

export default function CircularTimer({ timeRemaining, totalTime, isRunning, onTimeout }: CircularTimerProps) {
  const prevTimeRef = useRef(timeRemaining)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const progress = timeRemaining / totalTime
  const offset = circumference * (1 - progress)
  const isLow = timeRemaining <= 5 && isRunning
  const isCritical = timeRemaining <= 3 && isRunning

  useEffect(() => {
    if (isRunning && timeRemaining <= 0 && prevTimeRef.current > 0) {
      onTimeout()
    }
    prevTimeRef.current = timeRemaining
  }, [timeRemaining, isRunning, onTimeout])

  return (
    <div className={`relative flex items-center justify-center ${isCritical ? 'animate-timer-pulse' : ''}`}>
      <svg width="120" height="120" className="transform -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-zinc-800"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={
            isCritical
              ? 'text-red-500 transition-all duration-300 ease-linear'
              : isLow
              ? 'text-yellow-500 transition-all duration-300 ease-linear'
              : 'text-purple-500 transition-all duration-300 ease-linear'
          }
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold font-mono ${
          isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-zinc-100'
        }`}>
          {timeRemaining}s
        </span>
      </div>
    </div>
  )
}