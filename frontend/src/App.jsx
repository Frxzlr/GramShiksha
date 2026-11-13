import { useState, useEffect } from 'react'
import Student from './pages/Student'
import Planner from './pages/Planner'
import Resources from './pages/Resources'
import Teacher from './pages/Teacher'

const TABS = ['Student', 'Planner', 'Resources', 'Teacher']

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
    <div className="min-h-screen bg-green-50 text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo / App Name */}
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="books">📚</span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">GramShiksha</span>
          </div>

          {/* Online/Offline Badge and Sync Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5">
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
      </main>
    </div>
  )
}
