import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const fetchApi = async (url, options) => {
  try {
    const res = await fetch(url, options)
    const ct = res.headers.get('content-type') || ''
    if (res.ok && ct.includes('application/json')) return res
  } catch {
    // fallback
  }
  return fetch(`http://localhost:4000${url}`, options)
}

export default function Planner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi('/api/analytics')
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics (Status ${res.status})`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Unable to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    const loadData = async () => {
      try {
        const res = await fetchApi('/api/analytics')
        if (!res.ok) {
          throw new Error(`Failed to fetch analytics (Status ${res.status})`)
        }
        const json = await res.json()
        if (!ignore) {
          setData(json)
          setLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching analytics:', err)
          setError(err.message || 'Unable to load analytics data')
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 font-semibold text-base">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full my-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-red-200 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900">Failed to Load Dashboard</h2>
        <p className="text-base text-red-600">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="min-h-[44px] px-6 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl text-base transition cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    )
  }

  const totals = data?.totals || {}
  const scoreByVillage = Array.isArray(data?.scoreByVillage)
    ? data.scoreByVillage.map(item => ({
        village: item.village || item.name || '',
        avgPct: item.avgPct ?? item.score ?? 0
      }))
    : []

  const connectivity = Array.isArray(data?.connectivity)
    ? data.connectivity.map(item => ({
        ...item,
        school: item.school || item.schoolName || item.name || 'School',
        mbps: item.mbps ?? 0
      }))
    : []

  const priorityScore = Array.isArray(data?.priorityScore)
    ? data.priorityScore
    : Array.isArray(data?.schoolsNeedingAttention)
    ? data.schoolsNeedingAttention
    : []

  const liveConnectivity = Array.isArray(data?.liveConnectivity)
    ? data.liveConnectivity
    : []

  const statCards = [
    { label: 'Total Schools', value: totals.schools ?? 0 },
    { label: 'Total Students', value: totals.students ?? 0 },
    { label: 'Quiz Attempts', value: totals.quizAttempts ?? 0 },
    { label: 'Avg Score', value: `${totals.avgScorePct ?? 0}%` }
  ]

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Planner Dashboard</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Real-time analytics on village school performance, internet infrastructure, and high-priority needs.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-green-100 flex flex-col justify-between"
          >
            <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-green-700 mt-2">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Average Quiz Score by Village */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Average Quiz Score by Village
          </h3>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={scoreByVillage}
                margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                <XAxis
                  dataKey="village"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#374151', fontSize: 12 }}
                  unit="%"
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Avg Score']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Bar dataKey="avgPct" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Internet Connectivity by School */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Internet Connectivity by School (Mbps)
          </h3>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={connectivity}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff6ff" />
                <XAxis
                  dataKey="school"
                  tick={{ fill: '#374151', fontSize: 12 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tick={{ fill: '#374151', fontSize: 12 }}
                  unit=" Mbps"
                />
                <Tooltip
                  formatter={(val) => [`${val} Mbps`, 'Speed']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Bar dataKey="mbps" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Schools Needing Attention */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Schools Needing Attention</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Ranked list by priority score based on connectivity deficits, learning mastery, and equipment gaps.
          </p>
        </div>

        {priorityScore.length === 0 ? (
          <p className="text-base text-gray-500 py-6 text-center">No schools currently flagged for attention.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {priorityScore.map((item, idx) => {
              const rank = item.rank ?? idx + 1
              const schoolName = item.school || item.schoolName || item.name || 'Unknown School'
              const village = item.village || 'Unknown Village'
              const score = typeof item.score === 'number' ? item.score : (item.priorityScore ?? 0)
              const reasons = Array.isArray(item.reasons)
                ? item.reasons
                : item.reason
                ? [item.reason]
                : []

              const badgeColor =
                score >= 70
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : score >= 40
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-green-100 text-green-800 border border-green-300'

              return (
                <div
                  key={item.id || idx}
                  className="py-4 first:pt-2 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                      #{rank}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-base sm:text-lg">
                          {schoolName}
                        </h4>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          ({village})
                        </span>
                      </div>
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-900 border border-green-200"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:justify-end items-center pl-11 sm:pl-0 shrink-0">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold min-h-[32px] flex items-center justify-center ${badgeColor}`}>
                      Score: {score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Live connectivity from devices */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Live connectivity from devices</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Real-time ping latency and download throughput sampled by client tablets in the field.
          </p>
        </div>

        {liveConnectivity.length === 0 ? (
          <p className="text-base text-gray-500 py-6 text-center font-medium">
            No device readings yet
          </p>
        ) : (
          <div className="space-y-6">
            {/* Recharts BarChart of avgMbps per village */}
            <div className="w-full h-[260px] pt-1">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={liveConnectivity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                  <XAxis
                    dataKey="village"
                    tick={{ fill: '#374151', fontSize: 12 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    tick={{ fill: '#374151', fontSize: 12 }}
                    unit=" Mbps"
                  />
                  <Tooltip
                    formatter={(val) => [`${val} Mbps`, 'Avg Live Speed']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #bbf7d0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '14px',
                    }}
                  />
                  <Bar dataKey="avgMbps" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Small table with uptimePct and lastSeen */}
            <div className="overflow-x-auto rounded-xl border border-green-100">
              <table className="w-full text-left border-collapse text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-green-50/70 border-b border-green-100 text-xs font-bold text-green-950 uppercase tracking-wider">
                    <th scope="col" className="px-4 py-3">Village</th>
                    <th scope="col" className="px-4 py-3 text-center">Avg Speed</th>
                    <th scope="col" className="px-4 py-3 text-center">Uptime</th>
                    <th scope="col" className="px-4 py-3 text-center">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {liveConnectivity.map((item, idx) => (
                    <tr key={idx} className="even:bg-gray-50/50 hover:bg-green-50/30">
                      <td className="px-4 py-3 font-semibold text-gray-900">{item.village}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{item.avgMbps} Mbps</td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.uptimePct >= 80
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : item.uptimePct >= 50
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {item.uptimePct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-mono">
                        {item.lastSeen ? new Date(item.lastSeen).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
