import { isElectron, isNative } from './platform'
import ACHIEVEMENTS from '../data/achievements'
import { pickDailyChallenges } from '../data/challenges'

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

const FREEZE_MILESTONES = [7, 14, 30, 60, 100]

function detectFreezeMilestone(newStreak, oldStreak) {
  return FREEZE_MILESTONES.find(m => newStreak >= m && (oldStreak || 0) < m) || null
}

function applyStreakFreeze(progress, newStreak, oldStreak) {
  let finalStreak = newStreak
  let freezeConsumed = false
  if (newStreak === 1 && oldStreak > 1 && (progress.streakFreezes || 0) > 0) {
    finalStreak = oldStreak
    progress.streakFreezes = (progress.streakFreezes || 0) - 1
    freezeConsumed = true
  }
  return { finalStreak, freezeConsumed }
}

const DECAY_DAYS = 7
const DECAY_MAX_LOSS = 2

function applyLetterDecay(letterMastery, lastLetterPractice) {
  if (!lastLetterPractice) return letterMastery
  const today = new Date()
  const decayed = { ...letterMastery }
  Object.keys(decayed).forEach(key => {
    const lastDate = lastLetterPractice[key]
    if (!lastDate) return
    const daysSince = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24))
    if (daysSince >= DECAY_DAYS) {
      const loss = Math.min(DECAY_MAX_LOSS, Math.floor(daysSince / DECAY_DAYS))
      decayed[key] = Math.max(0, (decayed[key] || 0) - loss)
    }
  })
  return decayed
}

const defaultProgress = {
  totalScore: 0,
  gamesPlayed: 0,
  lastPlayedDate: '',
  streak: 0,
  letterMastery: {},
  gameHistory: [],
  dailyGoal: 100,
  achievements: [],
  challengeProgress: {},
  challengeDay: '',
  streakFreezes: 0,
  lastLetterPractice: {},
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
  let newStreak = calculateStreak(progress)
  const { finalStreak, freezeConsumed } = applyStreakFreeze(progress, newStreak, oldStreak)
  newStreak = finalStreak
  const multiplier = calcMultiplier(oldStreak)
  const bonusPoints = Math.round(session.score * (multiplier - 1))

  const updatedMastery = { ...progress.letterMastery }
  const updatedLastPractice = { ...(progress.lastLetterPractice || {}) }
  session.letterResults.forEach(result => {
    const key = result.letter
    if (key) updatedLastPractice[key] = today
    const current = updatedMastery[key] || 0
    if (result.typeCorrect && result.soundCorrect) {
      updatedMastery[key] = Math.min(5, current + 1)
    } else if (!result.typeCorrect && !result.soundCorrect) {
      updatedMastery[key] = Math.max(0, current - 1)
    }
  })

  const challengeProgress = getOrInitChallenges(progress)
  updateChallengeProgress(challengeProgress, session, progress)
  const achResult = checkNewAchievements({
    ...progress,
    totalScore: progress.totalScore + session.score + bonusPoints,
    gamesPlayed: progress.gamesPlayed + 1,
    letterMastery: updatedMastery,
    streak: newStreak,
  })

  const milestone = detectMilestone(newStreak, oldStreak)
  const freezeMilestone = detectFreezeMilestone(newStreak, oldStreak)
  if (freezeMilestone) {
    progress.streakFreezes = (progress.streakFreezes || 0) + 1
  }

  const updated = {
    ...progress,
    totalScore: progress.totalScore + session.score + bonusPoints,
    gamesPlayed: progress.gamesPlayed + 1,
    lastPlayedDate: today,
    streak: newStreak,
    letterMastery: updatedMastery,
    lastLetterPractice: updatedLastPractice,
    gameHistory: [...progress.gameHistory, session].slice(-100),
    achievements: achResult.achievements,
    challengeProgress,
    challengeDay: today,
  }

  await capacitorSave(updated)
  return {
    progress: updated,
    milestone,
    multiplier,
    bonusPoints,
    newlyUnlocked: achResult.newlyUnlocked,
    challengeProgress,
    freezeConsumed,
    freezeEarned: freezeMilestone || null,
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

// --- Achievements & Challenges ---

function checkNewAchievements(progress) {
  const stats = toStats(progress)
  const unlocked = new Set(progress.achievements || [])
  const newlyUnlocked = []
  ACHIEVEMENTS.forEach(a => {
    if (unlocked.has(a.id)) return
    if (a.check(stats)) {
      unlocked.add(a.id)
      newlyUnlocked.push(a)
    }
  })
  return { achievements: [...unlocked], newlyUnlocked }
}

function getOrInitChallenges(progress) {
  const today = new Date().toISOString().split('T')[0]
  if (progress.challengeDay === today && progress.challengeProgress && Object.keys(progress.challengeProgress).length > 0) {
    return { ...progress.challengeProgress }
  }
  const daily = pickDailyChallenges(today)
  const challengeProgress = {}
  daily.forEach(c => {
    challengeProgress[c.id] = {
      progress: 0,
      target: c.target,
      completed: false,
    }
  })
  return challengeProgress
}

function updateChallengeProgress(challengeProgress, session, progress) {
  const today = new Date().toISOString().split('T')[0]
  const daily = pickDailyChallenges(today)
  const stats = toStats(progress)
  const beforeMastery = { ...(progress.letterMastery || {}) }
  session.letterResults?.forEach(result => {
    const key = result.letter
    if (!key) return
    const current = beforeMastery[key] || 0
    if (result.typeCorrect && result.soundCorrect) {
      beforeMastery[key] = Math.max(0, current - 1)
    } else if (!result.typeCorrect && !result.soundCorrect) {
      beforeMastery[key] = Math.min(5, current + 1)
    }
  })
  const beforeStats = toStats({ ...progress, letterMastery: beforeMastery })
  Object.keys(challengeProgress).forEach(cid => {
    const cp = challengeProgress[cid]
    if (cp.completed) return
    const def = daily.find(d => d.id === cid)
    if (!def) return
    if (def.check(session, { letterStats: stats.letterStats, letterStatsBefore: beforeStats.letterStats, streak: stats.streak })) {
      cp.progress = Math.min(cp.target, cp.progress + 1)
    }
    if (cp.progress >= cp.target) {
      cp.completed = true
    }
  })
}

// --- Unified API ---

function toStats(progress) {
  const history = progress.gameHistory || []
  const today = new Date().toISOString().split('T')[0]
  const baseMastery = progress.letterMastery || {}
  const decayedMastery = applyLetterDecay(baseMastery, progress.lastLetterPractice || {})
  return {
    gameSessions: history,
    letterStats: decayedMastery,
    rawLetterStats: baseMastery,
    streak: {
      current: progress.streak || 0,
      longest: (() => {
        const uniqueDays = [...new Set(history.map(g => g.date))].sort()
        let longest = 0, run = 0
        for (let i = 0; i < uniqueDays.length; i++) {
          if (i === 0) { run = 1 }
          else {
            const prev = new Date(uniqueDays[i - 1])
            const curr = new Date(uniqueDays[i])
            const diff = (curr - prev) / (1000 * 60 * 60 * 24)
            run = diff === 1 ? run + 1 : 1
          }
          longest = Math.max(longest, run)
        }
        return longest
      })(),
      lastPlayDate: progress.lastPlayedDate || null,
    },
    totalScore: progress.totalScore || 0,
    totalGamesCompleted: progress.gamesPlayed || 0,
    todayScore: history
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.score || 0), 0),
    dailyGoal: progress.dailyGoal || 100,
    personalBests: {
      bestScore: Math.max(...(history.map(g => g.score || 0)), 0),
      bestAccuracy: Math.max(...(history.map(g =>
        g.totalPossible > 0 ? Math.round((g.score / g.totalPossible) * 100) : 0
      )), 0),
    },
    achievements: progress.achievements || [],
    challengeProgress: progress.challengeProgress || {},
    challengeDay: progress.challengeDay || '',
    streakFreezes: progress.streakFreezes || 0,
    lastLetterPractice: progress.lastLetterPractice || {},
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
      const result = await electronSave(session)
      const progress = result.progress
      const achResult = checkNewAchievements(progress)
      const challengeProgress = getOrInitChallenges(progress)
      updateChallengeProgress(challengeProgress, session, progress)
      const today = new Date().toISOString().split('T')[0]
      if (achResult.newlyUnlocked.length > 0 || challengeProgress !== progress.challengeProgress) {
        await window.electron.data.updateMeta({
          achievements: achResult.achievements,
          challengeProgress,
          challengeDay: today,
        })
      }
      return { ...result, newlyUnlocked: achResult.newlyUnlocked, challengeProgress }
    } else if (isNative()) {
      return await capacitorSaveSession(session)
    } else {
      // Web fallback
      const raw = localStorage.getItem(STORAGE_KEY)
      const progress = raw ? { ...defaultProgress, ...JSON.parse(raw) } : { ...defaultProgress }
      const today = new Date().toISOString().split('T')[0]
      const oldStreak = progress.streak || 0
      let newStreak = calculateStreak(progress)
      const { finalStreak, freezeConsumed } = applyStreakFreeze(progress, newStreak, oldStreak)
      newStreak = finalStreak
      const multiplier = calcMultiplier(oldStreak)
      const bonusPoints = Math.round(session.score * (multiplier - 1))
      const updatedMastery = { ...progress.letterMastery }
      const updatedLastPractice = { ...(progress.lastLetterPractice || {}) }
      session.letterResults.forEach(result => {
        const key = result.letter
        if (key) updatedLastPractice[key] = today
        const current = updatedMastery[key] || 0
        if (result.typeCorrect && result.soundCorrect) {
          updatedMastery[key] = Math.min(5, current + 1)
        } else if (!result.typeCorrect && !result.soundCorrect) {
          updatedMastery[key] = Math.max(0, current - 1)
        }
      })
      const challengeProgress = getOrInitChallenges(progress)
      updateChallengeProgress(challengeProgress, session, progress)
      const achResult = checkNewAchievements({
        ...progress,
        totalScore: progress.totalScore + session.score + bonusPoints,
        gamesPlayed: progress.gamesPlayed + 1,
        letterMastery: updatedMastery,
        streak: newStreak,
      })
      const milestone = detectMilestone(newStreak, oldStreak)
      const freezeMilestone = detectFreezeMilestone(newStreak, oldStreak)
      if (freezeMilestone) {
        progress.streakFreezes = (progress.streakFreezes || 0) + 1
      }
      const updated = {
        ...progress,
        totalScore: progress.totalScore + session.score + bonusPoints,
        gamesPlayed: progress.gamesPlayed + 1,
        lastPlayedDate: today,
        streak: newStreak,
        letterMastery: updatedMastery,
        lastLetterPractice: updatedLastPractice,
        gameHistory: [...progress.gameHistory, session].slice(-100),
        achievements: achResult.achievements,
        challengeProgress,
        challengeDay: today,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return {
        progress: updated,
        milestone,
        multiplier,
        bonusPoints,
        newlyUnlocked: achResult.newlyUnlocked,
        challengeProgress,
        freezeConsumed,
        freezeEarned: freezeMilestone || null,
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
