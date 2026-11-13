const QUEUE_KEY = 'gs_connectivity_queue'
const QUEUE_CAP = 50

function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_CAP)))
  } catch {}
}

export function queueSample(sample) {
  try {
    const queue = getQueue()
    queue.push(sample)
    saveQueue(queue)
  } catch {}
}

export async function flushQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const queue = getQueue()
  if (!queue || queue.length === 0) return

  try {
    const batch = queue.slice(0, 50)
    const res = await fetch('/api/connectivity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    if (res.ok) {
      const remaining = queue.slice(batch.length)
      saveQueue(remaining)
      if (remaining.length > 0) {
        setTimeout(flushQueue, 1000)
      }
    }
  } catch (err) {
    console.warn('Failed to flush connectivity queue:', err)
  }
}

export async function measure() {
  // Check browser offline status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { online: false, mbps: 0, rttMs: null }
  }

  try {
    // 1. Measure RTT with tiny health request
    const rttStart = performance.now()
    const rttRes = await fetch(`/api/health?t=${Date.now()}`, { cache: 'no-store' })
    const rttMs = rttRes.ok ? Math.round(performance.now() - rttStart) : null

    // 2. Measure download throughput with ~100 KB dummy payload
    const pingStart = performance.now()
    const res = await fetch(`/api/ping?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Ping HTTP status ${res.status}`)
    }

    const blob = await res.blob()
    const pingEnd = performance.now()

    const durationSec = Math.max((pingEnd - pingStart) / 1000, 0.001)
    const bytes = blob.size || 102400
    const mbps = Number(((bytes * 8) / durationSec / 1e6).toFixed(2))

    return {
      online: true,
      mbps: Math.max(mbps, 0.01),
      rttMs,
    }
  } catch (err) {
    console.warn('Network measurement failed, checking navigator.connection fallback:', err)

    // Fall back to navigator.connection.downlink and rtt when available and the fetch fails
    const navConn =
      typeof navigator !== 'undefined' &&
      (navigator.connection || navigator.mozConnection || navigator.webkitConnection)

    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      navConn &&
      typeof navConn.downlink === 'number' &&
      navConn.downlink > 0
    ) {
      return {
        online: true,
        mbps: Number(navConn.downlink.toFixed(2)),
        rttMs: typeof navConn.rtt === 'number' ? navConn.rtt : null,
      }
    }

    return { online: false, mbps: 0, rttMs: null }
  }
}

export async function takeAndRecordSample(village) {
  const result = await measure()
  const vName =
    (typeof village === 'function' ? village() : village) || 'Malegaon Khurd'

  const sample = {
    village: vName,
    mbps: result.mbps,
    rttMs: result.rttMs,
    online: result.online,
    at: Date.now(),
  }

  if (!result.online) {
    queueSample(sample)
  } else {
    try {
      await fetch('/api/connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      })
      flushQueue()
    } catch {
      queueSample(sample)
    }
  }

  return result
}

export function startMonitoring(getVillage, onMeasure) {
  let timerId = null

  const runMeasure = async () => {
    try {
      const res = await takeAndRecordSample(getVillage)
      if (onMeasure) onMeasure(res)
    } catch (err) {
      console.warn('Measurement error in monitor:', err)
    }
  }

  const handleOnline = () => {
    flushQueue()
    runMeasure()
  }

  const handleOffline = () => {
    const vName =
      (typeof getVillage === 'function' ? getVillage() : getVillage) ||
      'Malegaon Khurd'

    queueSample({
      village: vName,
      mbps: 0,
      rttMs: null,
      online: false,
      at: Date.now(),
    })
    if (onMeasure) {
      onMeasure({ online: false, mbps: 0, rttMs: null })
    }
  }

  // Measure on start
  runMeasure()

  // Measure every 2 minutes (120000 ms)
  timerId = setInterval(runMeasure, 120000)

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  return function stop() {
    if (timerId) clearInterval(timerId)
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}
