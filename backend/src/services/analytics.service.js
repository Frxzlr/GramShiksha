import { query } from '../db/pool.js'
import { listSchools } from './schools.service.js'

const pct = 'score * 100.0 / NULLIF(total, 0)'
const round1 = (n) => Number(Number(n ?? 0).toFixed(1))

// The Planner dashboard. Averages and counts are computed by Postgres with
// GROUP BY, so we receive a few summary rows instead of every result row.
// The six queries don't depend on each other, so they run in parallel.
export async function getAnalytics() {
  const [schools, resourcesRes, totalsRes, villageRes, lessonRes, liveRes] = await Promise.all([
    listSchools(),
    query(`SELECT id, school_id AS "schoolId", item, stock, needed FROM resources ORDER BY id`),
    query(`SELECT COUNT(*) AS attempts, AVG(${pct}) AS avg FROM results`),
    query(`SELECT village, AVG(${pct}) AS avg, COUNT(*) AS attempts FROM results GROUP BY village`),
    query(
      `SELECT COALESCE(NULLIF(lesson_title, ''), 'Lesson ' || lesson_id) AS lesson,
              AVG(${pct}) AS avg, COUNT(*) AS attempts
       FROM results GROUP BY 1`
    ),
    query(
      `SELECT village, AVG(mbps) AS avg_mbps, AVG(rtt_ms) AS avg_rtt, COUNT(*) AS samples,
              COUNT(*) FILTER (WHERE online) AS online_count, MAX(at) AS last_seen
       FROM connectivity GROUP BY village`
    ),
  ])
  const resources = resourcesRes.rows

  const totals = {
    schools: schools.length,
    students: schools.reduce((sum, s) => sum + (s.students || 0), 0),
    quizAttempts: totalsRes.rows[0].attempts,
    avgScorePct: round1(totalsRes.rows[0].avg),
  }

  const scoreByVillage = villageRes.rows.map((r) => ({ village: r.village, avgPct: round1(r.avg), attempts: r.attempts }))
  const villageAvg = new Map(scoreByVillage.map((v) => [v.village, v.avgPct]))
  const scoreByLesson = lessonRes.rows.map((r) => ({ lesson: r.lesson, avgPct: round1(r.avg), attempts: r.attempts }))

  const connectivity = schools.map((s) => ({
    school: s.name,
    village: s.village,
    mbps: s.internetMbps,
    uptimePct: s.uptimePct,
  }))

  const schoolName = new Map(schools.map((s) => [s.id, s.name]))
  const resourceGaps = resources
    .filter((r) => r.needed > r.stock)
    .map((r) => ({
      school: schoolName.get(r.schoolId) || `School #${r.schoolId}`,
      item: r.item,
      stock: r.stock,
      needed: r.needed,
      gap: r.needed - r.stock,
    }))
    .sort((a, b) => b.gap - a.gap)

  const priorityScore = schools.map((s) => priorityFor(s, resources, villageAvg)).sort((a, b) => b.score - a.score)

  const liveConnectivity = liveRes.rows.map((r) => ({
    village: r.village,
    avgMbps: Number(Number(r.avg_mbps).toFixed(2)),
    avgRttMs: r.avg_rtt === null ? null : Math.round(r.avg_rtt),
    uptimePct: Math.round((r.online_count / r.samples) * 100),
    samples: r.samples,
    lastSeen: r.last_seen,
  }))

  return { totals, scoreByVillage, scoreByLesson, connectivity, resourceGaps, priorityScore, liveConnectivity }
}

// 0-100 "needs attention" score: connectivity (35) + resource gaps (35) + quiz results (30).
function priorityFor(s, resources, villageAvg) {
  const reasons = []
  const mbps = s.internetMbps ?? 0
  const uptime = s.uptimePct ?? 0
  const connScore = (Math.max(0, (20 - mbps) / 20) * 0.5 + Math.max(0, (100 - uptime) / 100) * 0.5) * 35

  if (mbps === 0) reasons.push('Zero internet connectivity (0 Mbps)')
  else if (mbps < 5) reasons.push(`Severely constrained internet bandwidth (${mbps} Mbps)`)
  if (uptime < 50) reasons.push(`High network downtime (${uptime}% uptime)`)
  else if (uptime < 70) reasons.push(`Unstable internet connection (${uptime}% uptime)`)

  const own = resources.filter((r) => r.schoolId === s.id)
  const totalGap = own.reduce((sum, r) => sum + Math.max(0, r.needed - r.stock), 0)
  const gapScore = Math.min(35, (totalGap / 120) * 35)
  const top = own.filter((r) => r.needed > r.stock).sort((a, b) => b.needed - b.stock - (a.needed - a.stock))[0]
  if (top) {
    const gap = top.needed - top.stock
    reasons.push(gap >= 20 ? `Severe deficit of ${top.item} (${gap} missing)` : `Shortage of ${top.item} (${gap} needed)`)
  }
  if (s.hasComputers === 0) reasons.push('No computer systems available')

  let quizScore = 15
  const avg = villageAvg.get(s.village)
  if (avg !== undefined) {
    quizScore = Math.max(0, ((100 - avg) / 100) * 30)
    if (avg < 40) reasons.push(`Low quiz mastery (${avg.toFixed(1)}% avg)`)
    else if (avg < 65) reasons.push(`Below-average quiz comprehension (${avg.toFixed(1)}% avg)`)
  }

  if (reasons.length === 0) reasons.push('Good connectivity and adequate resource levels')
  return {
    school: s.name,
    village: s.village,
    score: Math.min(100, Math.round(connScore + gapScore + quizScore)),
    reasons,
  }
}
