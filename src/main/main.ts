import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { homedir } from 'os'
import { existsSync } from 'fs'

const isDev = process.env.NODE_ENV === 'development'
const DATA_DIR = join(app.getPath('userData'), 'hangul-data')
const DATA_FILE = join(DATA_DIR, 'progress.json')

interface GameSession {
  id: string
  date: string
  mode: 'timer' | 'freeplay'
  difficulty?: 'easy' | 'medium' | 'hard' | 'pro'
  score: number
  totalPossible: number
  completedLetters: number
  totalLetters: number
  letterResults: LetterResult[]
  completedAt: string
}

interface LetterResult {
  letter: string
  type: 'consonant' | 'vowel'
  romanization: string
  typeAnswer: string
  soundAnswer: string
  typeCorrect: boolean
  soundCorrect: boolean
  points: number
}

interface ProgressData {
  totalScore: number
  gamesPlayed: number
  lastPlayedDate: string
  streak: number
  letterMastery: Record<string, number>
  gameHistory: GameSession[]
}

const defaultProgress: ProgressData = {
  totalScore: 0,
  gamesPlayed: 0,
  lastPlayedDate: '',
  streak: 0,
  letterMastery: {},
  gameHistory: [],
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100]

function calcMultiplier(streak: number): number {
  return 1 + (streak || 0) * 0.05
}

function detectMilestone(newStreak: number, oldStreak: number): number | null {
  return STREAK_MILESTONES.find(m => newStreak >= m && (oldStreak || 0) < m) || null
}

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function loadProgress(): Promise<ProgressData> {
  await ensureDataDir()
  try {
    const data = await readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    return { ...defaultProgress, ...parsed }
  } catch {
    return defaultProgress
  }
}

async function saveProgress(progress: ProgressData): Promise<void> {
  await ensureDataDir()
  await writeFile(DATA_FILE, JSON.stringify(progress, null, 2), 'utf-8')
}

function calculateStreak(progress: ProgressData): number {
  const today = new Date().toISOString().split('T')[0]
  const lastPlayed = progress.lastPlayedDate
  
  if (lastPlayed === today) {
    return progress.streak
  }
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  if (lastPlayed === yesterdayStr) {
    return progress.streak + 1
  }
  
  return 1
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#121214',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: join(__dirname, '../../assets/icon.ico'),
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../index.html'))
  }

  win.on('closed', () => {
    // Window closed
  })

  return win
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('window:minimize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.minimize()
})

ipcMain.handle('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
    return win.isMaximized()
  }
  return false
})

ipcMain.handle('window:close', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.close()
})

ipcMain.handle('window:isMaximized', () => {
  const win = BrowserWindow.getFocusedWindow()
  return win?.isMaximized() ?? false
})

ipcMain.handle('progress:load', async () => {
  return await loadProgress()
})

ipcMain.handle('progress:save', async (_, session: GameSession) => {
  const progress = await loadProgress()
  
  const today = new Date().toISOString().split('T')[0]
  const oldStreak = progress.streak || 0
  const newStreak = calculateStreak(progress)
  const multiplier = calcMultiplier(oldStreak)
  const bonusPoints = Math.round(session.score * (multiplier - 1))
  
  // Update letter mastery
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
  
  const updatedProgress: ProgressData = {
    ...progress,
    totalScore: progress.totalScore + session.score + bonusPoints,
    gamesPlayed: progress.gamesPlayed + 1,
    lastPlayedDate: today,
    streak: newStreak,
    letterMastery: updatedMastery,
    gameHistory: [...progress.gameHistory, session].slice(-100), // Keep last 100 games
  }
  
  await saveProgress(updatedProgress)
  return {
    progress: updatedProgress,
    milestone: detectMilestone(newStreak, oldStreak),
    multiplier,
    bonusPoints,
  }
})

ipcMain.handle('progress:reset', async () => {
  await saveProgress(defaultProgress)
  return defaultProgress
})

ipcMain.handle('progress:updateLetterStat', async (_, letter: string, correct: boolean) => {
  const progress = await loadProgress()
  const updatedMastery = { ...progress.letterMastery }
  const current = updatedMastery[letter] || 0
  if (correct) {
    updatedMastery[letter] = Math.min(5, current + 1)
  } else {
    updatedMastery[letter] = Math.max(0, current - 1)
  }
  progress.letterMastery = updatedMastery
  await saveProgress(progress)
})

ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})