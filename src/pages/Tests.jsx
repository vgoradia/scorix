import { useState, useEffect } from 'react'
import { saveMistake, saveStats, getStats } from '../utils/storage'

const TESTS = [
  { id: 1, name: 'Test 1 — Diagnostic', week: 'Week 1', desc: 'Establish your baseline score across all topics', unlocked: true },
  { id: 2, name: 'Test 2', week: 'Week 2', desc: 'Focus on Algebra and Reading Comprehension', unlocked: true },
  { id: 3, name: 'Test 3', week: 'Week 3', desc: 'Advanced Math and Craft & Structure', unlocked: true },
  { id: 4, name: 'Test 4', week: 'Week 4', desc: 'Problem Solving and Expression of Ideas', unlocked: true },
  { id: 5, name: 'Test 5', week: 'Week 5', desc: 'Mixed difficulty — all topics', unlocked: true },
  { id: 6, name: 'Test 6', week: 'Week 6', desc: 'Hard module simulation', unlocked: true },
  { id: 7, name: 'Test 7', week: 'Week 7', desc: 'Full adaptive test — hardest questions', unlocked: true },
  { id: 8, name: 'Test 8 — Final Simulation', week: 'Week 8', desc: 'Final dress rehearsal before August 22', unlocked: true },
]

const MODULES = [
  { id: 'rw1', label: 'Reading & Writing — Module 1', questions: 27, minutes: 32, section: 'rw', module: 1 },
  { id: 'rw2', label: 'Reading & Writing — Module 2', questions: 27, minutes: 32, section: 'rw', module: 2 },
  { id: 'math1', label: 'Math — Module 1', questions: 22, minutes: 35, section: 'math', module: 1 },
  { id: 'math2', label: 'Math — Module 2', questions: 22, minutes: 35, section: 'math', module: 2 },
]

// Estimate SAT section score from accuracy
function estimateSectionScore(correct, total, section) {
  if (total === 0) return 200
  const acc = correct / total
  if (section === 'rw') return Math.round(200 + acc * 600)
  return Math.round(200 + acc * 600)
}

export default function Tests() {
  const [selectedTest, setSelectedTest] = useState(null)
  const [activeModule, setActiveModule] = useState(null)
  const [moduleResults, setModuleResults] = useState({})
  const [showBreak, setShowBreak] = useState(false)
  const [showScoreReport, setShowScoreReport] = useState(false)

  function handleModuleComplete(moduleId, results) {
    const updated = { ...moduleResults, [moduleId]: results }
    setModuleResults(updated)
    setActiveModule(null)

    // After RW2 done, show break before math
    if (moduleId === 'rw2') {
      setShowBreak(true)
    }

    // After Math2, show full score report
    if (moduleId === 'math2') {
      setShowScoreReport(true)
    }
  }

  if (showScoreReport) {
    const rwCorrect = (moduleResults['rw1']?.filter(r => r.isCorrect).length || 0) +
      (moduleResults['rw2']?.filter(r => r.isCorrect).length || 0)
    const rwTotal = (moduleResults['rw1']?.length || 0) + (moduleResults['rw2']?.length || 0)
    const mathCorrect = (moduleResults['math1']?.filter(r => r.isCorrect).length || 0) +
      (moduleResults['math2']?.filter(r => r.isCorrect).length || 0)
    const mathTotal = (moduleResults['math1']?.length || 0) + (moduleResults['math2']?.length || 0)

    const rwScore = estimateSectionScore(rwCorrect, rwTotal, 'rw')
    const mathScore = estimateSectionScore(mathCorrect, mathTotal, 'math')
    const totalScore = rwScore + mathScore

    const allResults = [
      ...(moduleResults['rw1'] || []),
      ...(moduleResults['rw2'] || []),
      ...(moduleResults['math1'] || []),
      ...(moduleResults['math2'] || []),
    ]
    const wrongResults = allResults.filter(r => !r.isCorrect)

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
            {totalScore >= 1400 ? '🔥' : totalScore >= 1200 ? '💪' : '📚'}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>{selectedTest.name} — Score Report</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Here's how you did.</p>
        </div>

        {/* Total score */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          borderRadius: 'var(--radius-xl)', padding: '32px', color: 'white',
          textAlign: 'center', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(108,99,255,0.3)',
        }}>
          <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated Total Score</p>
          <p style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>{totalScore}</p>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>out of 1600</p>
        </div>

        {/* Section scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Reading & Writing', score: rwScore, correct: rwCorrect, total: rwTotal, icon: '📖', color: '#6c63ff' },
            { label: 'Math', score: mathScore, correct: mathCorrect, total: mathTotal, icon: '📐', color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
              boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.score}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.correct}/{s.total} correct ({Math.round(s.correct / Math.max(s.total, 1) * 100)}%)</p>
            </div>
          ))}
        </div>

        {/* Wrong answers */}
        {wrongResults.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', marginBottom: '24px',
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>Questions to Review</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              These have been added to your Mistake Log and spaced review queue.
            </p>
            {wrongResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 0', borderBottom: i < wrongResults.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span>❌</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: '2px' }}>
                    {r.question?.slice(0, 100)}...
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {r.topic || 'Unknown topic'} • You answered {r.selected}, correct was {r.correct}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => {
            setShowScoreReport(false)
            setModuleResults({})
            setSelectedTest(null)
          }} style={{
            padding: '14px 32px', borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border)', background: 'white',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text)',
          }}>Back to Tests</button>
          <button onClick={() => {
            const newScore = prompt(`Based on this test, update your current score to ${totalScore}?`)
            if (newScore !== null) {
              const p = JSON.parse(localStorage.getItem('scorix_profile') || '{}')
              p.currentScore = totalScore
              localStorage.setItem('scorix_profile', JSON.stringify(p))
              window.location.reload()
            }
          }} style={{
            padding: '14px 32px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--primary)', color: 'white',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
          }}>Update My Score to {totalScore} →</button>
        </div>
      </div>
    )
  }

  if (showBreak) {
    return <BreakTimer onDone={() => setShowBreak(false)} />
  }

  if (activeModule) {
    return (
      <TestModule
        test={selectedTest}
        module={activeModule}
        onExit={() => setActiveModule(null)}
        onComplete={handleModuleComplete}
      />
    )
  }

  if (selectedTest) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
        <button onClick={() => setSelectedTest(null)} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '0.9rem', cursor: 'pointer', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600,
        }}>← Back to Tests</button>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>{selectedTest.name}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{selectedTest.desc}</p>

        <div style={{
          background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '32px',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>📋 Full Test Format</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            2 hours 14 minutes total • 98 questions • 10 min break between sections
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MODULES.map((mod, i) => {
            const isDone = !!moduleResults[mod.id]
            return (
              <div key={mod.id} style={{
                background: 'white', borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)', border: `1px solid ${isDone ? '#10b981' : 'var(--border)'}`,
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: isDone ? 0.8 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                    background: isDone ? 'rgba(16,185,129,0.1)' : mod.section === 'rw' ? 'rgba(108,99,255,0.1)' : 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>
                    {isDone ? '✅' : mod.section === 'rw' ? '📖' : '📐'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '2px' }}>{mod.label}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {isDone
                        ? `${moduleResults[mod.id].filter(r => r.isCorrect).length}/${moduleResults[mod.id].length} correct`
                        : `${mod.questions} questions • ${mod.minutes} minutes`}
                    </p>
                  </div>
                </div>
                {i === 2 && !moduleResults['rw2'] && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginRight: '16px' }}>
                    ⏸ 10 min break after RW ↑
                  </div>
                )}
                <button
                  onClick={() => setActiveModule(mod)}
                  style={{
                    background: isDone ? 'var(--bg)' : 'var(--primary)',
                    color: isDone ? 'var(--text-secondary)' : 'white',
                    border: isDone ? '1px solid var(--border)' : 'none',
                    borderRadius: 'var(--radius-sm)', padding: '10px 20px',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >{isDone ? 'Redo' : 'Start →'}</button>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: '24px', padding: '16px 20px',
          background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            💡 <strong>Tip:</strong> Complete all 4 modules in order to get your full score report. A 10-minute break timer will appear between Reading/Writing and Math.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Practice Tests</h1>
        <p style={{ color: 'var(--text-secondary)' }}>8 full-length tests — one per week until August 22. Take them in order.</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: '32px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '4px' }}>Real SAT Format</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>98 questions • 2 hrs 14 min • Adaptive modules</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '4px' }}>August 22, 2026</p>
          <p style={{ fontWeight: 800, fontSize: '1.5rem' }}>0/8 Complete</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {TESTS.map((test) => (
          <div key={test.id} style={{
            background: 'white', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(108,99,255,0.08)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800,
              color: 'var(--primary)', flexShrink: 0,
            }}>{test.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{test.name}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '100px' }}>{test.week}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{test.desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>98 Q • 2h 14m</span>
              <button onClick={() => setSelectedTest(test)} style={{
                background: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '10px 20px',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              }}>Begin →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BreakTimer({ onDone }) {
  const [timeLeft, setTimeLeft] = useState(600)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (skipped) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); onDone(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [skipped])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct = ((600 - timeLeft) / 600) * 100

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px',
      background: 'var(--bg)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '24px' }}>☕</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>10-Minute Break</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', textAlign: 'center' }}>
        Reading & Writing complete. Math starts after your break — just like the real SAT.
      </p>

      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)', padding: '48px 64px',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        textAlign: 'center', marginBottom: '32px',
      }}>
        <p style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: '8px' }}>
          {mins}:{String(secs).padStart(2, '0')}
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>remaining</p>
        <div style={{ background: 'var(--bg)', borderRadius: '100px', height: '8px', overflow: 'hidden', width: '200px', margin: '0 auto' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'var(--primary)', borderRadius: '100px',
            transition: 'width 1s linear',
          }} />
        </div>
      </div>

      <div style={{
        background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 'var(--radius-md)', padding: '16px 24px', marginBottom: '24px', maxWidth: '400px',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>Use this time to:</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Stretch, drink water, take deep breaths. Don't review questions — reset your focus for Math.
        </p>
      </div>

      <button onClick={onDone} style={{
        background: 'none', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 24px',
        fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
      }}>Skip Break → Start Math</button>
    </div>
  )
}

function TestModule({ test, module, onExit, onComplete }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [questions, setQuestions] = useState([])
  const [loadingQuestion, setLoadingQuestion] = useState(true)
  const [results, setResults] = useState([])
  const [timeLeft, setTimeLeft] = useState(module.minutes * 60)
  const [flagged, setFlagged] = useState(new Set())
  const [showFlagged, setShowFlagged] = useState(false)

  useEffect(() => {
    generateQuestion(0, [])
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const timeColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#f59e0b' : 'var(--text)'

  async function generateQuestion(index, prevQuestions) {
    setLoadingQuestion(true)
    setSelected(null)
    setSubmitted(false)
    setExplanation('')

    const usedScenarios = prevQuestions.map(q => q.question.slice(0, 80)).join(' | ') || 'none'
    const difficulty = module.module === 2 ? 'hard' : index < module.questions * 0.4 ? 'easy' : index < module.questions * 0.7 ? 'medium' : 'hard'

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: `You are an expert Digital SAT question generator. Generate questions IDENTICAL to real College Board SAT questions. Mix topics naturally.

Return ONLY valid JSON:
{
  "question": "full question text",
  "passage": "short passage or empty string",
  "choices": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": "A",
  "difficulty": "${difficulty}",
  "topic": "topic name"
}`,
          messages: [{
            role: 'user',
            content: `Generate a ${difficulty} ${module.section === 'rw' ? 'Reading & Writing' : 'Math'} question for Digital SAT ${module.label}. Test ${test.id}, question ${index + 1} of ${module.questions}. Do NOT repeat: ${usedScenarios}. Mix topics naturally.`
          }]
        })
      })
      const data = await response.json()
      const text = data.content[0].text.replace(/```json|```/g, '').trim()
      const q = JSON.parse(text)
      setQuestions(prev => [...prev, q])
      setLoadingQuestion(false)
    } catch (err) {
      console.error(err)
      setLoadingQuestion(false)
    }
  }

  function toggleFlag() {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(questionIndex)) next.delete(questionIndex)
      else next.add(questionIndex)
      return next
    })
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitted(true)
    const current = questions[questionIndex]
    const isCorrect = selected === current.correct.charAt(0)
    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 }
    setScore(newScore)

    const result = { question: current.question, passage: current.passage, choices: current.choices, selected, correct: current.correct.charAt(0), isCorrect, topic: current.topic, difficulty: current.difficulty, section: module.section }
    setResults(prev => [...prev, result])

    // Save wrong answers to mistake log
    if (!isCorrect) {
      saveMistake({
        question: current.question,
        passage: current.passage,
        choices: current.choices,
        correct: current.correct,
        selected,
        topic: current.topic || module.section,
        section: module.section,
        difficulty: current.difficulty,
      })
    }

    // Save stats
    const stats = getStats()
    stats.totalAnswered += 1
    stats.totalCorrect += isCorrect ? 1 : 0
    const topicKey = current.topic || module.section
    if (!stats.topicAccuracy[topicKey]) stats.topicAccuracy[topicKey] = { correct: 0, total: 0 }
    stats.topicAccuracy[topicKey].total += 1
    stats.topicAccuracy[topicKey].correct += isCorrect ? 1 : 0
    saveStats(stats)

    setLoadingExplanation(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: 'SAT tutor. Concise. No LaTeX, no markdown, no symbols. Plain English only.',
          messages: [{
            role: 'user',
            content: `Question: ${current.question}\nCorrect: ${current.correct}\nStudent: ${selected}\n${isCorrect ? 'Correct.' : 'Wrong.'}\nExplain briefly why ${current.correct} is correct. Under 100 words.`
          }]
        })
      })
      const data = await response.json()
      setExplanation(data.content[0].text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\$/g, ''))
    } catch {
      setExplanation('Could not load explanation.')
    }
    setLoadingExplanation(false)
  }

  function handleNext() {
    if (score.total >= module.questions) {
      onComplete(module.id, results)
      return
    }
    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    generateQuestion(nextIndex, questions)
  }

  const current = questions[questionIndex]
  const isFlagged = flagged.has(questionIndex)

  const difficultyConfig = {
    easy: { label: '🟢 Easy', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    medium: { label: '🟡 Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    hard: { label: '🔴 Hard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {test.name} — {module.label}
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
            Question {score.total + 1} of {module.questions}
            {flagged.size > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                🚩 {flagged.size} flagged
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700 }}>
            {score.correct}/{score.total}
          </span>
          <button onClick={onExit} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'white',
            fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
          }}>Exit</button>
        </div>
      </div>

      <div style={{ background: 'var(--border)', borderRadius: '100px', height: '4px', marginBottom: '32px', overflow: 'hidden' }}>
        <div style={{
          width: `${(score.total / module.questions) * 100}%`, height: '100%',
          background: 'var(--primary)', borderRadius: '100px', transition: 'width 0.3s ease',
        }} />
      </div>

      {loadingQuestion ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚡</div>
          Generating question...
        </div>
      ) : current ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {current.difficulty && difficultyConfig[current.difficulty] && (
                <div style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: '100px',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: difficultyConfig[current.difficulty].bg,
                  color: difficultyConfig[current.difficulty].color,
                }}>
                  {difficultyConfig[current.difficulty].label}
                </div>
              )}
              {current.topic && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '3px 8px', borderRadius: '100px', fontWeight: 500 }}>
                  {current.topic}
                </span>
              )}
            </div>
            {/* Flag button */}
            {!submitted && (
              <button onClick={toggleFlag} style={{
                background: isFlagged ? 'rgba(245,158,11,0.1)' : 'white',
                border: `1px solid ${isFlagged ? 'var(--warning)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                fontSize: '0.8rem', fontWeight: 600,
                color: isFlagged ? 'var(--warning)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {isFlagged ? '🚩 Flagged' : '🏳 Flag'}
              </button>
            )}
          </div>

          {current.passage && (
            <div style={{
              background: 'var(--bg)', borderRadius: 'var(--radius-md)',
              padding: '20px 24px', marginBottom: '24px',
              borderLeft: '3px solid var(--primary)',
              fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text)',
            }}>{current.passage}</div>
          )}

          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)',
            padding: '28px', boxShadow: 'var(--shadow-md)',
            border: `1px solid ${isFlagged ? 'var(--warning)' : 'var(--border)'}`,
            marginBottom: '20px',
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
                    border: `2px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
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
                border: `1px solid ${selected === current.correct.charAt(0) ? '#10b981' : '#ef4444'}`,
                borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '16px',
              }}>
                <p style={{ fontWeight: 700, marginBottom: '6px', color: selected === current.correct.charAt(0) ? '#10b981' : '#ef4444' }}>
                  {selected === current.correct.charAt(0) ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {loadingExplanation ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading explanation...</p>
                ) : (
                  <p style={{ color: 'var(--text)', fontSize: '0.85rem', lineHeight: '1.6' }}>{explanation}</p>
                )}
              </div>
              <button onClick={handleNext} style={{
                background: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '14px 36px',
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              }}>
                {score.total >= module.questions ? 'Finish Module →' : 'Next Question →'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}