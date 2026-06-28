import { useNavigate } from 'react-router-dom'
import { getStats, getStreak, getSessions } from '../utils/storage'

const AUGUST_22 = new Date('2026-08-22')

function daysUntil(date) {
  const now = new Date()
  const diff = date - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const ALL_TOPICS = [
  { topic: 'Advanced Math', section: 'Math' },
  { topic: 'Problem Solving & Data', section: 'Math' },
  { topic: 'Craft & Structure', section: 'R&W' },
  { topic: 'Algebra', section: 'Math' },
  { topic: 'Standard English Conventions', section: 'R&W' },
  { topic: 'Geometry & Trig', section: 'Math' },
  { topic: 'Information & Ideas', section: 'R&W' },
  { topic: 'Expression of Ideas', section: 'R&W' },
]

const TOPIC_MAP = {
  'algebra': 'Algebra',
  'advanced-math': 'Advanced Math',
  'problem-solving': 'Problem Solving & Data',
  'geometry': 'Geometry & Trig',
  'information-ideas': 'Information & Ideas',
  'craft-structure': 'Craft & Structure',
  'expression-ideas': 'Expression of Ideas',
  'english-conventions': 'Standard English Conventions',
}

const TIME_MAP = {
  'Algebra': '~20 min', 'Advanced Math': '~30 min',
  'Problem Solving & Data': '~15 min', 'Geometry & Trig': '~20 min',
  'Information & Ideas': '~20 min', 'Craft & Structure': '~20 min',
  'Expression of Ideas': '~15 min', 'Standard English Conventions': '~15 min',
}

function getTopicColor(accuracy) {
  if (accuracy === null) return '#94a3b8'
  if (accuracy < 60) return '#ef4444'
  if (accuracy < 75) return '#f59e0b'
  return '#10b981'
}

function getFocusToday(topicAccuracy, weakAreas) {
  let worst = null
  let worstAcc = 101
  for (const [topic, data] of Object.entries(topicAccuracy)) {
    const acc = Math.round((data.correct / data.total) * 100)
    if (acc < worstAcc) { worstAcc = acc; worst = topic }
  }
  if (worst) return worst
  if (weakAreas && weakAreas.length > 0) return TOPIC_MAP[weakAreas[0]] || 'Advanced Math'
  return 'Advanced Math'
}

function getStudyPlan(topicAccuracy, weakAreas) {
  const plan = []
  const used = new Set()

  const practiced = Object.entries(topicAccuracy)
    .map(([topic, data]) => ({ topic, acc: Math.round((data.correct / data.total) * 100) }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 2)

  for (const { topic } of practiced) {
    if (!used.has(topic)) {
      used.add(topic)
      plan.push({
        task: `${topic} Drill`,
        desc: `20 questions • ${TIME_MAP[topic] || '~20 min'}`,
        priority: 'high',
      })
    }
  }

  for (const id of (weakAreas || [])) {
    if (plan.length >= 3) break
    const topic = TOPIC_MAP[id]
    if (topic && !used.has(topic)) {
      used.add(topic)
      plan.push({
        task: `${topic} Drill`,
        desc: `20 questions • ${TIME_MAP[topic] || '~20 min'}`,
        priority: 'high',
      })
    }
  }

  plan.push({ task: 'Review Mistake Log', desc: 'Review your errors', priority: 'medium' })
  return plan.slice(0, 4)
}

export default function Dashboard({ profile }) {
  const navigate = useNavigate()
  const stats = getStats()
  const streak = getStreak()
  const sessions = getSessions()

  const name = profile?.name || 'there'
  const currentScore = profile?.currentScore || 1240
  const targetScore = profile?.targetScore || 1500
  const testDate = profile?.testDate ? new Date(profile.testDate) : AUGUST_22
  const days = daysUntil(testDate)
  const progress = ((currentScore - 400) / (1600 - 400)) * 100

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : null

  const focusTopic = getFocusToday(stats.topicAccuracy, profile?.weakAreas)
  const studyPlan = getStudyPlan(stats.topicAccuracy, profile?.weakAreas)

  const topicData = ALL_TOPICS.map(({ topic, section }) => {
    const data = stats.topicAccuracy[topic]
    const acc = data ? Math.round((data.correct / data.total) * 100) : null
    const isWeak = (profile?.weakAreas || []).some(w => TOPIC_MAP[w] === topic)
    return { topic, section, accuracy: acc, isWeak }
  }).sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) {
      if (a.isWeak && !b.isWeak) return -1
      if (!a.isWeak && b.isWeak) return 1
      return 0
    }
    if (a.accuracy === null) return b.isWeak ? 1 : -1
    if (b.accuracy === null) return a.isWeak ? -1 : 1
    return a.accuracy - b.accuracy
  })

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>

      {/* Streak banner */}
      {streak.count > 1 && (
        <div style={{
          background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
          borderRadius: 'var(--radius-md)', padding: '12px 20px',
          marginBottom: '20px', display: 'flex', alignItems: 'center',
          gap: '12px', color: 'white',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🔥</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{streak.count} day streak! </span>
            <span style={{ opacity: 0.85, fontSize: '0.88rem' }}>You practiced yesterday — keep the momentum going.</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
          Welcome back, {name} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {days} days until {profile?.testDate || 'August 22'}. Let's get that {targetScore}.
        </p>
      </div>

      {/* Score + Countdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Current Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text)' }}>{currentScore}</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-dim)' }}>/ 1600</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Target</p>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{targetScore}</span>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ background: 'var(--bg)', borderRadius: '100px', height: '12px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                borderRadius: '100px', transition: 'width 1s ease',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>400</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>+{targetScore - currentScore} points to go</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>1600</span>
          </div>
          <button
            onClick={() => {
              const newScore = prompt(`Update your current score (current: ${currentScore}):`)
              if (newScore && !isNaN(newScore) && newScore >= 400 && newScore <= 1600) {
                const p = JSON.parse(localStorage.getItem('scorix_profile') || '{}')
                p.currentScore = parseInt(newScore)
                localStorage.setItem('scorix_profile', JSON.stringify(p))
                window.location.reload()
              }
            }}
            style={{
              marginTop: '16px', background: 'none',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--text-secondary)', cursor: 'pointer', width: '100%',
            }}
          >Update Score</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          boxShadow: 'var(--shadow-md)', color: 'white',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Test Day Countdown</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>{days}</span>
              <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>days</span>
            </div>
            <p style={{ opacity: 0.7, marginTop: '8px', fontSize: '0.9rem' }}>{profile?.testDate || 'August 22, 2026'}</p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)',
            padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500,
          }}>
            💡 Focus today: {focusTopic}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Questions Answered', value: stats.totalAnswered.toString(), icon: '📝' },
          { label: 'Accuracy Rate', value: accuracy !== null ? `${accuracy}%` : '—', icon: '🎯' },
          { label: 'Day Streak', value: streak.count.toString(), icon: '🔥' },
          { label: 'Sessions Done', value: sessions.length.toString(), icon: '📋' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>Topic Accuracy</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Based on your practice sessions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topicData.map(({ topic, section, accuracy, isWeak }) => (
              <div key={topic}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{topic}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '2px 6px', borderRadius: '100px' }}>{section}</span>
                    {isWeak && accuracy === null && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 6px', borderRadius: '100px' }}>weak</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getTopicColor(accuracy) }}>
                    {accuracy !== null ? `${accuracy}%` : 'Not practiced'}
                  </span>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${accuracy || 0}%`, height: '100%',
                    background: getTopicColor(accuracy), borderRadius: '100px', transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>Today's Study Plan</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {studyPlan.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${item.priority === 'high' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: item.priority === 'high' ? 'var(--danger)' : 'var(--warning)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{item.task}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <button onClick={() => navigate('/practice')} style={{
                  background: 'var(--primary)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}>Start</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}