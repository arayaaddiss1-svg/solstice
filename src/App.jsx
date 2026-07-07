import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import DailyLog from './components/DailyLog'
import Arc from './components/Arc'
import Insights from './components/Insights'
import DoctorReport from './components/DoctorReport'

const TABS = ['Today', 'The Arc', 'Patterns', 'Doctor report']

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('Today')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchLogs = useCallback(async () => {
    if (!session?.user) return
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('log_date', since.toISOString().slice(0, 10))
      .order('log_date', { ascending: true })
    setLogs(data || [])
  }, [session])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (session === undefined) {
    return (
      <div className="auth-shell">
        <span className="loader" />
      </div>
    )
  }

  if (!session) return <Auth />

  const logsByDate = Object.fromEntries(logs.map((l) => [l.log_date, l]))

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div className="brand">
          Sol<em>stice</em>
        </div>
        <button className="sign-out" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Today' && <DailyLog userId={session.user.id} onSaved={fetchLogs} />}

      {tab === 'The Arc' && (
        <div className="card">
          <h2>The Arc</h2>
          <p className="sub">Your last 30 days, dawn to dusk. Bigger and deeper-colored points mean a harder day.</p>
          {logs.length ? (
            <Arc logsByDate={logsByDate} />
          ) : (
            <div className="empty-state">Log a few days to see your Arc take shape.</div>
          )} <footer style={{
  textAlign: 'center',
  padding: '24px 16px',
  fontSize: '13px',
  color: '#888',
  borderTop: '1px solid #eee',
  marginTop: '40px'
}}>
  
    href="https://github.com/arayaaddiss1-svg/solstice/blob/main/legal/PRIVACY_POLICY.md"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#888', textDecoration: 'underline', marginRight: '16px' }}
  >
    Privacy Policy
  </a>
  
    href="https://github.com/arayaaddiss1-svg/solstice/blob/main/legal/TERMS_OF_SERVICE.md"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#888', textDecoration: 'underline' }}
  >
    Terms of Service
  </a>
</footer>
        </div>
      )}

      {tab === 'Patterns' && <Insights logs={logs} />}

      {tab === 'Doctor report' && <DoctorReport logs={logs} />}
    </div>
  )
}
