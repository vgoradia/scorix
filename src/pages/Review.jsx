import { useState } from 'react'
import { getDueMistakes, getSRSStats, markMistakeCorrect, saveMistake, getStats, saveStats } from '../utils/storage'
import { useNavigate } from 'react-router-dom'

export default function Review() {
  const navigate = useNavigate()
  const srsStats = getSRSStats()
  const [started, setStarted] = useState(false)
  const [mistakes, setMistakes] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [sessionResults, setSessionResults] = useState([])
  const [finished, setFinished] = useState(false)

  function startReview() {
    const due = getDueMistakes(10)
    setMistakes(due)
    setStarted(true)
  }

  function handleSubmit() {
    if (!selected) return
    setSubmitted(true)
    const current = mistakes[index]
    const isCorrect = selected === current.correct.charAt(0)

    setSessionResults(prev => [...prev, { ...current, isCorrect, selected }])

    // Update SRS
    if (isCorrect) {
      markMistakeCorrect(current.question)
    } else {
      saveMistake(current)
    }

    // Update stats
    const stats = getStats()
    stats.totalAnswered += 1
    stats.totalCorrect += isCorrect ? 1 : 0
    if (!stats.topicAccuracy[current.topic]) {
      stats.topicAccuracy[current.topic] = { correct: 0, total: 0 }
    }
    stats.topicAccuracy[current.topic].total += 1
    stats.topicAccuracy[current.topic].correct += isCorrect ? 1 : 0
    saveStats(stats)
  }

  function handleNext() {
    if (index + 1 >= mistakes.length) {
      setFinished(true)
      return
    }
    setIndex(prev => prev + 1)
    setSelected(null)
    setSubmitted(false)
  }

  if (!started) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Review</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Spaced repetition — the fastest way to fix your mistakes.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Due Today', value: srsStats.due, icon: '📅', color: srsStats.due > 0 ? 'var(--danger)' : 'var(--accent)' },
            { label: 'Active Mistakes', value: srsStats.total, icon: '❌', color: 'var(--warning)' },
            { label: 'Mastered', value: srsStats.retired, icon: '✅', color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
              boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              '❌ Get it wrong → review again tomorrow',
              '✓ Get it right once → review in 3 days',
              '✓✓ Get it right twice → review in 7 days',
              '✓✓✓ Get it right 3 times → mastered, retired',
            ].map((item, i) => (
              <p key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: '1.5' }}>{item}</p>
            ))}
          </div>
        </div>

        {srsStats.due === 0 ? (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', marginBottom: '24px',
          }}>
            <p style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>✅ You're all caught up!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No reviews due today. Come back tomorrow or keep practicing.</p>
          </div>
        ) : (
          <button onClick={startReview} style={{
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '16px 40px',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(108,99,255,0.3)', width: '100%',
          }}>
            Start Review — {srsStats.due} Questions Due →
          </button>
        )}

        <button onClick={() => navigate('/practice')} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          marginTop: '12px', width: '100%', textAlign: 'center',
        }}>Or go to Practice instead</button>
      </div>
    )
  }

  if (finished) {
    const correct = sessionResults.filter(r => r.isCorrect).length
    const pct = Math.round((correct / sessionResults.length) * 100)
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{pct >= 80 ? '🔥' : pct >= 60 ? '💪' : '📚'}</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{correct}/{sessionResults.length} Correct</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {pct >= 80 ? 'Excellent review session!' : pct >= 60 ? 'Good progress — keep going.' : 'These need more work — you\'ll see them again soon.'}
        </p>
        <div style={{
          background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
          marginBottom: '24px', textAlign: 'left',
        }}>
          {sessionResults.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '10px 0', borderBottom: i < sessionResults.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ flexShrink: 0 }}>{r.isCorrect ? '✅' : '❌'}</span>
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: '2px' }}>
                  {r.question.slice(0, 80)}...
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {r.topic} • {r.isCorrect ? 'Next review in 3+ days' : 'Review again tomorrow'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/')} style={{
            padding: '14px 32px', borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border)', background: 'white',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text)',
          }}>Back to Dashboard</button>
          <button onClick={() => navigate('/practice')} style={{
            padding: '14px 32px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--primary)', color: 'white',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
          }}>Practice More →</button>
        </div>
      </div>
    )
  }

  const current = mistakes[index]
  if (!current) return null

  const difficultyConfig = {
    easy: { label: '🟢 Easy', color: 'var(--accent)', bg: 'rgba(16,185,129,0.1)' },
    medium: { label: '🟡 Medium', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
    hard: { label: '🔴 Hard', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Spaced Review
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
            Question {index + 1} of {mistakes.length}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--danger)', background: 'rgba(239,68,68,0.08)',
            padding: '4px 10px', borderRadius: '100px',
          }}>
            ❌ {current.timesWrong}x wrong
          </span>
          <button onClick={() => navigate('/practice')} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'white',
            fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
          }}>Exit</button>
        </div>
      </div>

      <div style={{ background: 'var(--border)', borderRadius: '100px', height: '4px', marginBottom: '32px', overflow: 'hidden' }}>
        <div style={{
          width: `${(index / mistakes.length) * 100}%`, height: '100%',
          background: 'var(--danger)', borderRadius: '100px', transition: 'width 0.3s ease',
        }} />
      </div>

      {current.difficulty && difficultyConfig[current.difficulty] && (
        <div style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: '100px',
          fontSize: '0.75rem', fontWeight: 700, marginBottom: '16px',
          background: difficultyConfig[current.difficulty].bg,
          color: difficultyConfig[current.difficulty].color,
        }}>
          {difficultyConfig[current.difficulty].label}
        </div>
      )}

      {current.passage && (
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--radius-md)',
          padding: '20px 24px', marginBottom: '24px',
          borderLeft: '3px solid var(--danger)',
          fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text)',
        }}>{current.passage}</div>
      )}

      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)',
        padding: '28px', boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border)', marginBottom: '20px',
      }}>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', lineHeight: '1.6', marginBottom: '24px' }}>
          {current.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {current.choices.map((choice, i) => {
            const letter = choice.charAt(0)
            const isSelected = selected === letter
            const isCorrect = submitted && letter === current.correct.charAt(0)
            const isWrong = submitted && isSelected && !isCorrect
            return (
              <button key={i} onClick={() => !submitted && setSelected(letter)} style={{
                padding: '14px 18px', borderRadius: 'var(--radius-sm)',
                border: `2px solid ${isCorrect ? 'var(--accent)' : isWrong ? 'var(--danger)' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
                background: isCorrect ? 'rgba(16,185,129,0.08)' : isWrong ? 'rgba(239,68,68,0.08)' : isSelected ? 'rgba(108,99,255,0.06)' : 'white',
                textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                fontSize: '0.9rem', color: 'var(--text)',
                fontWeight: isSelected || isCorrect ? 600 : 400,
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {isCorrect && '✓ '}{isWrong && '✗ '}{choice}
              </button>
            )
          })}
        </div>
      </div>

      {!submitted ? (
        <button onClick={handleSubmit} disabled={!selected} style={{
          background: selected ? 'var(--primary)' : 'var(--border)',
          color: selected ? 'white' : 'var(--text-dim)',
          border: 'none', borderRadius: 'var(--radius-md)',
          padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700,
          cursor: selected ? 'pointer' : 'default', transition: 'all 0.15s',
        }}>Submit Answer</button>
      ) : (
        <div>
          <div style={{
            background: selected === current.correct.charAt(0) ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${selected === current.correct.charAt(0) ? 'var(--accent)' : 'var(--danger)'}`,
            borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '16px',
          }}>
            <p style={{ fontWeight: 700, color: selected === current.correct.charAt(0) ? 'var(--accent)' : 'var(--danger)' }}>
              {selected === current.correct.charAt(0) ? '✓ Correct!' : `✗ Incorrect — correct answer was ${current.correct}`}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {selected === current.correct.charAt(0)
                ? `Great — next review in 3 days.`
                : `You've gotten this wrong ${(current.timesWrong || 0) + 1} time${(current.timesWrong || 0) + 1 > 1 ? 's' : ''}. Review again tomorrow.`}
            </p>
          </div>
          <button onClick={handleNext} style={{
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '14px 36px',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
          }}>
            {index + 1 >= mistakes.length ? 'Finish Review →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}