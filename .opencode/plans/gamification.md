# Hangul App — Gamification Plan

## Fixes (do first)

1. **SpellGame** — Split "Clear" into "Undo" (remove last tile) + "Clear All"
   - File: `src/components/SpellGame.jsx`

2. **"Made by Edward"** — Add `!gameInProgress` condition in `App.jsx:120`
   - File: `src/App.jsx`

3. **Progress Tab heading centering** — The "Progress" title is left-aligned via `flex items-center justify-between`. On Android it's off-center. Center the heading text or stack on narrow screens.
   - File: `src/components/ProgressTab.jsx` lines 120-133

## Phase 1 — Quick Wins
- **Streak target** — progress bar toward milestone (7/14/30/60/100d)
- **Loss aversion** — banner if `lastPlayedDate !== today`
- **Personal bests** — best score/accuracy/streak per mode
- **Grid view polish** — trend arrows, mode-specific accuracy

## Phase 2 — Gamification Layer
- **Score multiplier** — `1 + streak * 0.05`
- **Streak milestone celebration** — confetti/toast
- **Weekly recap** — this week vs last week comparison
- **Ranks/titles** — Bronze→Silver→Gold→Platinum→Diamond

## Phase 3 — Data Exploration
- **Streak calendar** — GitHub-style contribution grid
- **Daily goal** — user-set daily score target
- **History browser** — scrollable session table
- **Accuracy per letter mode** — extend letterResults with mode

## Phase 4 — Achievements System
- **Achievements/badges** — ~15 badges with detection + collection view
- **Personal challenges** — auto-generated after sessions

## Phase 5 — Advanced
- **Trend graphs** — line charts for score/accuracy/streak
- **Letter decay** — level -1 after 7d no practice
- **Mastery decay** — same for overall categories
- **Streak freeze item** — earn per 10 games, consume on miss
