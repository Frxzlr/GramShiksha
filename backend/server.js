import express from 'express'
import cors from 'cors'
import fs from 'fs'

const FILE = './data.json'

const seed = {
  lessons: [
    {
      id: 1,
      title: 'The Water Cycle',
      summary: 'Water evaporates from rivers and oceans, forms clouds, and returns as rain. This cycle keeps our wells and fields supplied.',
      summary_hi: 'नदियों और समुद्र का पानी भाप बनकर बादल बनाता है और फिर बारिश के रूप में लौटता है। इसी चक्र से हमारे कुएँ और खेत भरते हैं।',
      quiz: [
        { q: 'What turns water into vapour?', options: ["Sun's heat", 'Moon', 'Soil'], answer: 0 },
        { q: 'What is water falling from clouds called?', options: ['Evaporation', 'Precipitation', 'Condensation'], answer: 1 },
      ],
    },
    {
      id: 2,
      title: 'Photosynthesis',
      summary: 'Plants use sunlight, water and carbon dioxide to make their own food, and they release oxygen.',
      summary_hi: 'पौधे सूरज की रोशनी, पानी और कार्बन डाइऑक्साइड से अपना भोजन बनाते हैं और ऑक्सीजन छोड़ते हैं।',
      quiz: [
        { q: 'Which gas do plants release?', options: ['Oxygen', 'Nitrogen', 'Smoke'], answer: 0 },
        { q: 'What gives leaves their green colour?', options: ['Chlorophyll', 'Soil', 'Water'], answer: 0 },
      ],
    },
    {
      id: 3,
      title: 'Fractions',
      summary: 'A fraction shows part of a whole. In 3/4, 3 is the numerator and 4 is the denominator.',
      summary_hi: 'भिन्न किसी पूरे का एक हिस्सा दिखाती है। 3/4 में 3 अंश है और 4 हर है।',
      quiz: [
        { q: 'In 1/2, which number is the denominator?', options: ['1', '2', '3'], answer: 1 },
        { q: 'Which fraction is the biggest?', options: ['1/4', '1/2', '1/8'], answer: 1 },
      ],
    },
  ],
  schools: [
    {
      id: 1,
      name: 'Govt Model High School Malegaon',
      village: 'Malegaon Khurd',
      district: 'Pune, Maharashtra',
      students: 145,
      teachers: 6,
      internetMbps: 12,
      uptimePct: 88,
      hasComputers: 8,
    },
    {
      id: 2,
      name: 'Rajkiya Prathmik Vidyalaya Dholera',
      village: 'Dholera',
      district: 'Ahmedabad, Gujarat',
      students: 180,
      teachers: 8,
      internetMbps: 18,
      uptimePct: 94,
      hasComputers: 12,
    },
    {
      id: 3,
      name: 'Govt Upper Primary School Shivgarh',
      village: 'Shivgarh',
      district: 'Rae Bareli, Uttar Pradesh',
      students: 230,
      teachers: 4,
      internetMbps: 2,
      uptimePct: 45,
      hasComputers: 2,
    },
    {
      id: 4,
      name: 'Adarsh Gramin Vidyalaya Chhotaki',
      village: 'Chhotaki Chenari',
      district: 'Rohtas, Bihar',
      students: 310,
      teachers: 5,
      internetMbps: 1,
      uptimePct: 35,
      hasComputers: 1,
    },
    {
      id: 5,
      name: 'Govt Ashram High School Paderu',
      village: 'Paderu',
      district: 'Alluri Sitharama Raju, Andhra Pradesh',
      students: 165,
      teachers: 5,
      internetMbps: 3,
      uptimePct: 52,
      hasComputers: 3,
    },
    {
      id: 6,
      name: 'Kasturba Gandhi Balika Vidyalaya Ramgarh',
      village: 'Ramgarh',
      district: 'Jaisalmer, Rajasthan',
      students: 125,
      teachers: 4,
      internetMbps: 4,
      uptimePct: 62,
      hasComputers: 4,
    },
    {
      id: 7,
      name: 'Govt Higher Secondary School Sonapur',
      village: 'Sonapur',
      district: 'Kamrup Metropolitan, Assam',
      students: 215,
      teachers: 7,
      internetMbps: 8,
      uptimePct: 76,
      hasComputers: 6,
    },
    {
      id: 8,
      name: 'Govt Primary School Bargi',
      village: 'Bargi',
      district: 'Jabalpur, Madhya Pradesh',
      students: 195,
      teachers: 3,
      internetMbps: 0,
      uptimePct: 18,
      hasComputers: 0,
    },
  ],
  resources: [
    { id: 1, schoolId: 1, item: 'textbooks', stock: 140, needed: 145 },
    { id: 2, schoolId: 1, item: 'tablets', stock: 15, needed: 20 },
    { id: 3, schoolId: 1, item: 'projectors', stock: 2, needed: 2 },
    { id: 4, schoolId: 1, item: 'science kits', stock: 4, needed: 5 },
    { id: 5, schoolId: 1, item: 'solar chargers', stock: 3, needed: 3 },

    { id: 6, schoolId: 2, item: 'textbooks', stock: 180, needed: 180 },
    { id: 7, schoolId: 2, item: 'tablets', stock: 24, needed: 25 },
    { id: 8, schoolId: 2, item: 'projectors', stock: 3, needed: 3 },
    { id: 9, schoolId: 2, item: 'science kits', stock: 6, needed: 6 },
    { id: 10, schoolId: 2, item: 'solar chargers', stock: 5, needed: 5 },

    { id: 11, schoolId: 3, item: 'textbooks', stock: 120, needed: 230 },
    { id: 12, schoolId: 3, item: 'tablets', stock: 2, needed: 25 },
    { id: 13, schoolId: 3, item: 'projectors', stock: 0, needed: 2 },
    { id: 14, schoolId: 3, item: 'science kits', stock: 1, needed: 6 },
    { id: 15, schoolId: 3, item: 'solar chargers', stock: 1, needed: 4 },

    { id: 16, schoolId: 4, item: 'textbooks', stock: 150, needed: 310 },
    { id: 17, schoolId: 4, item: 'tablets', stock: 0, needed: 30 },
    { id: 18, schoolId: 4, item: 'projectors', stock: 0, needed: 3 },
    { id: 19, schoolId: 4, item: 'science kits', stock: 0, needed: 8 },
    { id: 20, schoolId: 4, item: 'solar chargers', stock: 0, needed: 6 },

    { id: 21, schoolId: 5, item: 'textbooks', stock: 110, needed: 165 },
    { id: 22, schoolId: 5, item: 'tablets', stock: 4, needed: 20 },
    { id: 23, schoolId: 5, item: 'projectors', stock: 1, needed: 2 },
    { id: 24, schoolId: 5, item: 'science kits', stock: 2, needed: 5 },
    { id: 25, schoolId: 5, item: 'solar chargers', stock: 2, needed: 6 },

    { id: 26, schoolId: 6, item: 'textbooks', stock: 95, needed: 125 },
    { id: 27, schoolId: 6, item: 'tablets', stock: 5, needed: 15 },
    { id: 28, schoolId: 6, item: 'projectors', stock: 1, needed: 2 },
    { id: 29, schoolId: 6, item: 'science kits', stock: 2, needed: 4 },
    { id: 30, schoolId: 6, item: 'solar chargers', stock: 4, needed: 8 },

    { id: 31, schoolId: 7, item: 'textbooks', stock: 190, needed: 215 },
    { id: 32, schoolId: 7, item: 'tablets', stock: 12, needed: 20 },
    { id: 33, schoolId: 7, item: 'projectors', stock: 2, needed: 3 },
    { id: 34, schoolId: 7, item: 'science kits', stock: 4, needed: 6 },
    { id: 35, schoolId: 7, item: 'solar chargers', stock: 3, needed: 5 },

    { id: 36, schoolId: 8, item: 'textbooks', stock: 70, needed: 195 },
    { id: 37, schoolId: 8, item: 'tablets', stock: 0, needed: 25 },
    { id: 38, schoolId: 8, item: 'projectors', stock: 0, needed: 2 },
    { id: 39, schoolId: 8, item: 'science kits', stock: 0, needed: 6 },
    { id: 40, schoolId: 8, item: 'solar chargers', stock: 0, needed: 8 },
  ],
  results: [
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Malegaon Khurd', score: 2, total: 2, at: 1792070100000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Malegaon Khurd', score: 2, total: 2, at: 1792502600000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Malegaon Khurd', score: 1, total: 2, at: 1793019900000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Malegaon Khurd', score: 2, total: 2, at: 1793710800000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Malegaon Khurd', score: 2, total: 2, at: 1794290600000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Dholera', score: 2, total: 2, at: 1792159200000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Dholera', score: 2, total: 2, at: 1792677300000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Dholera', score: 2, total: 2, at: 1793183400000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Dholera', score: 1, total: 2, at: 1793886600000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Dholera', score: 2, total: 2, at: 1794455100000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Shivgarh', score: 1, total: 2, at: 1792241100000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Shivgarh', score: 0, total: 2, at: 1792768800000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Shivgarh', score: 1, total: 2, at: 1793340300000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Shivgarh', score: 0, total: 2, at: 1793951400000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Shivgarh', score: 1, total: 2, at: 1794383400000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Chhotaki Chenari', score: 0, total: 2, at: 1792331400000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Chhotaki Chenari', score: 1, total: 2, at: 1792854600000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Chhotaki Chenari', score: 0, total: 2, at: 1793451600000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Chhotaki Chenari', score: 0, total: 2, at: 1794040500000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Chhotaki Chenari', score: 1, total: 2, at: 1794564600000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Paderu', score: 1, total: 2, at: 1792417800000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Paderu', score: 1, total: 2, at: 1792936800000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Paderu', score: 2, total: 2, at: 1793502900000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Paderu', score: 0, total: 2, at: 1794131100000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Paderu', score: 1, total: 2, at: 1794476400000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Ramgarh', score: 1, total: 2, at: 1792502700000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Ramgarh', score: 2, total: 2, at: 1793027700000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Ramgarh', score: 1, total: 2, at: 1793555400000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Ramgarh', score: 1, total: 2, at: 1794214800000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Ramgarh', score: 2, total: 2, at: 1794550500000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Sonapur', score: 2, total: 2, at: 1792588200000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Sonapur', score: 1, total: 2, at: 1793107800000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Sonapur', score: 2, total: 2, at: 1793618400000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Sonapur', score: 2, total: 2, at: 1794172800000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Sonapur', score: 1, total: 2, at: 1794419400000 },

    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Bargi', score: 0, total: 2, at: 1792678800000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Bargi', score: 0, total: 2, at: 1793199900000 },
    { lessonId: 3, lessonTitle: 'Fractions', village: 'Bargi', score: 1, total: 2, at: 1793710500000 },
    { lessonId: 1, lessonTitle: 'The Water Cycle', village: 'Bargi', score: 0, total: 2, at: 1794295200000 },
    { lessonId: 2, lessonTitle: 'Photosynthesis', village: 'Bargi', score: 1, total: 2, at: 1794598200000 },
  ],
  connectivity: [],
}

const load = () => {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify(seed, null, 2))
    return JSON.parse(JSON.stringify(seed))
  }
  let db
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    db = JSON.parse(JSON.stringify(seed))
  }
  let modified = false
  for (const key of Object.keys(seed)) {
    if (db[key] === undefined) {
      db[key] = JSON.parse(JSON.stringify(seed[key]))
      modified = true
    } else if (key === 'results' && Array.isArray(db[key]) && db[key].length === 0 && seed.results.length > 0) {
      db[key] = JSON.parse(JSON.stringify(seed[key]))
      modified = true
    }
  }
  if (modified) save(db)
  return db
}
const save = (db) => fs.writeFileSync(FILE, JSON.stringify(db, null, 2))

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.get('/api/lessons', (_, res) => res.json(load().lessons))

app.post('/api/lessons', (req, res) => {
  const db = load()
  const lesson = { id: Date.now(), ...req.body }
  db.lessons.push(lesson)
  save(db)
  res.json(lesson)
})

app.get('/api/results', (_, res) => res.json(load().results))

app.post('/api/results', (req, res) => {
  const db = load()
  const items = Array.isArray(req.body) ? req.body : [req.body]
  db.results.push(...items)
  save(db)
  res.json({ ok: true, total: db.results.length })
})

const pingPayload = 'GramShiksha connectivity measurement ping payload. '.repeat(1970) // ~100 KB
app.get('/api/ping', (_, res) => {
  res.set('Cache-Control', 'no-store')
  res.set('Content-Type', 'text/plain; charset=utf-8')
  res.send(pingPayload)
})

app.get('/api/connectivity', (_, res) => res.json(load().connectivity || []))

app.post('/api/connectivity', (req, res) => {
  const db = load()
  db.connectivity = db.connectivity || []
  const rawItems = Array.isArray(req.body) ? req.body : [req.body]
  const validItems = []

  for (const item of rawItems) {
    if (
      item &&
      typeof item.village === 'string' &&
      item.village.trim() &&
      typeof item.mbps === 'number' &&
      !isNaN(item.mbps) &&
      (item.rttMs === null || item.rttMs === undefined || (typeof item.rttMs === 'number' && !isNaN(item.rttMs))) &&
      typeof item.online === 'boolean' &&
      typeof item.at === 'number' &&
      !isNaN(item.at)
    ) {
      validItems.push({
        village: item.village.trim(),
        mbps: Number(item.mbps),
        rttMs: typeof item.rttMs === 'number' ? Number(item.rttMs) : null,
        online: Boolean(item.online),
        at: Number(item.at),
      })
    }
  }

  const batch = validItems.slice(0, 50)
  if (batch.length > 0) {
    db.connectivity.push(...batch)
    if (db.connectivity.length > 500) {
      db.connectivity = db.connectivity.slice(-500)
    }
    save(db)
  }

  res.json({ ok: true, added: batch.length, total: db.connectivity.length })
})

app.get('/api/schools', (_, res) => res.json(load().schools))

app.get('/api/resources', (req, res) => {
  const db = load()
  const { schoolId } = req.query
  if (schoolId !== undefined) {
    return res.json((db.resources || []).filter((r) => String(r.schoolId) === String(schoolId)))
  }
  res.json(db.resources || [])
})

app.patch('/api/resources/:id', (req, res) => {
  const db = load()
  const id = req.params.id
  const resource = (db.resources || []).find((r) => String(r.id) === String(id))
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' })
  }
  if (req.body.stock !== undefined) {
    resource.stock = Number(req.body.stock)
  }
  if (req.body.needed !== undefined) {
    resource.needed = Number(req.body.needed)
  }
  save(db)
  res.json(resource)
})

app.get('/api/analytics', (_, res) => {
  const db = load()
  const schools = db.schools || []
  const resources = db.resources || []
  const results = db.results || []

  const totalStudents = schools.reduce((sum, s) => sum + (s.students || 0), 0)
  const totalQuizScorePct = results.length > 0
    ? results.reduce((sum, r) => sum + ((r.score / (r.total || 1)) * 100), 0) / results.length
    : 0

  const totals = {
    schools: schools.length,
    students: totalStudents,
    quizAttempts: results.length,
    avgScorePct: Number(totalQuizScorePct.toFixed(1)),
  }

  const villageStats = {}
  for (const r of results) {
    if (!villageStats[r.village]) {
      villageStats[r.village] = { totalPct: 0, count: 0 }
    }
    villageStats[r.village].totalPct += (r.score / (r.total || 1)) * 100
    villageStats[r.village].count += 1
  }
  const scoreByVillage = Object.keys(villageStats).map((village) => ({
    village,
    avgPct: Number((villageStats[village].totalPct / villageStats[village].count).toFixed(1)),
    attempts: villageStats[village].count,
  }))

  const lessonStats = {}
  for (const r of results) {
    const lessonTitle = r.lessonTitle || `Lesson ${r.lessonId}`
    if (!lessonStats[lessonTitle]) {
      lessonStats[lessonTitle] = { totalPct: 0, count: 0 }
    }
    lessonStats[lessonTitle].totalPct += (r.score / (r.total || 1)) * 100
    lessonStats[lessonTitle].count += 1
  }
  const scoreByLesson = Object.keys(lessonStats).map((lesson) => ({
    lesson,
    avgPct: Number((lessonStats[lesson].totalPct / lessonStats[lesson].count).toFixed(1)),
    attempts: lessonStats[lesson].count,
  }))

  const connectivity = schools.map((s) => ({
    school: s.name,
    village: s.village,
    mbps: s.internetMbps,
    uptimePct: s.uptimePct,
  }))

  const schoolMap = new Map(schools.map((s) => [s.id, s.name]))
  const resourceGaps = resources
    .filter((r) => r.needed > r.stock)
    .map((r) => ({
      school: schoolMap.get(r.schoolId) || `School #${r.schoolId}`,
      item: r.item,
      stock: r.stock,
      needed: r.needed,
      gap: r.needed - r.stock,
    }))
    .sort((a, b) => b.gap - a.gap)

  const priorityScore = schools.map((s) => {
    const reasons = []

    const mbps = s.internetMbps ?? 0
    const uptime = s.uptimePct ?? 0
    const mbpsDeficit = Math.max(0, (20 - mbps) / 20)
    const uptimeDeficit = Math.max(0, (100 - uptime) / 100)
    const connScore = (mbpsDeficit * 0.5 + uptimeDeficit * 0.5) * 35

    if (mbps === 0) {
      reasons.push('Zero internet connectivity (0 Mbps)')
    } else if (mbps < 5) {
      reasons.push(`Severely constrained internet bandwidth (${mbps} Mbps)`)
    }

    if (uptime < 50) {
      reasons.push(`High network downtime (${uptime}% uptime)`)
    } else if (uptime < 70) {
      reasons.push(`Unstable internet connection (${uptime}% uptime)`)
    }

    const schoolRes = resources.filter((r) => r.schoolId === s.id)
    const totalGap = schoolRes.reduce((sum, r) => sum + Math.max(0, r.needed - r.stock), 0)
    const gapScore = Math.min(35, (totalGap / 120) * 35)

    const topGaps = schoolRes
      .filter((r) => r.needed > r.stock)
      .sort((a, b) => (b.needed - b.stock) - (a.needed - a.stock))

    if (topGaps.length > 0) {
      const top = topGaps[0]
      const gapVal = top.needed - top.stock
      if (gapVal >= 20) {
        reasons.push(`Severe deficit of ${top.item} (${gapVal} missing)`)
      } else if (gapVal > 0) {
        reasons.push(`Shortage of ${top.item} (${gapVal} needed)`)
      }
    }

    if (s.hasComputers === 0) {
      reasons.push('No computer systems available')
    }

    const villageAttempts = results.filter((r) => r.village === s.village)
    let quizScore = 15
    if (villageAttempts.length > 0) {
      const vAvg = villageAttempts.reduce((sum, r) => sum + ((r.score / (r.total || 1)) * 100), 0) / villageAttempts.length
      quizScore = Math.max(0, ((100 - vAvg) / 100) * 30)
      if (vAvg < 40) {
        reasons.push(`Low quiz mastery (${vAvg.toFixed(1)}% avg)`)
      } else if (vAvg < 65) {
        reasons.push(`Below-average quiz comprehension (${vAvg.toFixed(1)}% avg)`)
      }
    }

    const totalScore = Math.min(100, Math.round(connScore + gapScore + quizScore))

    if (reasons.length === 0) {
      reasons.push('Good connectivity and adequate resource levels')
    }

    return {
      school: s.name,
      village: s.village,
      score: totalScore,
      reasons,
    }
  }).sort((a, b) => b.score - a.score)

  const liveRecords = db.connectivity || []
  const liveByVillage = {}
  for (const r of liveRecords) {
    const v = r.village || 'Unknown'
    if (!liveByVillage[v]) {
      liveByVillage[v] = {
        totalMbps: 0,
        totalRtt: 0,
        rttCount: 0,
        onlineCount: 0,
        samples: 0,
        lastSeen: 0,
      }
    }
    liveByVillage[v].samples += 1
    liveByVillage[v].totalMbps += typeof r.mbps === 'number' ? r.mbps : 0
    if (typeof r.rttMs === 'number' && r.rttMs !== null) {
      liveByVillage[v].totalRtt += r.rttMs
      liveByVillage[v].rttCount += 1
    }
    if (r.online === true) {
      liveByVillage[v].onlineCount += 1
    }
    if (r.at && r.at > liveByVillage[v].lastSeen) {
      liveByVillage[v].lastSeen = r.at
    }
  }

  const liveConnectivity = Object.keys(liveByVillage).map((village) => {
    const vData = liveByVillage[village]
    return {
      village,
      avgMbps: Number((vData.totalMbps / vData.samples).toFixed(2)),
      avgRttMs: vData.rttCount > 0 ? Math.round(vData.totalRtt / vData.rttCount) : null,
      uptimePct: Math.round((vData.onlineCount / vData.samples) * 100),
      samples: vData.samples,
      lastSeen: vData.lastSeen || Date.now(),
    }
  })

  res.json({
    totals,
    scoreByVillage,
    scoreByLesson,
    connectivity,
    resourceGaps,
    priorityScore,
    liveConnectivity,
  })
})

const demoLesson = {
  mocked: true,
  title: 'Force and Motion',
  summary:
    'A force is a push or a pull that can change the motion or shape of an object. Friction is a resistive force that opposes motion between surfaces sliding against each other. Gravity pulls objects toward the center of the Earth and gives them weight. Balanced forces keep an object at rest or moving at a constant speed.',
  summary_hi:
    'बल एक धक्का या खिंचाव है जो किसी वस्तु की गति या आकार को बदल सकता है। घर्षण एक विरोधी बल है जो एक दूसरे के संपर्क में आने वाली सतहों की गति को रोकता है। गुरुत्वाकर्षण वस्तुओं को पृथ्वी के केंद्र की ओर खींचता है और उन्हें भार देता है। संतुलित बल किसी वस्तु को स्थिर या एक समान गति में रखते हैं।',
  quiz: [
    {
      q: 'What is a force?',
      options: ['A push or a pull', 'Only heat', 'Sound energy'],
      answer: 0,
    },
    {
      q: 'Which force slows down a moving bicycle when you stop pedaling?',
      options: ['Magnetic force', 'Friction', 'Electric force'],
      answer: 1,
    },
    {
      q: 'What force pulls dropped objects toward the ground?',
      options: ['Friction', 'Tension', 'Gravity'],
      answer: 2,
    },
    {
      q: 'What happens when balanced forces act on a stationary rock?',
      options: ['It remains at rest', 'It flies upward', 'It explodes'],
      answer: 0,
    },
    {
      q: 'Why do rough surfaces produce more friction than smooth surfaces?',
      options: ['They are colder', 'Microscopic bumps interlock more', 'They have less mass'],
      answer: 1,
    },
  ],
}

app.post('/api/generate', async (req, res) => {
  const text = String(req.body?.text || '').slice(0, 8000).trim()
  if (text.length < 40) {
    return res.status(400).json({ error: 'Please paste more text.' })
  }

  const prompt = `You are a teacher for rural Indian students in classes 6-8.
Act as a teacher for rural Indian students in classes 6-8 and reply with ONLY valid JSON of this exact shape:
{
  "title": "string",
  "summary": "string (4-5 simple sentences, easy English)",
  "summary_hi": "string (same summary in simple Hindi)",
  "quiz": [
    {
      "q": "string",
      "options": ["string", "string", "string"],
      "answer": 0
    }
  ]
}
The quiz must contain exactly 5 questions. Each question must have exactly 3 options, and answer must be an integer 0, 1, or 2 representing the index of the correct option. Do not include markdown code blocks or any other text before or after the JSON.

Chapter text:
${text}`

  try {
    let rawOutput = null

    if (process.env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      })

      if (!apiRes.ok) {
        const errBody = await apiRes.text().catch(() => '')
        throw new Error(`Gemini API error (Status ${apiRes.status}): ${errBody}`)
      }

      const json = await apiRes.json()
      rawOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text
    } else if (process.env.ANTHROPIC_API_KEY) {
      const url = 'https://api.anthropic.com/v1/messages'
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!apiRes.ok) {
        const errBody = await apiRes.text().catch(() => '')
        throw new Error(`Anthropic API error (Status ${apiRes.status}): ${errBody}`)
      }

      const json = await apiRes.json()
      rawOutput = json?.content?.[0]?.text
    } else {
      return res.json(demoLesson)
    }

    if (!rawOutput || typeof rawOutput !== 'string') {
      throw new Error('Empty response received from AI model')
    }

    const firstBrace = rawOutput.indexOf('{')
    const lastBrace = rawOutput.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('No valid JSON object boundaries found in AI output')
    }

    const jsonStr = rawOutput.substring(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(jsonStr)

    const isValid =
      typeof parsed?.title === 'string' &&
      parsed.title.trim().length > 0 &&
      typeof parsed?.summary === 'string' &&
      parsed.summary.trim().length > 0 &&
      typeof parsed?.summary_hi === 'string' &&
      parsed.summary_hi.trim().length > 0 &&
      Array.isArray(parsed?.quiz) &&
      parsed.quiz.length === 5 &&
      parsed.quiz.every(
        (item) =>
          typeof item?.q === 'string' &&
          item.q.trim().length > 0 &&
          Array.isArray(item?.options) &&
          item.options.length === 3 &&
          item.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0) &&
          Number.isInteger(item?.answer) &&
          item.answer >= 0 &&
          item.answer <= 2
      )

    if (!isValid) {
      throw new Error('AI response structure did not pass validation requirements')
    }

    res.json({
      title: parsed.title.trim(),
      summary: parsed.summary.trim(),
      summary_hi: parsed.summary_hi.trim(),
      quiz: parsed.quiz.map((q) => ({
        q: q.q.trim(),
        options: q.options.map((opt) => opt.trim()),
        answer: q.answer,
      })),
    })
  } catch (err) {
    console.error('AI generation error:', err)
    return res.json(demoLesson)
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, '0.0.0.0', () => console.log(`API running on port ${PORT}`))
