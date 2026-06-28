import { useState } from 'react'
import { getMistakes, clearAll } from '../utils/storage'

export default function Mistakes() {
  const [mistakes, setMistakes] = useState(getMistakes())
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const topics = [...new Set(mistakes.map(m => m.topic))]

  const filtered = filter === 'all' ? mistakes : mistakes.filter(m => m.topic === filter)
  const reversed = [...filtered].reverse()

  const difficultyConfig = {
    easy: { label: '🟢 Easy', color: '#10b981' },
    medium: { label: '🟡 Medium', color: '#f59e0b' },
    hard: { label: '🔴 Hard', color: '#ef4444' },
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Mistake Log</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} logged — review these to stop losing points
          </p>
        </div>
        {mistakes.length > 0 && (
          <button
            onClick={() => { if (confirm('Clear all mistakes?')) { clearAll(); setMistakes([]) } }}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'white',
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', cursor: 'pointer',
            }}
          >Clear All</button>
        )}
      </div>

      {mistakes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'white', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>No mistakes yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Start practicing and your wrong answers will show up here.</p>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 16px', borderRadius: '100px',
                border: `2px solid ${filter === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                background: filter === 'all' ? 'rgba(108,99,255,0.08)' : 'white',
                fontWeight: 600, fontSize: '0.8rem',
                color: filter === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >All ({mistakes.length})</button>
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: '6px 16px', borderRadius: '100px',
                  border: `2px solid ${filter === t ? 'var(--primary)' : 'var(--border)'}`,
                  background: filter === t ? 'rgba(108,99,255,0.08)' : 'white',
                  fontWeight: 600, fontSize: '0.8rem',
                  color: filter === t ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >{t} ({mistakes.filter(m => m.topic === t).length})</button>
            ))}
          </div>

          {/* Mistake cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reversed.map((m, i) => (
              <div key={m.id} style={{
                background: 'white', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                overflow: 'hidden',
              }}>
                <div
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '1rem' }}>❌</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)',
                          background: 'rgba(108,99,255,0.08)', padding: '2px 8px', borderRadius: '100px',
                        }}>{m.topic}</span>
                        {m.difficulty && difficultyConfig[m.difficulty] && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            color: difficultyConfig[m.difficulty].color,
                          }}>{difficultyConfig[m.difficulty].label}</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.85rem', color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '600px',
                      }}>{m.question}</p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', flexShrink: 0 }}>
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </div>

                {expanded === i && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                    {m.passage && (
                      <div style={{
                        background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px', margin: '16px 0',
                        borderLeft: '3px solid var(--primary)',
                        fontSize: '0.9rem', lineHeight: '1.6',
                      }}>{m.passage}</div>
                    )}
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: '16px 0 12px' }}>
                      {m.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {m.choices.map((choice, ci) => {
                        const letter = choice.charAt(0)
                        const isCorrect = letter === m.correct.charAt(0)
                        const isWrong = letter === m.selected
                        return (
                          <div key={ci} style={{
                            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--border)'}`,
                            background: isCorrect ? 'rgba(16,185,129,0.08)' : isWrong ? 'rgba(239,68,68,0.06)' : 'transparent',
                            fontSize: '0.88rem', color: 'var(--text)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            {isCorrect && <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>}
                            {isWrong && !isCorrect && <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span>}
                            {choice}
                            {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Correct answer</span>}
                            {isWrong && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Your answer</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}