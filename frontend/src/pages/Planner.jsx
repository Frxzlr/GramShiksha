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
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium text-sm">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow max-w-md w-full border border-red-100 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Failed to Load Dashboard</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
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

  const statCards = [
    { label: 'Total Schools', value: totals.schools ?? 0 },
    { label: 'Total Students', value: totals.students ?? 0 },
    { label: 'Quiz Attempts', value: totals.quizAttempts ?? 0 },
    { label: 'Avg Score', value: `${totals.avgScorePct ?? 0}%` }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Planner Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time analytics on village school performance, internet infrastructure, and high-priority needs.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col justify-between"
            >
              <span className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                {card.label}
              </span>
              <span className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                {card.value}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Quiz Score by Village */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Average Quiz Score by Village
            </h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={scoreByVillage}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="village"
                    tick={{ fill: '#4b5563', fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#4b5563', fontSize: 12 }}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Avg Score']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="avgPct" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Internet Connectivity by School */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Internet Connectivity by School
            </h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={connectivity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="school"
                    tick={{ fill: '#4b5563', fontSize: 12 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: '#4b5563', fontSize: 12 }}
                    unit=" Mbps"
                  />
                  <Tooltip
                    formatter={(val) => [`${val} Mbps`, 'Speed']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="mbps" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Schools Needing Attention */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Schools Needing Attention</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked list by priority score based on infrastructure deficiencies and learning metrics.
            </p>
          </div>

          {priorityScore.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No schools currently flagged for attention.</p>
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
                    ? 'bg-red-100 text-red-700'
                    : score >= 40
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'

                return (
                  <div
                    key={item.id || idx}
                    className="py-4 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
                        #{rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                            {schoolName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            ({village})
                          </span>
                        </div>
                        {reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {reasons.map((reason, rIdx) => (
                              <span
                                key={rIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:justify-end items-center pl-11 sm:pl-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                        Score: {score}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
