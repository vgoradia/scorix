import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Tests from './pages/Tests'
import Mistakes from './pages/Mistakes'
import Progress from './pages/Progress'
import Onboarding from './pages/Onboarding'
import Review from './pages/Review'

export default function App() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scorix_profile')) } catch { return null }
  })
  const location = useLocation()

  useEffect(() => {
    const p = localStorage.getItem('scorix_profile')
    if (p) setProfile(JSON.parse(p))
  }, [location])

  if (!profile && location.pathname !== '/onboarding') {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <>
      <Navbar profile={profile} />
      <div style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/review" element={<Review />} />
        </Routes>
      </div>
    </>
  )
}