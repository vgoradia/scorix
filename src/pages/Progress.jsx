import { getSessions, getStats, getStreak } from '../utils/storage'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const AUGUST_22 = new Date('2026-08-22')

function daysUntil(date) {
  const now = new Date()
  return Math.max(0, Math.ceil((date - now) / (1000 * 60 * 60 * 24)))
}

export default function Progress() {
  const sessions = getSessions()
  const stats = getStats()
  const streak = getStreak()
  const days = daysUntil(AUGUST_22)

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : null

  // Build chart data from sessions
  const chartData = sessions.map((s, i) => ({
    name: `Session ${i + 1}`,
    accuracy: s.accuracy,
    topic: s.topic,
  }))

  // Topic breakdown
  const topicRows = Object.entries(stats.topicAccuracy).map(([topic, data]) => ({
    topic,
    correct: data.correct,
    total: data.total,
    accuracy: Math.round((data.correct / data.total) * 100),
  })).sort((a, b) => a.accuracy - b.accuracy)

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Progress</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your journey to 1500.</p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Questions Answered', value: stats.totalAnswered, icon: '📝' },
          { label: 'Overall Accuracy', value: accuracy !== null ? `${accuracy}%` : '—', icon: '🎯' },
          { label: 'Current Streak', value: `${streak.count} days`, icon: '🔥' },
          { label: 'Days Until Test', value: days, icon: '📅' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Accuracy chart */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>Accuracy Over Time</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Your accuracy per practice session</p>

        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No sessions yet — complete a drill to see your progress chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Accuracy']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              />
              <Line
                type="monotone" dataKey="accuracy"
                stroke="#6c63ff" strokeWidth={2.5}
                dot={{ fill: '#6c63ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Topic breakdown */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>Topic Breakdown</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Sorted by weakest first</p>

        {topicRows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            No data yet — start practicing to see your topic breakdown.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topicRows.map(({ topic, correct, total, accuracy }) => {
              const color = accuracy < 60 ? '#ef4444' : accuracy < 75 ? '#f59e0b' : '#10b981'
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{topic}</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{correct}/{total} correct</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color, minWidth: '40px', textAlign: 'right' }}>{accuracy}%</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${accuracy}%`, height: '100%',
                      background: color, borderRadius: '100px', transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text)' }}>Session History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...sessions].reverse().map((s, i) => {
              const color = s.accuracy < 60 ? '#ef4444' : s.accuracy < 75 ? '#f59e0b' : '#10b981'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '1rem' }}>{s.accuracy >= 80 ? '🔥' : s.accuracy >= 60 ? '💪' : '📚'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{s.topic}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      {s.correct}/{s.total} correct
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color }}>{s.accuracy}%</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}