const KEYS = {
  stats: 'scorix_stats',
  mistakes: 'scorix_mistakes',
  sessions: 'scorix_sessions',
  streak: 'scorix_streak',
  srs: 'scorix_srs',
}

export function getStats() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.stats)) || {
      totalAnswered: 0,
      totalCorrect: 0,
      topicAccuracy: {},
    }
  } catch { return { totalAnswered: 0, totalCorrect: 0, topicAccuracy: {} } }
}

export function saveStats(stats) {
  localStorage.setItem(KEYS.stats, JSON.stringify(stats))
}

export function getMistakes() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.mistakes)) || []
  } catch { return [] }
}

export function saveMistake(mistake) {
  const mistakes = getMistakes()
  const existing = mistakes.findIndex(m => m.question === mistake.question)
  if (existing >= 0) {
    mistakes[existing].timesWrong = (mistakes[existing].timesWrong || 1) + 1
    mistakes[existing].lastSeen = new Date().toISOString()
    mistakes[existing].nextReview = getNextReview(mistakes[existing].timesWrong)
  } else {
    mistakes.push({
      ...mistake,
      id: Date.now(),
      date: new Date().toISOString(),
      timesWrong: 1,
      timesCorrectAfter: 0,
      nextReview: getNextReview(1),
      lastSeen: new Date().toISOString(),
    })
  }
  localStorage.setItem(KEYS.mistakes, JSON.stringify(mistakes.slice(-500)))
}

export function markMistakeCorrect(questionText) {
  const mistakes = getMistakes()
  const idx = mistakes.findIndex(m => m.question === questionText)
  if (idx >= 0) {
    mistakes[idx].timesCorrectAfter = (mistakes[idx].timesCorrectAfter || 0) + 1
    mistakes[idx].lastSeen = new Date().toISOString()
    // After 3 correct in a row, retire it
    if (mistakes[idx].timesCorrectAfter >= 3) {
      mistakes[idx].retired = true
    } else {
      mistakes[idx].nextReview = getNextReview(0, mistakes[idx].timesCorrectAfter)
    }
    localStorage.setItem(KEYS.mistakes, JSON.stringify(mistakes))
  }
}

// Spaced repetition intervals in days
function getNextReview(timesWrong, timesCorrect = 0) {
  if (timesCorrect === 0) {
    // Wrong: review soon
    if (timesWrong === 1) return daysFromNow(1)
    if (timesWrong === 2) return daysFromNow(1)
    return daysFromNow(2)
  }
  // Getting it right: push further out
  if (timesCorrect === 1) return daysFromNow(3)
  if (timesCorrect === 2) return daysFromNow(7)
  return daysFromNow(14)
}

function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// Get mistakes due for review today
export function getDueMistakes(limit = 5) {
  const mistakes = getMistakes()
  const now = new Date()
  return mistakes
    .filter(m => !m.retired && m.nextReview && new Date(m.nextReview) <= now)
    .sort((a, b) => {
      // Prioritize most wrong first
      if (b.timesWrong !== a.timesWrong) return b.timesWrong - a.timesWrong
      return new Date(a.nextReview) - new Date(b.nextReview)
    })
    .slice(0, limit)
}

export function getSRSStats() {
  const mistakes = getMistakes()
  const now = new Date()
  return {
    total: mistakes.filter(m => !m.retired).length,
    due: mistakes.filter(m => !m.retired && m.nextReview && new Date(m.nextReview) <= now).length,
    retired: mistakes.filter(m => m.retired).length,
  }
}

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.sessions)) || []
  } catch { return [] }
}

export function saveSession(session) {
  const sessions = getSessions()
  sessions.push({ ...session, date: new Date().toISOString() })
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions.slice(-100)))
}

export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.streak)) || { count: 0, lastDate: null }
  } catch { return { count: 0, lastDate: null } }
}

export function updateStreak() {
  const streak = getStreak()
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (streak.lastDate === today) return streak
  if (streak.lastDate === yesterday) {
    const updated = { count: streak.count + 1, lastDate: today }
    localStorage.setItem(KEYS.streak, JSON.stringify(updated))
    return updated
  }
  const reset = { count: 1, lastDate: today }
  localStorage.setItem(KEYS.streak, JSON.stringify(reset))
  return reset
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}