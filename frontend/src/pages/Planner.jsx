import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  School,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Radio,
  Flame,
} from 'lucide-react'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

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

export default function Planner({ theme = 'dark' }) {
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
      <div className="w-full space-y-6 text-left">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to Load Dashboard"
        description={error}
        action={
          <Button variant="primary" onClick={fetchAnalytics}>
            Retry Analytics
          </Button>
        }
      />
    )
  }

  const totals = data?.totals || {}
  const scoreByVillage = Array.isArray(data?.scoreByVillage)
    ? data.scoreByVillage.map((item) => ({
        village: item.village || item.name || '',
        avgPct: item.avgPct ?? item.score ?? 0,
      }))
    : []

  const connectivity = Array.isArray(data?.connectivity)
    ? data.connectivity.map((item) => ({
        ...item,
        school: item.school || item.schoolName || item.name || 'School',
        mbps: item.mbps ?? 0,
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

  const isDark = theme === 'dark'
  const tickColor = isDark ? '#94a3b8' : '#475569'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)'
  const tooltipBg = isDark ? '#111a2e' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)'
  const tooltipText = isDark ? '#f8fafc' : '#0f172a'

  return (
    <div className="w-full space-y-6 text-left">
      {/* Dashboard Header Card */}
      <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="sm" dot>
                Live Telemetry
              </Badge>
              <Badge variant="cyan" size="sm">
                District Level
              </Badge>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
              Planner & Infrastructure Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Multi-factor deficit analytics, live network speeds, and academic priority scores.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={TrendingUp}
            onClick={fetchAnalytics}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          label="Village Schools"
          value={totals.schools ?? 0}
          sublabel="Tracked across districts"
          icon={School}
          variant="emerald"
        />
        <StatCard
          label="Total Learners"
          value={(totals.students ?? 0).toLocaleString()}
          sublabel="Enrolled grades 6–8"
          icon={Users}
          variant="cyan"
        />
        <StatCard
          label="Quiz Submissions"
          value={(totals.quizAttempts ?? 0).toLocaleString()}
          sublabel="Total recorded tests"
          icon={CheckCircle2}
          variant="purple"
        />
        <StatCard
          label="Average Mastery"
          value={`${totals.avgScorePct ?? 0}%`}
          sublabel="District comprehension"
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Recharts Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Average Quiz Score by Village */}
        <Card className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold dark:text-white text-slate-900">
                Average Quiz Score by Village
              </h3>
              <p className="text-xs text-slate-400">Comprehension index per settlement</p>
            </div>
            <Badge variant="emerald" size="sm">
              Academic
            </Badge>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={scoreByVillage}
                margin={{ top: 15, right: 10, left: -20, bottom: 35 }}
              >
                <defs>
                  <linearGradient id="quizBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="village"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  unit="%"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Avg Score']}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: '14px',
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    color: tooltipText,
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="avgPct"
                  fill="url(#quizBarGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Internet Connectivity by School */}
        <Card className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold dark:text-white text-slate-900">
                School Bandwidth (Mbps)
              </h3>
              <p className="text-xs text-slate-400">Peak cellular throughput</p>
            </div>
            <Badge variant="cyan" size="sm">
              Network
            </Badge>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={connectivity}
                margin={{ top: 15, right: 10, left: -20, bottom: 45 }}
              >
                <defs>
                  <linearGradient id="connBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="school"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: tickColor, fontSize: 11 }}
                  unit="M"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} Mbps`, 'Throughput']}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: '14px',
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    color: tooltipText,
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="mbps"
                  fill="url(#connBarGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Schools Needing Attention */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              Schools Needing Attention
            </h3>
            <p className="text-xs text-slate-400">
              Composite priority ranking (0–100) weighing connectivity downtime, hardware shortages, and quiz deficits.
            </p>
          </div>
          <Badge variant="amber" size="sm">
            Action Priority
          </Badge>
        </div>

        {priorityScore.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No schools currently flagged for attention.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06] dark:divide-white/[0.06] divide-slate-200/80">
            {priorityScore.map((item, idx) => {
              const rank = item.rank ?? idx + 1
              const schoolName = item.school || item.schoolName || item.name || 'Unknown School'
              const village = item.village || 'Unknown Village'
              const score = typeof item.score === 'number' ? item.score : item.priorityScore ?? 0
              const reasons = Array.isArray(item.reasons)
                ? item.reasons
                : item.reason
                ? [item.reason]
                : []

              const isCritical = score >= 70
              const isModerate = score >= 40

              return (
                <div
                  key={item.id || idx}
                  className="py-4 first:pt-2 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-xl font-heading font-bold text-xs flex items-center justify-center border ${
                        isCritical
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : isModerate
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      #{rank}
                    </span>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="font-heading font-bold dark:text-white text-slate-900 text-sm sm:text-base group-hover:text-emerald-400 transition-colors">
                          {schoolName}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          ({village})
                        </span>
                      </div>

                      {/* Reasons as small badges */}
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {reasons.map((reason, rIdx) => (
                            <Badge
                              key={rIdx}
                              variant={isCritical ? 'red' : isModerate ? 'amber' : 'neutral'}
                              size="sm"
                            >
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Priority score with mini progress bar */}
                  <div className="flex items-center gap-3 self-end sm:self-center pl-11 sm:pl-0 shrink-0">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Priority
                      </span>
                      <div className="w-20 h-1.5 bg-white/[0.08] dark:bg-white/[0.08] bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical
                              ? 'bg-rose-500'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                    </div>

                    <Badge
                      variant={isCritical ? 'red' : isModerate ? 'amber' : 'emerald'}
                      size="md"
                      className="font-bold tabular-nums"
                    >
                      Score: {score}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Live connectivity from devices */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              Live Connectivity from Field Tablets
            </h3>
            <p className="text-xs text-slate-400">
              Decentralized ping measurements captured directly by client tablets during student sessions.
            </p>
          </div>
          <Badge variant="cyan" size="sm">
            Active Telemetry
          </Badge>
        </div>

        {liveConnectivity.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No device readings yet. Connect edge devices to transmit metrics.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Live Throughput Bar Chart */}
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={liveConnectivity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                >
                  <defs>
                    <linearGradient id="liveBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="village"
                    tick={{ fill: tickColor, fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: tickColor, fontSize: 11 }}
                    unit="M"
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} Mbps`, 'Live Speed']}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderRadius: '14px',
                      border: `1px solid ${tooltipBorder}`,
                      color: tooltipText,
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="avgMbps"
                    fill="url(#liveBarGrad)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live telemetry table with sticky header */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08] dark:border-white/[0.08] border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100/70 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th scope="col" className="px-4 py-3">Settlement</th>
                    <th scope="col" className="px-4 py-3 text-center">Avg Throughput</th>
                    <th scope="col" className="px-4 py-3 text-center">Uptime Metric</th>
                    <th scope="col" className="px-4 py-3 text-center">Last Ping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] dark:divide-white/[0.04] divide-slate-100">
                  {liveConnectivity.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium dark:text-white text-slate-900">
                        {item.village}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-400 tabular-nums">
                        {item.avgMbps} Mbps
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            item.uptimePct >= 80
                              ? 'emerald'
                              : item.uptimePct >= 50
                              ? 'amber'
                              : 'red'
                          }
                          size="sm"
                        >
                          {item.uptimePct}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">
                        {item.lastSeen ? new Date(item.lastSeen).toLocaleTimeString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
