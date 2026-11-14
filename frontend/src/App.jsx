import { useState, useEffect } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  Package,
  FileEdit,
  Video,
  Sun,
  Moon,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import Student from './pages/Student'
import Planner from './pages/Planner'
import Resources from './pages/Resources'
import Teacher from './pages/Teacher'
import LiveClass from './pages/LiveClass'
import { startMonitoring } from './lib/connectivity'

const NAV_GROUPS = [
  {
    group: 'Learn',
    items: [
      { id: 'Student', label: 'Student', icon: BookOpen },
      { id: 'Live Class', label: 'Live Class', icon: Video },
    ],
  },
  {
    group: 'Manage',
    items: [
      { id: 'Teacher', label: 'Teacher', icon: FileEdit },
      { id: 'Resources', label: 'Resources', icon: Package },
    ],
  },
  {
    group: 'Insights',
    items: [
      { id: 'Planner', label: 'Planner', icon: LayoutDashboard },
    ],
  },
]

const ALL_TABS = NAV_GROUPS.flatMap((g) => g.items)

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [syncStatus, setSyncStatus] = useState('synced')
  const [speed, setSpeed] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
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

  // Poll pending queue count
  useEffect(() => {
    const updatePending = () => {
      try {
        const raw = localStorage.getItem('gs_connectivity_queue')
        const arr = raw ? JSON.parse(raw) : []
        setPendingCount(Array.isArray(arr) ? arr.length : 0)
      } catch {
        setPendingCount(0)
      }
    }
    updatePending()
    const interval = setInterval(updatePending, 2000)
    return () => clearInterval(interval)
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
    <div className="min-h-screen bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-[#fafafa] text-zinc-100 dark:text-zinc-100 text-zinc-900 font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* Desktop Left Sidebar (>= md) */}
      <aside
        className={`hidden md:flex flex-col justify-between border-r border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-white sticky top-0 h-screen z-40 shrink-0 transition-[width] duration-150 ${
          sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Top: Wordmark & Collapse Toggle */}
          <div className="h-14 flex items-center justify-between px-3.5 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200 shrink-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-5 h-5 rounded-[4px] bg-[#22c55e] flex items-center justify-center text-[11px] font-bold text-black font-mono shrink-0 select-none">
                  G
                </div>
                <span className="text-[14px] font-semibold tracking-tight text-white dark:text-white text-zinc-900 truncate">
                  GramShiksha
                </span>
              </div>
            ) : (
              <div className="w-5 h-5 mx-auto rounded-[4px] bg-[#22c55e] flex items-center justify-center text-[11px] font-bold text-black font-mono shrink-0 select-none">
                G
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-[4px] text-zinc-400 hover:text-white dark:hover:text-white hover:text-zinc-900 hover:bg-white/[0.05] dark:hover:bg-white/[0.05] hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Sidebar Navigation">
            {NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-0.5">
                {!sidebarCollapsed && (
                  <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 text-zinc-400 select-none">
                    {group.group}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = tab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full min-h-[36px] px-2.5 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2.5 cursor-pointer select-none text-left ${
                        isActive
                          ? 'bg-white/[0.05] dark:bg-white/[0.05] bg-zinc-100 text-white dark:text-white text-zinc-900 border-l-2 border-[#22c55e]'
                          : 'text-zinc-400 dark:text-zinc-400 text-zinc-600 hover:text-white dark:hover:text-white hover:text-zinc-900 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:bg-zinc-50 border-l-2 border-transparent'
                      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-current" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Village Selector & System Telemetry */}
        <div className="p-3 border-t border-white/[0.08] dark:border-white/[0.08] border-zinc-200 shrink-0 space-y-2.5 bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-white">
          {!sidebarCollapsed ? (
            <>
              {/* Village Selector */}
              <div className="space-y-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 text-zinc-400">
                  Village
                </div>
                <div className="relative">
                  <select
                    value={village}
                    onChange={handleVillageChange}
                    className="w-full h-8 pl-2 pr-6 rounded-[4px] bg-white/[0.04] dark:bg-white/[0.04] bg-zinc-100 border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-[12px] font-medium text-white dark:text-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#22c55e] cursor-pointer appearance-none truncate"
                    aria-label="Assigned Village"
                  >
                    {SEEDED_VILLAGES.map((v) => (
                      <option key={v} value={v} className="bg-[#111214] text-white">
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status and Sync Rows */}
              <div className="pt-2 border-t border-white/[0.06] dark:border-white/[0.06] border-zinc-100 space-y-1.5 text-[12px] font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-[#22c55e]' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-zinc-300 dark:text-zinc-300 text-zinc-700">
                      {isOnline ? (speed !== null ? `${speed} Mbps` : 'Online') : 'Offline'}
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {syncStatus === 'syncing' ? 'Syncing...' : `${pendingCount} queued`}
                  </span>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full h-8 rounded-[4px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-white/[0.02] dark:bg-white/[0.02] bg-zinc-50 hover:bg-white/[0.05] dark:hover:bg-white/[0.05] hover:bg-zinc-100 text-zinc-300 dark:text-zinc-300 text-zinc-700 text-[12px] font-medium flex items-center justify-between px-2.5 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">⌥T</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-[#22c55e]' : 'bg-red-400'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
              <button
                type="button"
                onClick={toggleTheme}
                title="Toggle Theme"
                aria-label="Toggle Theme"
                className="p-1 rounded-[4px] text-zinc-400 hover:text-white"
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Top Bar (< md) */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-white border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-[4px] bg-[#22c55e] flex items-center justify-center text-[11px] font-bold text-black font-mono shrink-0 select-none">
              G
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
              GramShiksha
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Village Selector Mobile */}
            <select
              value={village}
              onChange={handleVillageChange}
              className="h-8 max-w-[120px] px-2 rounded-[4px] bg-white/[0.04] dark:bg-white/[0.04] bg-zinc-100 border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-[11px] text-white dark:text-white text-zinc-900 font-mono truncate focus:outline-none"
              aria-label="Assigned Village Mobile"
            >
              {SEEDED_VILLAGES.map((v) => (
                <option key={v} value={v} className="bg-[#111214] text-white">
                  {v}
                </option>
              ))}
            </select>

            {/* Online Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border text-[11px] font-mono ${
                isOnline
                  ? 'border-[#22c55e]/20 bg-[#22c55e]/10 text-[#22c55e]'
                  : 'border-red-500/20 bg-red-500/10 text-red-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-[#22c55e]' : 'bg-red-400'
                }`}
              />
              <span>{isOnline ? (speed ? `${speed}M` : 'Online') : 'Offline'}</span>
            </span>

            {/* Theme Toggle Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-1.5 rounded-[4px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-zinc-300 dark:text-zinc-300 text-zinc-700"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-white border-t border-white/[0.08] dark:border-white/[0.08] border-zinc-200 px-1 py-1 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.25rem)]"
        aria-label="Mobile Navigation"
      >
        {ALL_TABS.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] min-w-[54px] flex flex-col items-center justify-center px-1.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#22c55e] font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[58px]">
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

