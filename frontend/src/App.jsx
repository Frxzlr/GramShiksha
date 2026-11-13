import { useState, useEffect } from 'react'
import Student from './pages/Student'
import Planner from './pages/Planner'
import Resources from './pages/Resources'
import Teacher from './pages/Teacher'
import LiveClass from './pages/LiveClass'
import { startMonitoring } from './lib/connectivity'

const TABS = ['Student', 'Planner', 'Resources', 'Teacher', 'Live Class']

const SEEDED_VILLAGES = [
  'Malegaon Khurd',
  'Dholera',
  'Shivgarh',
  'Chhotaki Chenari',
  'Paderu',
  'Ramgarh',
  'Sonapur',
  'Bargi',
]

export default function App() {
  const [tab, setTab] = useState('Student')
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [syncStatus, setSyncStatus] = useState('synced')
  const [speed, setSpeed] = useState(null)
  const [village, setVillage] = useState(() => {
    try {
      return localStorage.getItem('gs_village') || 'Malegaon Khurd'
    } catch {
      return 'Malegaon Khurd'
    }
  })

  // Ensure initial village is persisted in localStorage
  useEffect(() => {
    try {
      if (!localStorage.getItem('gs_village')) {
        localStorage.setItem('gs_village', 'Malegaon Khurd')
      }
    } catch {}
  }, [])

  // Start real-time connectivity monitoring
  useEffect(() => {
    const stop = startMonitoring(
      () => {
        try {
          return localStorage.getItem('gs_village') || village || 'Malegaon Khurd'
        } catch {
          return 'Malegaon Khurd'
        }
      },
      (res) => {
        if (res && res.online && typeof res.mbps === 'number' && res.mbps > 0) {
          setSpeed(res.mbps)
        } else {
          setSpeed(null)
        }
      }
    )

    return () => {
      if (stop) stop()
    }
  }, [village])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('synced')
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSpeed(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleVillageChange = (e) => {
    const v = e.target.value
    setVillage(v)
    try {
      localStorage.setItem('gs_village', v)
    } catch {}
  }

  const refresh = () => {
    // When items are queued or refreshed
    setSyncStatus('syncing')
    setTimeout(() => {
      setSyncStatus('synced')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-green-50 text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo / App Name & Village selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="books">📚</span>
              <span className="text-xl sm:text-2xl font-bold tracking-tight">GramShiksha</span>
            </div>

            {/* Small village selector */}
            <div className="flex items-center gap-1 bg-green-700/80 px-2.5 py-1 rounded-xl border border-green-500 text-xs sm:text-sm text-green-100 shadow-xs">
              <span>📍</span>
              <select
                value={village}
                onChange={handleVillageChange}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                aria-label="Village Selector"
              >
                {SEEDED_VILLAGES.map((v) => (
                  <option key={v} value={v} className="text-gray-900 bg-white font-medium">
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Online/Offline Badge, Speed Badge, and Sync Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Online/Offline Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold min-h-[32px] shadow-xs ${
                isOnline
                  ? 'bg-green-700 text-green-100 border border-green-500'
                  : 'bg-amber-600 text-white border border-amber-400'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-300' : 'bg-red-300'
                }`}
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {/* Speed Badge (small badge next to the Online badge, e.g. "2.4 Mbps") */}
            {isOnline && speed !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-green-700 text-emerald-200 border border-green-500 min-h-[32px] shadow-xs">
                <span>⚡</span>
                <span>{speed} Mbps</span>
              </span>
            )}

            {/* Sync Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-700/90 text-green-100 border border-green-500 min-h-[32px] shadow-xs">
              {syncStatus === 'syncing' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-emerald-300">✓</span>
                  <span>Synced</span>
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Pill Navigation (active tab green, others white with border, min 44px tap targets) */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-5 pb-1">
        <nav className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3" aria-label="Role Navigation">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-base font-semibold transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 ${
                tab === t
                  ? 'bg-green-600 text-white border-2 border-green-600 shadow-sm'
                  : 'bg-white text-green-800 border-2 border-green-200 hover:border-green-400 hover:bg-green-100/60'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Views: max-w-3xl centered content */}
      <main className="w-full max-w-3xl mx-auto px-4 py-5 flex-1">
        {tab === 'Student' && <Student onQueued={refresh} />}
        {tab === 'Planner' && <Planner />}
        {tab === 'Resources' && <Resources />}
        {tab === 'Teacher' && <Teacher />}
        {tab === 'Live Class' && <LiveClass />}
      </main>
    </div>
  )
}
