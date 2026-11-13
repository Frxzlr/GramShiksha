import { useState, useEffect } from 'react'

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
  const villageSlug = village
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
      {/* Header Info Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-green-100 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>📹</span>
            <span>Virtual Classroom</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Connect live with volunteer teachers and peer students in rural classrooms across India.
          </p>
        </div>

        {/* Current Village & Class Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Village Info */}
          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 space-y-1">
            <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
              Assigned Village School
            </span>
            <p className="text-lg font-bold text-gray-900">{village}</p>
          </div>

          {/* Class Selector */}
          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 space-y-1">
            <label
              htmlFor="class-select"
              className="block text-xs font-bold text-green-800 uppercase tracking-wider"
            >
              Select Standard / Class
            </label>
            <div className="flex gap-2 pt-1">
              {['6', '7', '8'].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`flex-1 min-h-[44px] rounded-xl font-bold text-base transition-all cursor-pointer flex items-center justify-center ${
                    selectedClass === cls
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-white text-green-900 border border-green-200 hover:bg-green-100/60'
                  }`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meeting Link & Controls */}
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Classroom Video Room
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="flex-1 min-h-[44px] bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm sm:text-base text-gray-800 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[44px] px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 active:scale-95 text-gray-700 font-semibold text-sm rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Join Button */}
          <div>
            <button
              type="button"
              onClick={handleJoin}
              disabled={!isOnline}
              className="w-full min-h-[48px] px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-bold text-base rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Join Live Class (Class {selectedClass})</span>
            </button>
          </div>
        </div>

        {/* Connectivity warnings & Offline fallbacks */}
        <div className="space-y-3 pt-2">
          {/* Offline warning / fallback message */}
          {!isOnline && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 text-sm sm:text-base font-semibold flex items-center gap-2.5 shadow-xs">
              <span className="text-xl">⚠️</span>
              <div>
                <p>You are currently offline. Live video is disabled.</p>
                <p className="font-normal text-amber-800 text-sm mt-0.5">
                  Recorded lessons work offline in the Student tab.
                </p>
              </div>
            </div>
          )}

          {/* Live video bandwidth note */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs sm:text-sm space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>Internet Requirement Notice:</span>
            </p>
            <p className="text-blue-800 leading-relaxed">
              Live interactive video requires an active internet connection (minimum 1 Mbps recommended).
              When connectivity is unavailable or bandwidth drops, <strong>recorded lessons work offline in the Student tab</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
