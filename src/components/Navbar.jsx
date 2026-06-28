import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar({ profile }) {
  const navigate = useNavigate()
  const currentScore = profile?.currentScore || 1240
  const targetScore = profile?.targetScore || 1500

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      background: 'white', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', zIndex: 100, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#6c63ff"/>
          <path d="M8 20 Q12 8 16 16 Q20 24 24 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <text x="10" y="26" fill="white" fontSize="9" fontWeight="800" fontFamily="sans-serif">S</text>
        </svg>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Scor<span style={{ color: 'var(--primary)' }}>ix</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/practice', label: 'Practice' },
          { to: '/tests', label: 'Tests' },
          { to: '/review', label: 'Review'},
          { to: '/mistakes', label: 'Mistakes' },
          { to: '/progress', label: 'Progress' },

        ].map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            fontWeight: 500, fontSize: '0.9rem',
            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(108, 99, 255, 0.08)' : 'transparent',
            transition: 'all 0.15s',
          })}>
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--primary)', color: 'white',
          padding: '8px 20px', borderRadius: 'var(--radius-sm)',
          fontWeight: 600, fontSize: '0.9rem',
        }}>
          {currentScore} → {targetScore}
        </div>
        <button
          onClick={() => {
            if (confirm('Reset your profile and start over?')) {
              localStorage.removeItem('scorix_profile')
              window.location.reload()
            }
          }}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '7px 12px',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 500,
          }}
          title="Edit profile"
        >⚙️</button>
      </div>
    </nav>
  )
}