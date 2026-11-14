import { useState, useEffect } from 'react'
import {
  Video,
  Copy,
  Check,
  WifiOff,
  Info,
} from 'lucide-react'
import { Card, CardHeader } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Segmented } from '../components/Segmented'

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
    <div className="w-full space-y-5 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
            Virtual Classroom
          </h2>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
            Peer-to-peer WebRTC video sessions connecting rural clusters with remote volunteer instructors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="emerald" size="sm" dot>
              Network Connected
            </Badge>
          ) : (
            <Badge variant="red" size="sm" dot>
              Offline
            </Badge>
          )}
          <Badge variant="neutral" size="sm">
            WebRTC
          </Badge>
        </div>
      </div>

      {/* Main Interactive Meeting Card */}
      <Card className="space-y-5">
        <CardHeader
          title="Session Configuration"
          description={`Assigned room: ${village}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Village Context */}
          <div className="p-3.5 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Assigned School Location
            </span>
            <p className="text-[15px] font-semibold text-white dark:text-white text-zinc-900">
              {village}
            </p>
          </div>

          {/* Standard / Class Selector */}
          <div className="p-3.5 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 space-y-2">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Select Grade
            </span>
            <Segmented
              options={[
                { label: 'Class 6', value: '6' },
                { label: 'Class 7', value: '7' },
                { label: 'Class 8', value: '8' },
              ]}
              value={selectedClass}
              onChange={setSelectedClass}
              className="w-full"
            />
          </div>
        </div>

        {/* Meeting URL & Quick Actions */}
        <div className="p-4 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 bg-[#16181c] dark:bg-[#16181c] bg-zinc-50 space-y-3">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Classroom Stream Endpoint
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="flex-1 h-9 bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 rounded-[6px] px-3 text-[12px] text-zinc-300 dark:text-zinc-300 text-zinc-700 font-mono select-all focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Join Button */}
          <Button
            variant="primary"
            size="md"
            icon={Video}
            disabled={!isOnline}
            onClick={handleJoin}
            className="w-full"
          >
            {isOnline ? `Launch Classroom Session (Class ${selectedClass})` : 'Video Stream Unavailable Offline'}
          </Button>
        </div>

        {/* Status Notices */}
        <div className="space-y-3">
          {!isOnline && (
            <div className="p-3 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-2.5 text-[13px]">
              <WifiOff className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-semibold">Network Disconnected:</span> Live video streams require an active uplink. Precached lesson modules remain available offline.
              </div>
            </div>
          )}

          <div className="p-3 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 text-zinc-400 text-[12px] space-y-1">
            <p className="font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              Bandwidth Conservation
            </p>
            <p className="leading-relaxed">
              Video calls use standard peer-to-peer WebRTC requiring ~1 Mbps. On low-bandwidth 2G/cellular links, students can disable the incoming camera feed to conserve tablet battery and bandwidth.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
