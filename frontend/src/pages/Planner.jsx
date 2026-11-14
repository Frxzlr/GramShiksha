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
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { Card, CardHeader } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../components/Table'

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
      <div className="w-full space-y-5 text-left">
        <Skeleton className="h-10 w-64 rounded-[6px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 w-full rounded-[8px]" />
          <Skeleton className="h-24 w-full rounded-[8px]" />
          <Skeleton className="h-24 w-full rounded-[8px]" />
          <Skeleton className="h-24 w-full rounded-[8px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 w-full rounded-[8px]" />
          <Skeleton className="h-72 w-full rounded-[8px]" />
        </div>
        <Skeleton className="h-64 w-full rounded-[8px]" />
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
          <Button variant="secondary" onClick={fetchAnalytics}>
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
  const tickColor = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f4f4f5'
  const tooltipBg = isDark ? '#111214' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e4e4e7'
  const tooltipText = isDark ? '#f4f4f5' : '#09090b'

  return (
    <div className="w-full space-y-5 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
            Planner & Infrastructure
          </h2>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
            Deficit analytics, bandwidth telemetry, and academic intervention scoring across rural clusters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm" dot>
            Live Telemetry
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={fetchAnalytics}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Village Schools"
          value={totals.schools ?? 0}
          sublabel="Tracked across district"
        />
        <StatCard
          label="Total Learners"
          value={(totals.students ?? 0).toLocaleString()}
          sublabel="Enrolled grades 6–8"
        />
        <StatCard
          label="Quiz Submissions"
          value={(totals.quizAttempts ?? 0).toLocaleString()}
          sublabel="Total recorded tests"
        />
        <StatCard
          label="Average Mastery"
          value={`${totals.avgScorePct ?? 0}%`}
          sublabel="District comprehension"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Average Quiz Score by Village */}
        <Card className="min-w-0 space-y-3">
          <CardHeader
            title="Average Quiz Score by Village"
            description="Comprehension index per settlement"
            badge={
              <Badge variant="neutral" size="sm">
                Academic
              </Badge>
            }
          />

          <div className="w-full h-[260px] pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={scoreByVillage}
                margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
              >
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
                  tick={{ fill: tickColor, fontSize: 11, fontFamily: 'monospace' }}
                  unit="%"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Avg Score']}
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: '6px',
                    border: `1px solid ${tooltipBorder}`,
                    color: tooltipText,
                    fontSize: '12px',
                    padding: '6px 10px',
                    boxShadow: 'none',
                  }}
                />
                <Bar
                  dataKey="avgPct"
                  fill="#22c55e"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Internet Connectivity by School */}
        <Card className="min-w-0 space-y-3">
          <CardHeader
            title="School Bandwidth (Mbps)"
            description="Cellular and backhaul throughput"
            badge={
              <Badge variant="neutral" size="sm">
                Network
              </Badge>
            }
          />

          <div className="w-full h-[260px] pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={connectivity}
                margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
              >
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
                  tick={{ fill: tickColor, fontSize: 11, fontFamily: 'monospace' }}
                  unit="M"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${val} Mbps`, 'Throughput']}
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: '6px',
                    border: `1px solid ${tooltipBorder}`,
                    color: tooltipText,
                    fontSize: '12px',
                    padding: '6px 10px',
                    boxShadow: 'none',
                  }}
                />
                <Bar
                  dataKey="mbps"
                  fill="#22c55e"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Schools Needing Attention */}
      <Card className="space-y-4">
        <CardHeader
          title="Schools Needing Attention"
          description="Composite ranking weighing connectivity downtime, hardware shortages, and quiz deficits"
          badge={
            <Badge variant="amber" size="sm" dot>
              Deficit Matrix
            </Badge>
          }
        />

        {priorityScore.length === 0 ? (
          <p className="text-sm text-zinc-400 py-6 text-center">
            No schools currently flagged for attention.
          </p>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell className="w-16">Rank</TableHeaderCell>
                <TableHeaderCell>School</TableHeaderCell>
                <TableHeaderCell>Settlement</TableHeaderCell>
                <TableHeaderCell>Deficit Indicators</TableHeaderCell>
                <TableHeaderCell className="text-right">Priority Score</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
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
                  <TableRow key={item.id || idx} isShortage={isCritical}>
                    <TableCell mono className="font-semibold text-zinc-400">
                      #{rank}
                    </TableCell>
                    <TableCell className="font-medium text-white dark:text-white text-zinc-900">
                      {schoolName}
                    </TableCell>
                    <TableCell className="text-zinc-400 dark:text-zinc-400 text-zinc-600">
                      {village}
                    </TableCell>
                    <TableCell>
                      {reasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
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
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={isCritical ? 'red' : isModerate ? 'amber' : 'emerald'}
                        size="sm"
                        className="font-mono tabular-nums font-semibold"
                      >
                        {score} / 100
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Live connectivity from devices */}
      <Card className="space-y-4">
        <CardHeader
          title="Field Tablet Telemetry"
          description="Decentralized latency and throughput pings captured during active student sessions"
          badge={
            <Badge variant="emerald" size="sm" dot>
              Active Edge Nodes
            </Badge>
          }
        />

        {liveConnectivity.length === 0 ? (
          <p className="text-sm text-zinc-400 py-6 text-center">
            No device readings yet. Connect edge devices to transmit metrics.
          </p>
        ) : (
          <div className="space-y-5">
            {/* Live Throughput Bar Chart */}
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={liveConnectivity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                >
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
                    tick={{ fill: tickColor, fontSize: 11, fontFamily: 'monospace' }}
                    unit="M"
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} Mbps`, 'Live Speed']}
                    cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderRadius: '6px',
                      border: `1px solid ${tooltipBorder}`,
                      color: tooltipText,
                      fontSize: '12px',
                      padding: '6px 10px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar
                    dataKey="avgMbps"
                    fill="#22c55e"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live telemetry table */}
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Settlement</TableHeaderCell>
                  <TableHeaderCell className="text-center">Avg Throughput</TableHeaderCell>
                  <TableHeaderCell className="text-center">Uptime Metric</TableHeaderCell>
                  <TableHeaderCell className="text-right">Last Ping</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {liveConnectivity.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-white dark:text-white text-zinc-900">
                      {item.village}
                    </TableCell>
                    <TableCell mono className="text-center font-semibold text-[#22c55e]">
                      {item.avgMbps} Mbps
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          item.uptimePct >= 80
                            ? 'emerald'
                            : item.uptimePct >= 50
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                        dot
                      >
                        {item.uptimePct}%
                      </Badge>
                    </TableCell>
                    <TableCell mono className="text-right text-xs text-zinc-400">
                      {item.lastSeen ? new Date(item.lastSeen).toLocaleTimeString() : 'Just now'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
