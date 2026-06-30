import { useState, useEffect, useRef } from 'react'
import { getStats, saveStats, saveMistake, saveSession, updateStreak } from '../utils/storage'

const TOPICS = {
  math: [
    { id: 'algebra', label: 'Algebra', weight: '35%', color: '#6c63ff', desc: 'Linear equations, inequalities, systems' },
    { id: 'advanced-math', label: 'Advanced Math', weight: '35%', color: '#ef4444', desc: 'Quadratics, functions, polynomials, exponentials' },
    { id: 'problem-solving', label: 'Problem Solving & Data', weight: '15%', color: '#f59e0b', desc: 'Ratios, percentages, probability, statistics' },
    { id: 'geometry', label: 'Geometry & Trig', weight: '15%', color: '#10b981', desc: 'Area, volume, angles, triangles, circles, sin/cos/tan' },
  ],
  rw: [
    { id: 'information-ideas', label: 'Information & Ideas', weight: '~26%', color: '#6c63ff', desc: 'Reading comprehension, evidence-based questions' },
    { id: 'craft-structure', label: 'Craft & Structure', weight: '~28%', color: '#ef4444', desc: 'Vocabulary in context, text structure, cross-text' },
    { id: 'expression-ideas', label: 'Expression of Ideas', weight: '~20%', color: '#f59e0b', desc: 'Rhetorical synthesis, transitions' },
    { id: 'english-conventions', label: 'Standard English Conventions', weight: '~26%', color: '#10b981', desc: 'Grammar, punctuation, sentence structure' },
  ]
}

const DRILL_SIZES = [10, 20, 30]
const DIFFICULTY_CYCLE = ['easy', 'medium', 'medium', 'hard', 'medium', 'easy', 'hard', 'medium', 'medium', 'hard']

// Strip any leftover markdown/LaTeX artifacts from any text the model returns
function cleanText(text) {
  if (!text) return ''
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 divided by $2')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/\{|\}/g, '')
    .trim()
}

// Normalize a choice string into { letter, text } no matter how the model formatted it
function parseChoice(raw) {
  const cleaned = cleanText(raw)
  const match = cleaned.match(/^([A-D])\)?\.?\s*(.*)$/s)
  if (match) {
    return { letter: match[1], text: match[2].trim() }
  }
  return { letter: '?', text: cleaned }
}

function estimateScore(stats) {
  if (stats.totalAnswered < 5) return null
  const acc = stats.totalCorrect / stats.totalAnswered
  const estimated = Math.round(400 + acc * 1200)
  return Math.min(1600, Math.max(400, estimated))
}

function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    color: ['#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#00d4ff'][Math.floor(Math.random() * 5)],
    size: `${Math.random() * 8 + 6}px`,
  }))

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-20px', left: p.left,
          width: p.size, height: p.size,
          background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${p.delay} forwards`,
        }} />
      ))}
    </div>
  )
}

// Desmos calculator embed
function DesmosCalculator() {
  const containerRef = useRef(null)
  const calculatorRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    if (window.Desmos) {
      initCalculator()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://www.desmos.com/api/v1.12/calculator.js?apiKey=ad2d67a926eb452093608fe55aecfb29'
    script.onload = initCalculator
    document.body.appendChild(script)

    function initCalculator() {
      if (containerRef.current && !calculatorRef.current) {
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          border: false,
        })
        setLoaded(true)
      }
    }
  }, [open])

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(108,99,255,0.08)' : 'white',
          border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '8px 16px',
          fontSize: '0.82rem', fontWeight: 600,
          color: open ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        🧮 {open ? 'Hide Calculator' : 'Open Desmos Calculator'}
      </button>
      {open && (
        <div style={{
          marginTop: '10px', height: '380px', borderRadius: 'var(--radius-md)',
          overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}

// Feedback button — optional, only saves if used
function FeedbackButton({ question, topic, section }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    if (!text.trim()) return
    try {
      const existing = JSON.parse(localStorage.getItem('scorix_feedback') || '[]')
      existing.push({
        text: text.trim(),
        question: question?.slice(0, 200) || '',
        topic, section,
        date: new Date().toISOString(),
      })
      localStorage.setItem('scorix_feedback', JSON.stringify(existing.slice(-200)))
    } catch {}
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); setText('') }, 1500)
  }

  if (sent) {
    return (
      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>✓ Feedback sent</span>
    )
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '6px 14px',
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
        }}>💬 Feedback</button>
      ) : (
        <div style={{
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '8px',
          boxShadow: 'var(--shadow-sm)', maxWidth: '400px',
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's wrong with this question?"
            style={{
              width: '100%', minHeight: '60px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px', fontSize: '0.85rem',
              fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={submit} style={{
              background: 'var(--primary)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '6px 16px',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}>Send</button>
            <button onClick={() => { setOpen(false); setText('') }} style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 16px',
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Practice() {
  const [section, setSection] = useState(null)
  const [topic, setTopic] = useState(null)
  const [drillSize, setDrillSize] = useState(20)
  const [started, setStarted] = useState(false)

  const stats = getStats()
  const estimatedScore = estimateScore(stats)

  function reset() {
    setSection(null)
    setTopic(null)
    setDrillSize(20)
    setStarted(false)
  }

  if (started) {
    return <DrillSession section={section} topic={topic} drillSize={drillSize} onExit={reset} />
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Practice</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Pick a section and topic to drill. Every rep gets you closer to 1500.</p>
        </div>
        {estimatedScore && (
          <div style={{
            background: 'white', borderRadius: 'var(--radius-md)', padding: '12px 20px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Est. Score</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: estimatedScore >= 1400 ? 'var(--accent)' : estimatedScore >= 1200 ? 'var(--warning)' : 'var(--danger)' }}>
              {estimatedScore}
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Section</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { id: 'math', label: 'Math', icon: '📐', desc: '44 questions • 70 min on real test' },
            { id: 'rw', label: 'Reading & Writing', icon: '📖', desc: '54 questions • 64 min on real test' },
          ].map((s) => (
            <button key={s.id} onClick={() => { setSection(s.id); setTopic(null) }} style={{
              padding: '20px 24px', borderRadius: 'var(--radius-md)',
              border: `2px solid ${section === s.id ? 'var(--primary)' : 'var(--border)'}`,
              background: section === s.id ? 'rgba(108,99,255,0.06)' : 'white',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {section && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Topic</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {TOPICS[section].map((t) => (
              <button key={t.id} onClick={() => setTopic(t)} style={{
                padding: '16px 20px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${topic?.id === t.id ? t.color : 'var(--border)'}`,
                background: topic?.id === t.id ? `${t.color}10` : 'white',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{t.label}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: t.color, background: `${t.color}15`, padding: '2px 8px', borderRadius: '100px' }}>{t.weight}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {topic && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Drill Size</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {DRILL_SIZES.map((size) => (
              <button key={size} onClick={() => setDrillSize(size)} style={{
                padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                border: `2px solid ${drillSize === size ? 'var(--primary)' : 'var(--border)'}`,
                background: drillSize === size ? 'rgba(108,99,255,0.06)' : 'white',
                fontWeight: 700, fontSize: '0.95rem',
                color: drillSize === size ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{size} Q</button>
            ))}
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>~{drillSize * 1.5} minutes • real SAT pacing</p>
        </div>
      )}

      {topic && (
        <button onClick={() => setStarted(true)} style={{
          background: 'var(--primary)', color: 'white', border: 'none',
          borderRadius: 'var(--radius-md)', padding: '16px 40px',
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(108,99,255,0.3)', transition: 'all 0.15s',
        }}>Start Drill →</button>
      )}
    </div>
  )
}

function DrillSession({ section, topic, drillSize, onExit }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)
  const [questions, setQuestions] = useState([])
  const [loadingQuestion, setLoadingQuestion] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [results, setResults] = useState([])
  const [hint, setHint] = useState('')
  const [loadingHint, setLoadingHint] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [questionTime, setQuestionTime] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef(null)

  useState(() => { generateQuestion(0, []) })

  useEffect(() => {
    setQuestionTime(0)
    timerRef.current = setInterval(() => {
      setQuestionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [questionIndex, loadingQuestion])

  useEffect(() => {
    if (submitted) clearInterval(timerRef.current)
  }, [submitted])

  function formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  async function generateQuestion(index, prevQuestions) {
    setLoadingQuestion(true)
    setLoadError(false)
    setSelected(null)
    setSubmitted(false)
    setExplanation('')
    setHint('')
    setHintUsed(false)

    const difficulty = DIFFICULTY_CYCLE[index % DIFFICULTY_CYCLE.length]
    const usedScenarios = prevQuestions.map(q => q.question.slice(0, 80)).join(' | ') || 'none'

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
          system: `You are an expert Digital SAT question generator trained on official College Board materials. Generate questions IDENTICAL in style to real SAT questions.

STRICT RULES:
- Match exact College Board question format and wording style
- For Math: word problems, data interpretation, algebra, functions — no calculus, no topics beyond SAT scope. A Desmos graphing calculator is available, so questions can reference graphing where appropriate.
- For Reading & Writing: include a short passage (25-100 words) from literature, history, science, or social studies followed by ONE focused question
- Trap answers must reflect real mistakes students make
- NEVER repeat a scenario already used in this session
- Choices must each start with "A) ", "B) ", "C) ", "D) " exactly, followed by the answer text
- No LaTeX, no markdown, no dollar signs, no backslashes — write all math in plain text using words like "squared" and "divided by"

Return ONLY valid JSON, no markdown, no backticks:
{
  "question": "full question text",
  "passage": "short passage or empty string",
  "choices": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": "A",
  "difficulty": "${difficulty}"
}`,
          messages: [{
            role: 'user',
            content: `Generate a ${difficulty} difficulty ${topic.label} question for the Digital SAT ${section === 'math' ? 'Math' : 'Reading & Writing'} section.

Already used these scenarios this session (DO NOT repeat): ${usedScenarios}

Generate a completely different question scenario.`
          }]
        })
      })

      const data = await response.json()
      const rawText = data?.content?.[0]?.text
      if (!rawText) throw new Error('Empty response')
      const text = rawText.replace(/```json|```/g, '').trim()
      const q = JSON.parse(text)

      // Validate shape before accepting
      if (!q.question || !Array.isArray(q.choices) || q.choices.length < 2 || !q.correct) {
        throw new Error('Malformed question')
      }

      q.question = cleanText(q.question)
      q.passage = cleanText(q.passage)
      q.choices = q.choices.map(cleanText)

      setQuestions(prev => [...prev, q])
      setLoadingQuestion(false)
    } catch (err) {
      console.error(err)
      setLoadError(true)
      setLoadingQuestion(false)
    }
  }

  async function getHint() {
    if (hintUsed || submitted) return
    setLoadingHint(true)
    setHintUsed(true)
    const current = questions[questionIndex]

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
          max_tokens: 150,
          system: 'You are an SAT tutor giving a hint. DO NOT reveal the answer or which letter is correct. Give a strategic nudge — what to think about, what approach to use, what to watch out for. Plain English only, no symbols, no markdown. 2-3 sentences max.',
          messages: [{
            role: 'user',
            content: `Give a hint for this SAT question WITHOUT revealing the answer:\n\n${current.passage ? `Passage: ${current.passage}\n\n` : ''}Question: ${current.question}\n\nChoices: ${current.choices.join(' | ')}`
          }]
        })
      })
      const data = await response.json()
      setHint(cleanText(data.content[0].text))
    } catch {
      setHint('Could not load hint.')
    }
    setLoadingHint(false)
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitted(true)
    clearInterval(timerRef.current)
    const current = questions[questionIndex]
    const correctLetter = parseChoice(current.choices.find(c => c.startsWith(current.correct.charAt(0))) || current.correct).letter || current.correct.charAt(0)
    const isCorrect = selected === current.correct.charAt(0)

    const newScore = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 }
    setScore(newScore)

    setResults(prev => [...prev, {
      question: current.question, selected,
      correct: current.correct.charAt(0),
      isCorrect, topic: topic.label,
      difficulty: current.difficulty,
      timeSpent: questionTime,
      hintUsed,
    }])

    const stats = getStats()
    stats.totalAnswered += 1
    stats.totalCorrect += isCorrect ? 1 : 0
    if (!stats.topicAccuracy[topic.label]) {
      stats.topicAccuracy[topic.label] = { correct: 0, total: 0 }
    }
    stats.topicAccuracy[topic.label].total += 1
    stats.topicAccuracy[topic.label].correct += isCorrect ? 1 : 0
    saveStats(stats)

    if (!isCorrect) {
      saveMistake({
        question: current.question,
        passage: current.passage,
        choices: current.choices,
        correct: current.correct,
        selected,
        topic: topic.label,
        section,
        difficulty: current.difficulty,
      })
    }

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
          max_tokens: 400,
          system: 'You are an expert SAT tutor. Explain questions clearly and concisely. Be direct. No fluff. NEVER use LaTeX, markdown, asterisks, dollar signs, or special symbols. Plain English only. Write math in words.',
          messages: [{
            role: 'user',
            content: `Question: ${current.question}
Choices: ${current.choices.join(' | ')}
Correct answer: ${current.correct}
Student answered: ${selected}
${isCorrect ? 'They got it right.' : 'They got it wrong.'}

Explain clearly why ${current.correct} is correct and how to solve it. If wrong, explain the mistake. Under 150 words.`
          }]
        })
      })
      const data = await response.json()
      setExplanation(cleanText(data.content[0].text))
    } catch {
      setExplanation('Could not load explanation.')
    }
    setLoadingExplanation(false)
  }

  function handleNext() {
    if (score.total >= drillSize) {
      const pct = Math.round((score.correct / score.total) * 100)
      if (pct >= 80) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
      saveSession({
        topic: topic.label,
        section,
        correct: score.correct,
        total: score.total,
        accuracy: Math.round((score.correct / score.total) * 100),
      })
      updateStreak()
      setFinished(true)
      return
    }
    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    generateQuestion(nextIndex, questions)
  }

  const difficultyConfig = {
    easy: { label: '🟢 Easy', color: 'var(--accent)', bg: 'rgba(16,185,129,0.1)' },
    medium: { label: '🟡 Medium', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
    hard: { label: '🔴 Hard', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
  }

  if (finished) {
    const pct = Math.round((score.correct / score.total) * 100)
    const avgTime = Math.round(results.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / results.length)
    return (
      <>
        <Confetti active={showConfetti} />
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
            {pct >= 80 ? '🔥' : pct >= 60 ? '💪' : '📚'}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{score.correct}/{score.total} Correct</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{pct}% accuracy on {topic.label}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '32px' }}>Avg time per question: {formatTime(avgTime)}</p>

          {pct >= 80 && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 'var(--radius-md)', padding: '16px 24px',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              marginBottom: '24px',
            }}>
              🔥 80%+ — Excellent work! Keep this up and you'll hit 1500.
            </div>
          )}

          <div style={{
            background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
            marginBottom: '24px', textAlign: 'left',
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Results</h3>
            {results.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 0', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span>{r.isCorrect ? '✅' : '❌'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>
                  Q{i + 1} ({r.difficulty}) — {r.isCorrect ? 'Correct' : `Wrong (you said ${r.selected}, answer was ${r.correct})`}
                  {r.hintUsed && <span style={{ color: 'var(--warning)', fontSize: '0.75rem', marginLeft: '8px' }}>hint used</span>}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatTime(r.timeSpent || 0)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={onExit} style={{
              padding: '14px 32px', borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border)', background: 'white',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text)',
            }}>Back to Practice</button>
            <button onClick={() => {
              setQuestionIndex(0)
              setScore({ correct: 0, total: 0 })
              setFinished(false)
              setResults([])
              setQuestions([])
              setShowConfetti(false)
              generateQuestion(0, [])
            }} style={{
              padding: '14px 32px', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--primary)', color: 'white',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            }}>Drill Again →</button>
          </div>
        </div>
      </>
    )
  }

  const current = questions[questionIndex]
  const timeWarning = questionTime > 90

  return (
    <>
      <Confetti active={showConfetti} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {topic.label}
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>
              Question {score.total + 1} of {drillSize}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700,
              color: timeWarning ? 'var(--danger)' : 'var(--text-secondary)',
              background: timeWarning ? 'rgba(239,68,68,0.08)' : 'var(--bg)',
              padding: '4px 10px', borderRadius: '100px',
              transition: 'all 0.3s',
            }}>
              ⏱ {formatTime(questionTime)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700 }}>
              {score.correct}/{score.total} correct
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
            width: `${(score.total / drillSize) * 100}%`, height: '100%',
            background: 'var(--primary)', borderRadius: '100px', transition: 'width 0.3s ease',
          }} />
        </div>

        {loadError ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'white', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚠️</p>
            <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>Couldn't generate this question</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>This sometimes happens — let's try again.</p>
            <button onClick={() => generateQuestion(questionIndex, questions)} style={{
              background: 'var(--primary)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '12px 28px',
              fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            }}>Retry</button>
          </div>
        ) : loadingQuestion ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚡</div>
            Generating question...
          </div>
        ) : current ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
            </div>

            {/* Desmos for math */}
            {section === 'math' && <DesmosCalculator />}

            {current.passage && (
              <div style={{
                background: 'var(--bg)', borderRadius: 'var(--radius-md)',
                padding: '20px 24px', marginBottom: '24px',
                borderLeft: '3px solid var(--primary)',
                fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text)',
              }}>
                {current.passage}
              </div>
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
                {current.choices.map((choiceRaw, i) => {
                  const { letter, text } = parseChoice(choiceRaw)
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
                      transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                      <span style={{
                        flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
                        border: `2px solid ${isCorrect ? 'var(--accent)' : isWrong ? 'var(--danger)' : isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 800,
                        color: isCorrect ? 'var(--accent)' : isWrong ? 'var(--danger)' : isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      }}>
                        {isCorrect ? '✓' : isWrong ? '✗' : letter}
                      </span>
                      <span>{text}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {hint && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '16px',
              }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '4px' }}>💡 Hint</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: '1.6' }}>{hint}</p>
              </div>
            )}

            {!submitted ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleSubmit} disabled={!selected} style={{
                  background: selected ? 'var(--primary)' : 'var(--border)',
                  color: selected ? 'white' : 'var(--text-dim)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '14px 36px', fontSize: '0.95rem', fontWeight: 700,
                  cursor: selected ? 'pointer' : 'default', transition: 'all 0.15s',
                }}>Submit Answer</button>
                {!hintUsed && (
                  <button onClick={getHint} disabled={loadingHint} style={{
                    background: 'white', color: 'var(--warning)',
                    border: '2px solid rgba(245,158,11,0.4)',
                    borderRadius: 'var(--radius-md)', padding: '14px 24px',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    {loadingHint ? 'Loading...' : '💡 Get Hint'}
                  </button>
                )}
                {hintUsed && !hint && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Hint used</span>
                )}
                <div style={{ marginLeft: 'auto' }}>
                  <FeedbackButton question={current.question} topic={topic.label} section={section} />
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  background: selected === current.correct.charAt(0) ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${selected === current.correct.charAt(0) ? 'var(--accent)' : 'var(--danger)'}`,
                  borderRadius: 'var(--radius-md)', padding: '20px 24px', marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 700, color: selected === current.correct.charAt(0) ? 'var(--accent)' : 'var(--danger)' }}>
                      {selected === current.correct.charAt(0) ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Time: {formatTime(questionTime)}
                    </span>
                  </div>
                  {loadingExplanation ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading explanation...</p>
                  ) : (
                    <div style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                      {explanation.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} style={{ marginBottom: '6px' }}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={handleNext} style={{
                    background: 'var(--primary)', color: 'white', border: 'none',
                    borderRadius: 'var(--radius-md)', padding: '14px 36px',
                    fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                  }}>
                    {score.total >= drillSize ? 'See Results →' : 'Next Question →'}
                  </button>
                  <FeedbackButton question={current.question} topic={topic.label} section={section} />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}