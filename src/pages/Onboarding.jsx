import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SAT_DATES_2026 = [
  'August 22, 2026',
  'October 3, 2026',
  'November 7, 2026',
  'December 5, 2026',
]

const WEAK_AREAS = [
  { id: 'algebra', label: 'Algebra', section: 'Math' },
  { id: 'advanced-math', label: 'Advanced Math', section: 'Math' },
  { id: 'problem-solving', label: 'Problem Solving & Data', section: 'Math' },
  { id: 'geometry', label: 'Geometry & Trig', section: 'Math' },
  { id: 'information-ideas', label: 'Information & Ideas', section: 'R&W' },
  { id: 'craft-structure', label: 'Craft & Structure', section: 'R&W' },
  { id: 'expression-ideas', label: 'Expression of Ideas', section: 'R&W' },
  { id: 'english-conventions', label: 'Standard English Conventions', section: 'R&W' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    name: '',
    currentScore: '',
    targetScore: '',
    testDate: '',
    customDate: '',
    weakAreas: [],
  })

  function next() { setStep(s => s + 1) }
  function back() { setStep(s => s - 1) }

  function toggleWeak(id) {
    setData(prev => ({
      ...prev,
      weakAreas: prev.weakAreas.includes(id)
        ? prev.weakAreas.filter(w => w !== id)
        : [...prev.weakAreas, id]
    }))
  }

  function finish() {
    const profile = {
      name: data.name || 'Student',
      currentScore: parseInt(data.currentScore) || 1200,
      targetScore: parseInt(data.targetScore) || 1500,
      testDate: data.testDate === 'custom' ? data.customDate : data.testDate,
      weakAreas: data.weakAreas,
      setupDate: new Date().toISOString(),
    }
    localStorage.setItem('scorix_profile', JSON.stringify(profile))
    navigate('/')
  }

  const totalSteps = 5

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px' }}>
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#6c63ff"/>
          <path d="M8 20 Q12 8 16 16 Q20 24 24 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Scor<span style={{ color: 'var(--primary)' }}>ix</span>
        </span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{
            width: i + 1 === step ? '24px' : '8px', height: '8px',
            borderRadius: '100px',
            background: i + 1 <= step ? 'var(--primary)' : 'var(--border)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        padding: '48px', maxWidth: '520px', width: '100%',
      }}>

        {/* Step 1 — Name */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👋</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Welcome to Scorix</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Let's personalize your SAT prep. This takes 60 seconds.
            </p>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
              What's your name?
            </label>
            <input
              value={data.name}
              onChange={e => setData(d => ({ ...d, name: e.target.value }))}
              placeholder="Your first name"
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)',
                fontSize: '1rem', outline: 'none',
                transition: 'border 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onKeyDown={e => e.key === 'Enter' && data.name && next()}
            />
          </div>
        )}

        {/* Step 2 — Current score */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📊</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Your Current Score</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              What's your most recent SAT score or practice test score?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {['800', '900', '1000', '1100', '1200', '1240', '1300', '1400'].map(score => (
                <button
                  key={score}
                  onClick={() => setData(d => ({ ...d, currentScore: score }))}
                  style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${data.currentScore === score ? 'var(--primary)' : 'var(--border)'}`,
                    background: data.currentScore === score ? 'rgba(108,99,255,0.06)' : 'white',
                    fontWeight: 700, fontSize: '1rem',
                    color: data.currentScore === score ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{score}</button>
              ))}
            </div>
            <input
              value={data.currentScore}
              onChange={e => setData(d => ({ ...d, currentScore: e.target.value }))}
              placeholder="Or type your exact score"
              type="number"
              min="400" max="1600"
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)',
                fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Never taken it? Put 800 as a starting baseline.
            </p>
          </div>
        )}

        {/* Step 3 — Target score */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎯</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Your Target Score</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              What score do you need? Be ambitious — Scorix will get you there.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {['1300', '1350', '1400', '1450', '1500', '1550', '1600'].map(score => (
                <button
                  key={score}
                  onClick={() => setData(d => ({ ...d, targetScore: score }))}
                  style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${data.targetScore === score ? 'var(--primary)' : 'var(--border)'}`,
                    background: data.targetScore === score ? 'rgba(108,99,255,0.06)' : 'white',
                    fontWeight: 700, fontSize: '1rem',
                    color: data.targetScore === score ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {score}
                  {score === '1500' && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-secondary)', fontWeight: 500 }}>98th percentile</span>}
                  {score === '1600' && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-secondary)', fontWeight: 500 }}>Perfect score</span>}
                </button>
              ))}
            </div>
            <input
              value={data.targetScore}
              onChange={e => setData(d => ({ ...d, targetScore: e.target.value }))}
              placeholder="Or type your target"
              type="number" min="400" max="1600"
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)',
                fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#6c63ff'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {/* Step 4 — Test date */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📅</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Your Test Date</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              When are you taking the SAT? Scorix will count down the days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {SAT_DATES_2026.map(date => (
                <button
                  key={date}
                  onClick={() => setData(d => ({ ...d, testDate: date }))}
                  style={{
                    padding: '14px 18px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${data.testDate === date ? 'var(--primary)' : 'var(--border)'}`,
                    background: data.testDate === date ? 'rgba(108,99,255,0.06)' : 'white',
                    fontWeight: 600, fontSize: '0.95rem', textAlign: 'left',
                    color: data.testDate === date ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  {date}
                  {date === 'August 22, 2026' && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      background: 'rgba(108,99,255,0.1)', color: 'var(--primary)',
                      padding: '2px 8px', borderRadius: '100px',
                    }}>Next test</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setData(d => ({ ...d, testDate: 'custom' }))}
                style={{
                  padding: '14px 18px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${data.testDate === 'custom' ? 'var(--primary)' : 'var(--border)'}`,
                  background: data.testDate === 'custom' ? 'rgba(108,99,255,0.06)' : 'white',
                  fontWeight: 600, fontSize: '0.95rem', textAlign: 'left',
                  color: data.testDate === 'custom' ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >Different date →</button>
            </div>
            {data.testDate === 'custom' && (
              <input
                type="date"
                value={data.customDate}
                onChange={e => setData(d => ({ ...d, customDate: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--primary)',
                  fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        )}

        {/* Step 5 — Weak areas */}
        {step === 5 && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📚</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>Your Weak Areas</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Which topics feel hardest right now? Select all that apply. Scorix will prioritize these.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {WEAK_AREAS.map(area => (
                <button
                  key={area.id}
                  onClick={() => toggleWeak(area.id)}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${data.weakAreas.includes(area.id) ? 'var(--primary)' : 'var(--border)'}`,
                    background: data.weakAreas.includes(area.id) ? 'rgba(108,99,255,0.06)' : 'white',
                    fontWeight: 600, fontSize: '0.88rem', textAlign: 'left',
                    color: data.weakAreas.includes(area.id) ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  {area.label}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg)', padding: '2px 8px', borderRadius: '100px',
                  }}>{area.section}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '12px' }}>
              Not sure? Skip this — Scorix will figure it out from your practice data.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
          {step > 1 ? (
            <button onClick={back} style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', padding: '0',
            }}>← Back</button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              onClick={next}
              disabled={
                (step === 1 && !data.name) ||
                (step === 2 && !data.currentScore) ||
                (step === 3 && !data.targetScore) ||
                (step === 4 && !data.testDate && !data.customDate)
              }
              style={{
                background: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '14px 32px',
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                opacity: (step === 1 && !data.name) || (step === 2 && !data.currentScore) || (step === 3 && !data.targetScore) ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >Continue →</button>
          ) : (
            <button onClick={finish} style={{
              background: 'var(--primary)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '14px 32px',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
            }}>Let's Go 🚀</button>
          )}
        </div>
      </div>
    </div>
  )
}