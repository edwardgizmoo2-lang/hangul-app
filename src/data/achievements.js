const ACHIEVEMENTS = [
  {
    id: 'first_game',
    title: 'First Steps',
    description: 'Complete your first game',
    icon: '🎯',
    check: (stats) => stats.totalGamesCompleted >= 1,
  },
  {
    id: 'ten_games',
    title: 'Dedicated Learner',
    description: 'Play 10 games',
    icon: '📚',
    check: (stats) => stats.totalGamesCompleted >= 10,
  },
  {
    id: 'fifty_games',
    title: 'Hangul Veteran',
    description: 'Play 50 games',
    icon: '🎖️',
    check: (stats) => stats.totalGamesCompleted >= 50,
  },
  {
    id: 'hundred_games',
    title: 'Hangul Master',
    description: 'Play 100 games',
    icon: '👑',
    check: (stats) => stats.totalGamesCompleted >= 100,
  },
  {
    id: 'streak_7',
    title: 'On a Roll',
    description: 'Reach a 7-day streak',
    icon: '🔥',
    check: (stats) => (stats.streak?.current || 0) >= 7 || (stats.streak?.longest || 0) >= 7,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak',
    icon: '⚡',
    check: (stats) => (stats.streak?.current || 0) >= 30 || (stats.streak?.longest || 0) >= 30,
  },
  {
    id: 'streak_100',
    title: 'Hangul Legend',
    description: 'Reach a 100-day streak',
    icon: '🏆',
    check: (stats) => (stats.streak?.current || 0) >= 100 || (stats.streak?.longest || 0) >= 100,
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Get 100% accuracy on a game',
    icon: '💯',
    check: (stats) => (stats.personalBests?.bestAccuracy || 0) >= 100,
  },
  {
    id: 'master_10',
    title: 'Letter Collector',
    description: 'Master 10 letters (level 5)',
    icon: '🔤',
    check: (stats) => Object.values(stats.letterStats || {}).filter(l => l >= 5).length >= 10,
  },
  {
    id: 'master_30',
    title: 'Knowledge Seeker',
    description: 'Master 30 letters',
    icon: '🌟',
    check: (stats) => Object.values(stats.letterStats || {}).filter(l => l >= 5).length >= 30,
  },
  {
    id: 'master_all',
    title: 'Hangul Scholar',
    description: 'Master all 40 letters',
    icon: '🎓',
    check: (stats) => Object.values(stats.letterStats || {}).filter(l => l >= 5).length >= 40,
  },
  {
    id: 'score_1000',
    title: 'Score Fiend',
    description: 'Reach 1000 total score',
    icon: '💰',
    check: (stats) => (stats.totalScore || 0) >= 1000,
  },
  {
    id: 'score_5000',
    title: 'High Roller',
    description: 'Reach 5000 total score',
    icon: '💎',
    check: (stats) => (stats.totalScore || 0) >= 5000,
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Play every day for 7 days',
    icon: '📅',
    check: (stats) => (stats.streak?.longest || 0) >= 7,
  },
  {
    id: 'all_modes',
    title: 'Well Rounded',
    description: 'Complete a game in all 3 modes',
    icon: '🎮',
    check: (stats) => {
      const modes = new Set((stats.gameSessions || []).map(s => s.gameType).filter(Boolean))
      return modes.size >= 3
    },
  },
]

export default ACHIEVEMENTS
