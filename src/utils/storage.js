import { isElectron, isNative } from './platform'

const STORAGE_KEY = 'hangul-progress'
const STREAK_MILESTONES = [7, 14, 30, 60, 100]

const RANKS = [
  { title: 'Bronze', minScore: 0, color: 'text-amber-600' },
  { title: 'Silver', minScore: 500, color: 'text-zinc-300' },
  { title: 'Gold', minScore: 2000, color: 'text-yellow-400' },
  { title: 'Platinum', minScore: 5000, color: 'text-cyan-300' },
  { title: 'Diamond', minScore: 10000, color: 'text-blue-300' },
]

function calcMultiplier(streak) {
  return 1 + (streak || 0) * 0.05
}

function detectMilestone(newStreak, oldStreak) {
  return STREAK_MILESTONES.find(m => newStreak >= m && (oldStreak || 0) < m) || null
}

const defaultProgress = {
  totalScore: 0,
  gamesPlayed: 0,
  lastPlayedDate: '',
  streak: 0,
  letterMastery: {},
  gameHistory: [],
}

// --- Electron storage (IPC to main process) ---

async function electronLoad() {
  return await window.electron.data.getProgress()
}

async function electronSave(session) {
  return await window.electron.data.saveGameSession(session)
}

async function electronReset() {
  return await window.electron.data.resetProgress()
}

async function electronUpdateLetter(letter, correct) {
  return await window.electron.data.updateLetterStat(letter, correct)
}

// --- Capacitor storage (Preferences key-value store) ---

async function capacitorLoad() {
  const { Preferences } = await import('@capacitor/preferences')
  const { value } = await Preferences.get({ key: STORAGE_KEY })
  if (!value) return defaultProgress
  try {
    return { ...defaultProgress, ...JSON.parse(value) }
  } catch {
    return defaultProgress
  }
}

async function capacitorSave(progress) {
  const { Preferences } = await import('@capacitor/preferences')
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(progress) })
}

function calculateStreak(progress) {
  const today = new Date().toISOString().split('T')[0]
  const lastPlayed = progress.lastPlayedDate
  if (lastPlayed === today) return progress.streak
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  if (lastPlayed === yesterdayStr) return progress.streak + 1
  return 1
}

async function capacitorSaveSession(session) {
  const progress = await capacitorLoad()
  const today = new Date().toISOString().split('T')[0]
  const oldStreak = progress.streak || 0
  const newStreak = calculateStreak(progress)
  const multiplier = calcMultiplier(oldStreak)
  const bonusPoints = Math.round(session.score * (multiplier - 1))

  const updatedMastery = { ...progress.letterMastery }
  session.letterResults.forEach(result => {
    const key = result.letter
    const current = updatedMastery[key] || 0
    if (result.typeCorrect && result.soundCorrect) {
      updatedMastery[key] = Math.min(5, current + 1)
    } else if (!result.typeCorrect && !result.soundCorrect) {
      updatedMastery[key] = Math.max(0, current - 1)
    }
  })

  const updated = {
    ...progress,
    totalScore: progress.totalScore + session.score + bonusPoints,
    gamesPlayed: progress.gamesPlayed + 1,
    lastPlayedDate: today,
    streak: newStreak,
    letterMastery: updatedMastery,
    gameHistory: [...progress.gameHistory, session].slice(-100),
  }

  await capacitorSave(updated)
  return {
    progress: updated,
    milestone: detectMilestone(newStreak, oldStreak),
    multiplier,
    bonusPoints,
  }
}

async function capacitorReset() {
  await capacitorSave(defaultProgress)
  return defaultProgress
}

async function capacitorUpdateLetter(letter, correct) {
  const progress = await capacitorLoad()
  const updatedMastery = { ...progress.letterMastery }
  const current = updatedMastery[letter] || 0
  if (correct) {
    updatedMastery[letter] = Math.min(5, current + 1)
  } else {
    updatedMastery[letter] = Math.max(0, current - 1)
  }
  progress.letterMastery = updatedMastery
  await capacitorSave(progress)
}

// --- Unified API ---

function toStats(progress) {
  const history = progress.gameHistory || []
  return {
    gameSessions: history,
    letterStats: progress.letterMastery || {},
    streak: {
      current: progress.streak || 0,
      longest: Math.max(...(history).reduce((acc, g) => {
        const last = acc.length > 0 ? acc[acc.length - 1] : 0
        acc.push(g.score > 0 ? last + 1 : 0)
        return acc
      }, [0]), 0),
      lastPlayDate: progress.lastPlayedDate || null,
    },
    totalScore: progress.totalScore || 0,
    totalGamesCompleted: progress.gamesPlayed || 0,
    personalBests: {
      bestScore: Math.max(...(history.map(g => g.score || 0)), 0),
      bestAccuracy: Math.max(...(history.map(g =>
        g.totalPossible > 0 ? Math.round((g.score / g.totalPossible) * 100) : 0
      )), 0),
    },
  }
}

export async function getStats() {
  try {
    let progress
    if (isElectron()) {
      progress = await electronLoad()
    } else if (isNative()) {
      progress = await capacitorLoad()
    } else {
      // Web fallback: localStorage
      const raw = localStorage.getItem(STORAGE_KEY)
      progress = raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress
    }
    if (!progress) throw new Error('No data')
    return toStats(progress)
  } catch (e) {
    console.error('Failed to get stats:', e)
    return {
      gameSessions: [],
      letterStats: {},
      streak: { current: 0, longest: 0, lastPlayDate: null },
      totalScore: 0,
      totalGamesCompleted: 0,
    }
  }
}

export async function getLetterMastery() {
  const stats = await getStats()
  return stats.letterStats || {}
}

export async function saveGameSession(session) {
  try {
    if (isElectron()) {
      return await electronSave(session)
    } else if (isNative()) {
      return await capacitorSaveSession(session)
    } else {
      // Web fallback
      const raw = localStorage.getItem(STORAGE_KEY)
      const progress = raw ? { ...defaultProgress, ...JSON.parse(raw) } : { ...defaultProgress }
      const today = new Date().toISOString().split('T')[0]
      const oldStreak = progress.streak || 0
      const newStreak = calculateStreak(progress)
      const multiplier = calcMultiplier(oldStreak)
      const bonusPoints = Math.round(session.score * (multiplier - 1))
      const updatedMastery = { ...progress.letterMastery }
      session.letterResults.forEach(result => {
        const key = result.letter
        const current = updatedMastery[key] || 0
        if (result.typeCorrect && result.soundCorrect) {
          updatedMastery[key] = Math.min(5, current + 1)
        } else if (!result.typeCorrect && !result.soundCorrect) {
          updatedMastery[key] = Math.max(0, current - 1)
        }
      })
      const updated = {
        ...progress,
        totalScore: progress.totalScore + session.score + bonusPoints,
        gamesPlayed: progress.gamesPlayed + 1,
        lastPlayedDate: today,
        streak: newStreak,
        letterMastery: updatedMastery,
        gameHistory: [...progress.gameHistory, session].slice(-100),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return {
        progress: updated,
        milestone: detectMilestone(newStreak, oldStreak),
        multiplier,
        bonusPoints,
      }
    }
  } catch (e) {
    console.error('Failed to save game session:', e)
  }
}

export async function updateLetterStat(letter, correct) {
  try {
    if (isElectron()) {
      return await electronUpdateLetter(letter, correct)
    } else if (isNative()) {
      return await capacitorUpdateLetter(letter, correct)
    }
  } catch (e) {
    console.error('Failed to update letter stat:', e)
  }
}

export async function resetProgress() {
  try {
    if (isElectron()) {
      return await electronReset()
    } else if (isNative()) {
      return await capacitorReset()
    } else {
      localStorage.removeItem(STORAGE_KEY)
      return defaultProgress
    }
  } catch (e) {
    console.error('Failed to reset progress:', e)
  }
}

export { STREAK_MILESTONES, RANKS, calcMultiplier, detectMilestone }
