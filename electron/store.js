const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const STORE_PATH = path.join(app.getPath('userData'), 'hangul-data.json')

const defaultData = {
  gameSessions: [],
  letterStats: {},
  streak: {
    current: 0,
    longest: 0,
    lastPlayDate: null,
  },
  totalScore: 0,
  totalGamesCompleted: 0,
}

function readStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Error reading store:', e)
  }
  return JSON.parse(JSON.stringify(defaultData))
}

function writeStore(data) {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error writing store:', e)
  }
}

function getStats() {
  return readStore()
}

function saveGameSession(session) {
  const data = readStore()
  const today = new Date().toISOString().split('T')[0]
  
  data.gameSessions.push({
    ...session,
    date: today,
    timestamp: Date.now(),
  })
  
  data.totalScore += session.score
  data.totalGamesCompleted += 1
  
  if (data.streak.lastPlayDate === today) {
    // already played today
  } else if (data.streak.lastPlayDate === getYesterday(today)) {
    data.streak.current += 1
  } else {
    data.streak.current = 1
  }
  
  if (data.streak.current > data.streak.longest) {
    data.streak.longest = data.streak.current
  }
  
  data.streak.lastPlayDate = today
  
  if (session.letterResults) {
    session.letterResults.forEach(result => {
      const key = result.letter
      if (!data.letterStats[key]) {
        data.letterStats[key] = {
          correct: 0,
          total: 0,
          consecutiveCorrect: 0,
          bestStreak: 0,
        }
      }
      data.letterStats[key].total += 1
      if (result.typeCorrect && result.soundCorrect) {
        data.letterStats[key].correct += 1
        data.letterStats[key].consecutiveCorrect += 1
        if (data.letterStats[key].consecutiveCorrect > data.letterStats[key].bestStreak) {
          data.letterStats[key].bestStreak = data.letterStats[key].consecutiveCorrect
        }
      } else {
        data.letterStats[key].consecutiveCorrect = 0
      }
    })
  }
  
  writeStore(data)
  return data
}

function resetStats() {
  writeStore(defaultData)
  return getStats()
}

function getYesterday(dateStr) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

module.exports = { getStats, saveGameSession, resetStats }