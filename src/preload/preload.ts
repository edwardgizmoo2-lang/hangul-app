import { contextBridge, ipcRenderer } from 'electron'

export interface LetterMastery {
  correct: number
  total: number
  consecutiveCorrect: number
  bestStreak: number
}

export interface ProgressData {
  totalScore: number
  gamesPlayed: number
  lastPlayedDate: string
  streak: number
  letterMastery: Record<string, number>
  gameHistory: GameSession[]
  achievements: string[]
  challengeProgress: Record<string, { progress: number; target: number; completed: boolean }>
  challengeDay: string
  dailyGoal: number
  streakFreezes: number
  lastLetterPractice: Record<string, string>
}

export interface GameSession {
  id: string
  date: string
  mode: 'timer' | 'freeplay'
  difficulty?: 'easy' | 'medium' | 'hard' | 'pro'
  gameType: string
  score: number
  totalPossible: number
  completedLetters: number
  totalLetters: number
  letterResults: {
    letter: string
    type: 'consonant' | 'vowel'
    romanization: string
    typeAnswer: string
    soundAnswer: string
    typeCorrect: boolean
    soundCorrect: boolean
    points: number
  }[]
  completedAt: string
  perfect?: boolean
}

contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  data: {
    getProgress: (): Promise<ProgressData> => ipcRenderer.invoke('progress:load'),
    saveGameSession: (session: GameSession): Promise<ProgressData> => ipcRenderer.invoke('progress:save', session),
    resetProgress: (): Promise<ProgressData> => ipcRenderer.invoke('progress:reset'),
    updateLetterStat: (letter: string, correct: boolean): Promise<void> =>
      ipcRenderer.invoke('progress:updateLetterStat', letter, correct),
    updateMeta: (meta: { achievements: string[]; challengeProgress: any; challengeDay: string }): Promise<void> =>
      ipcRenderer.invoke('progress:updateMeta', meta),
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  },
})