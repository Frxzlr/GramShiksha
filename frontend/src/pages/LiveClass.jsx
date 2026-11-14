import { useState, useEffect } from 'react'
import {
  Video,
  Copy,
  Check,
  WifiOff,
  Info,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'

export default function LiveClass() {
  const [village, setVillage] = useState(() => {
    try {
      return localStorage.getItem('gs_village') || 'Malegaon Khurd'
    } catch {
      return 'Malegaon Khurd'
    }
  })
  const [selectedClass, setSelectedClass] = useState('6')
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodically re-check stored village in case user changed it in header
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('gs_village')
        if (stored && stored !== village) {
          setVillage(stored)
        }
      } catch {}
    }, 1000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [village])

  // Generate lowercase ASCII slug containing only letters, digits, and hyphens
  const villageSlug =
    village
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'village'

  const roomName = `GramShiksha-${villageSlug}-class${selectedClass}`
  const meetingUrl = `https://meet.jit.si/${roomName}`

  const handleJoin = () => {
    if (!isOnline) return
    window.open(meetingUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(meetingUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.warn('Failed to copy link:', err)
    }
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Card */}
      <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" dot>
              WebRTC Video Hub
            </Badge>
            <Badge variant="cyan" size="sm">
              Jitsi Secure
            </Badge>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Virtual Rural Classroom
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Connect live with volunteer educators and inter-school cohorts across rural districts in India.
          </p>
        </div>
      </div>

      {/* Main Interactive Meeting Card */}
      <Card className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Village Context */}
          <div className="p-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.02] space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Village School
            </span>
            <p className="font-heading text-lg font-bold dark:text-white text-slate-900">
              {village}
            </p>
          </div>

          {/* Standard / Class Selector as Pills */}
          <div className="p-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.02] space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Select Standard / Class
            </span>
            <div className="flex gap-2 pt-0.5">
              {['6', '7', '8'].map((cls) => {
                const isSelected = selectedClass === cls
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`flex-1 min-h-[44px] rounded-xl font-heading font-bold text-sm transition-all duration-150 cursor-pointer flex items-center justify-center select-none ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/40'
                        : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.08]'
                    }`}
                  >
                    Class {cls}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Meeting URL & Quick Actions */}
        <div className="p-5 rounded-2xl border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.02] space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Classroom Video Link
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="flex-1 min-h-[44px] bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100 border border-white/10 dark:border-white/10 border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm dark:text-slate-200 text-slate-800 font-mono select-all focus:outline-none"
              />
              <Button
                variant="secondary"
                size="md"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Prominent Gradient Join Button */}
          <Button
            variant="primary"
            size="lg"
            icon={Video}
            disabled={!isOnline}
            onClick={handleJoin}
            className="w-full"
          >
            Join Live Class (Class {selectedClass})
          </Button>
        </div>

        {/* Status Notices */}
        <div className="space-y-3">
          {!isOnline && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3 text-sm">
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">Offline: Live Video Call Disabled</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  You are disconnected from the network. Precached lessons remain fully accessible in the Student tab.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/[0.02] dark:bg-white/[0.02] bg-slate-50 border border-white/[0.06] dark:border-white/[0.06] border-slate-200 text-slate-400 text-xs space-y-1">
            <p className="font-semibold dark:text-slate-300 text-slate-700 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              Bandwidth Optimization Note:
            </p>
            <p className="leading-relaxed">
              Video calls use standard peer-to-peer WebRTC requiring ~1 Mbps. In low-bandwidth tribal areas, audio-only mode is recommended to preserve solar tablet battery.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
