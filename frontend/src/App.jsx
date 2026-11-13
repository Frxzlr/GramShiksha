import { useState, useEffect } from 'react'
import Student from './pages/Student'
import Planner from './pages/Planner'
import Resources from './pages/Resources'

const TABS = ['Student', 'Planner', 'Resources']

export default function App() {
  const [tab, setTab] = useState('Student')
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [syncStatus, setSyncStatus] = useState('synced')

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('synced')
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const refresh = () => {
    // When items are queued or refreshed
    setSyncStatus('syncing')
    setTimeout(() => {
      setSyncStatus('synced')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Status Badges */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span>📚</span>
              <span>GramShiksha</span>
            </h1>

            {/* Online/Offline Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-green-800 text-green-100 border border-green-600'
                  : 'bg-amber-600 text-white border border-amber-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400' : 'bg-red-300'
                }`}
              />
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {/* Sync Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-800/80 text-green-100 border border-green-600">
              {syncStatus === 'syncing' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Synced</span>
                </>
              )}
            </span>
          </div>

          {/* Role Switcher */}
          <nav className="flex items-center gap-1 bg-green-800/60 p-1 rounded-xl">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-white text-green-800 shadow-sm'
                    : 'text-green-100 hover:bg-green-600/70'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Views */}
      <main className="py-4">
        {tab === 'Student' && <Student onQueued={refresh} />}
        {tab === 'Planner' && <Planner />}
        {tab === 'Resources' && <Resources />}
      </main>
    </div>
  )
}
