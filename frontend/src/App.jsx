import { useState, useEffect } from 'react'
import {
  GraduationCap,
  LayoutDashboard,
  Package,
  Sparkles,
  Video,
  Sun,
  Moon,
  Check,
  RefreshCw,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import Student from './pages/Student'
import Planner from './pages/Planner'
import Resources from './pages/Resources'
import Teacher from './pages/Teacher'
import LiveClass from './pages/LiveClass'
import { startMonitoring } from './lib/connectivity'

const TABS = [
  { id: 'Student', label: 'Student', icon: GraduationCap },
  { id: 'Planner', label: 'Planner', icon: LayoutDashboard },
  { id: 'Resources', label: 'Resources', icon: Package },
  { id: 'Teacher', label: 'Teacher', icon: Sparkles },
  { id: 'Live Class', label: 'Live Class', icon: Video },
]

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

  // Dark/Light theme state
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('gs_theme')
      if (stored === 'light' || stored === 'dark') return stored
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
      return 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      localStorage.setItem('gs_theme', theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

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
    setSyncStatus('syncing')
    setTimeout(() => {
      setSyncStatus('synced')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#0b1220] dark:bg-[#0b1220] bg-slate-50 text-slate-100 dark:text-slate-100 text-slate-900 font-sans flex flex-col md:flex-row bg-ambient-glow bg-dot-grid overflow-x-hidden">
      {/* Desktop Left Sidebar (>= md) */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-col justify-between p-5 border-r border-white/[0.08] dark:border-white/[0.08] border-slate-200/80 bg-[#0b1220]/80 dark:bg-[#0b1220]/80 bg-white/80 backdrop-blur-2xl sticky top-0 h-screen z-40 shrink-0">
        <div className="space-y-6">
          {/* Logo Mark & Tagline */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b1220] rounded-[10px] flex items-center justify-center">
                <span className="font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-lg">
                  ग
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-lg font-bold tracking-tight text-white dark:text-white text-slate-900 leading-tight">
                GramShiksha
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 text-slate-500 font-medium truncate">
                Learning without limits
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Sidebar Navigation">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-3 cursor-pointer select-none text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 dark:text-emerald-400 text-emerald-600 border border-emerald-500/30 shadow-xs font-semibold'
                      : 'text-slate-400 dark:text-slate-400 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 hover:bg-white/[0.04] dark:hover:bg-white/[0.04] hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-emerald-400' : ''
                    }`}
                  />
                  <span>{t.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Village Selector & Status */}
        <div className="pt-4 border-t border-white/[0.08] dark:border-white/[0.08] border-slate-200 space-y-3">
          <div className="bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100/70 p-3 rounded-xl border border-white/[0.06] dark:border-white/[0.06] border-slate-200 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-emerald-400" /> Assigned Village
            </span>
            <div className="relative">
              <select
                value={village}
                onChange={handleVillageChange}
                className="w-full bg-transparent text-sm font-semibold dark:text-white text-slate-900 pr-6 focus:outline-none cursor-pointer appearance-none"
                aria-label="Village Selector"
              >
                {SEEDED_VILLAGES.map((v) => (
                  <option key={v} value={v} className="bg-[#111a2e] text-white">
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0b1220]/80 dark:bg-[#0b1220]/80 bg-white/80 backdrop-blur-xl border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200/80 px-4 sm:px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* Mobile Logo Mark (< md) */}
            <div className="flex md:hidden items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b1220] rounded-[6px] flex items-center justify-center">
                  <span className="font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm">
                    ग
                  </span>
                </div>
              </div>
              <span className="font-heading text-base font-bold tracking-tight dark:text-white text-slate-900">
                GramShiksha
              </span>
            </div>

            {/* Current Active Tab Title on Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Platform /
              </span>
              <span className="font-heading text-sm font-bold text-white dark:text-white text-slate-900">
                {tab}
              </span>
            </div>

            {/* Right Status Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
              {/* Mobile Village Selector */}
              <div className="flex md:hidden items-center gap-1 bg-white/[0.06] dark:bg-white/[0.06] bg-slate-100 px-2.5 py-1.5 rounded-full border border-white/10 dark:border-white/10 border-slate-200 text-xs">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <select
                  value={village}
                  onChange={handleVillageChange}
                  className="bg-transparent dark:text-white text-slate-900 font-medium focus:outline-none cursor-pointer max-w-[100px] truncate"
                  aria-label="Mobile Village Selector"
                >
                  {SEEDED_VILLAGES.map((v) => (
                    <option key={v} value={v} className="bg-[#111a2e] text-white">
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Online/Offline Badge with Pulsing Dot */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold min-h-[32px] border backdrop-blur-md transition-colors ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </span>
                <span className="flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <span>Online</span>
                      {speed !== null && (
                        <span className="text-[11px] font-mono text-cyan-400 pl-1 border-l border-emerald-500/30">
                          {speed}M
                        </span>
                      )}
                    </>
                  ) : (
                    <span>Offline</span>
                  )}
                </span>
              </div>

              {/* Sync Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 text-slate-300 dark:text-slate-300 text-slate-700 border border-white/10 dark:border-white/10 border-slate-200 min-h-[32px] backdrop-blur-md">
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400">Syncing</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Synced</span>
                  </>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Dark/Light Theme"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] dark:bg-white/[0.06] bg-slate-100 border border-white/10 dark:border-white/10 border-slate-200 text-slate-300 dark:text-slate-300 text-slate-700 hover:text-white dark:hover:text-white hover:text-slate-900 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content View (max-w-6xl for high-end wide dashboard, responsive at 360px and 1280px) */}
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1">
          {tab === 'Student' && <Student onQueued={refresh} village={village} syncStatus={syncStatus} />}
          {tab === 'Planner' && <Planner theme={theme} />}
          {tab === 'Resources' && <Resources />}
          {tab === 'Teacher' && <Teacher />}
          {tab === 'Live Class' && <LiveClass />}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< md) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1220]/95 dark:bg-[#0b1220]/95 bg-white/95 backdrop-blur-2xl border-t border-white/[0.08] dark:border-white/[0.08] border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-2xl"
        aria-label="Mobile Navigation"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-emerald-400 dark:text-emerald-400 text-emerald-600 font-semibold'
                  : 'text-slate-400 dark:text-slate-400 text-slate-500 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-emerald-500/10 scale-105' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
