const CHALLENGE_POOL = [
  {
    id: 'accuracy_90',
    title: 'Sharpshooter',
    description: 'Get 90%+ accuracy in a game',
    icon: '🎯',
    check: (session) => {
      if (!session || !session.totalPossible) return false
      return (session.score / session.totalPossible) >= 0.9
    },
    target: 1,
  },
  {
    id: 'play_3',
    title: 'Game Time',
    description: 'Play 3 games today',
    icon: '🎮',
    check: () => true,
    target: 3,
    isCount: true,
  },
  {
    id: 'master_3',
    title: 'Letter Focus',
    description: 'Master 3 letters (reach level 5)',
    icon: '🔤',
    check: (session, stats) => {
      if (!session) return false
      const masteredBefore = Object.values(stats?.letterStatsBefore || {}).filter(l => l >= 5).length
      const masteredAfter = Object.values(stats?.letterStats || {}).filter(l => l >= 5).length
      return (masteredAfter - masteredBefore) >= 3
    },
    target: 1,
  },
  {
    id: 'streak_3',
    title: 'Streak Builder',
    description: 'Reach a 3-day streak',
    icon: '🔥',
    check: (session, stats) => (stats?.streak?.current || 0) >= 3,
    target: 1,
  },
  {
    id: 'score_500',
    title: 'Point Collector',
    description: 'Earn 500 total score today',
    icon: '💰',
    check: () => true,
    target: 500,
    isCount: true,
    valueFn: (session) => session?.score || 0,
  },
  {
    id: 'play_classify',
    title: 'Classifier',
    description: 'Play a Classify It! game',
    icon: '🔤',
    check: (session) => session?.gameType === 'classify',
    target: 1,
  },
  {
    id: 'play_read',
    title: 'Reader',
    description: 'Play a Read It! game',
    icon: '🔤',
    check: (session) => session?.gameType === 'read',
    target: 1,
  },
  {
    id: 'play_spell',
    title: 'Spell Caster',
    description: 'Play a Spell mode game',
    icon: '✍️',
    check: (session) => session?.gameType === 'spell',
    target: 1,
  },
  {
    id: 'play_listen',
    title: 'Active Listener',
    description: 'Play a Listen mode game',
    icon: '👂',
    check: (session) => session?.gameType === 'listen',
    target: 1,
  },
  {
    id: 'no_mistakes',
    title: 'Flawless Round',
    description: 'Complete a game with 100% accuracy',
    icon: '💯',
    check: (session) => {
      if (!session || !session.totalPossible) return false
      return session.score >= session.totalPossible
    },
    target: 1,
  },
]

const DAILY_CHALLENGE_COUNT = 3

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function seedFromDate(dateStr) {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickDailyChallenges(dateStr) {
  const seed = seedFromDate(dateStr)
  const shuffled = shuffle(
    CHALLENGE_POOL.map((c, i) => ({ ...c, sortKey: (seed + i * 7) % 1000 }))
  )
  shuffled.sort((a, b) => a.sortKey - b.sortKey)
  return shuffled.slice(0, DAILY_CHALLENGE_COUNT).map(({ sortKey, ...c }) => c)
}

export { CHALLENGE_POOL, pickDailyChallenges, DAILY_CHALLENGE_COUNT }
