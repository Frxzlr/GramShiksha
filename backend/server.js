import express from 'express'
import cors from 'cors'
import fs from 'fs'
import {
  pool,
  seed,
  initSchema,
  seedIfEmpty,
  loadAll,
  addLesson,
  addResults,
  updateResource,
  addConnectivity,
} from './db.js'

const FILE = './data.json'

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

// Health check endpoint
app.get('/api/health', (_, res) => {
  try {
    res.json({ ok: true, storage: process.env.DATABASE_URL ? 'postgres' : 'file' })
  } catch (err) {
    console.error('Health check error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Lessons endpoints
app.get('/api/lessons', async (_, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const db = await loadAll()
      return res.json(db.lessons)
    }
    res.json(load().lessons)
  } catch (err) {
    console.error('Get lessons error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/lessons', async (req, res) => {
  try {
    const lesson = { id: Date.now(), ...req.body }
    if (process.env.DATABASE_URL) {
      await addLesson(lesson)
      return res.json(lesson)
    }
    const db = load()
    db.lessons.push(lesson)
    save(db)
    res.json(lesson)
  } catch (err) {
    console.error('Post lesson error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Results endpoints
app.get('/api/results', async (_, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const db = await loadAll()
      return res.json(db.results)
    }
    res.json(load().results)
  } catch (err) {
    console.error('Get results error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/results', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body]
    if (process.env.DATABASE_URL) {
      const { total } = await addResults(items)
      return res.json({ ok: true, total })
    }
    const db = load()
    db.results.push(...items)
    save(db)
    res.json({ ok: true, total: db.results.length })
  } catch (err) {
    console.error('Post results error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Ping payload for connectivity testing
const pingPayload = 'GramShiksha connectivity measurement ping payload. '.repeat(1970) // ~100 KB
app.get('/api/ping', (_, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    res.set('Content-Type', 'text/plain; charset=utf-8')
    res.send(pingPayload)
  } catch (err) {
    console.error('Ping error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Connectivity endpoints
app.get('/api/connectivity', async (_, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const db = await loadAll()
      return res.json(db.connectivity || [])
    }
    res.json(load().connectivity || [])
  } catch (err) {
    console.error('Get connectivity error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/connectivity', async (req, res) => {
  try {
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

    if (process.env.DATABASE_URL) {
      const result = await addConnectivity(validItems)
      return res.json(result)
    }

    const db = load()
    db.connectivity = db.connectivity || []
    const batch = validItems.slice(0, 50)
    if (batch.length > 0) {
      db.connectivity.push(...batch)
      if (db.connectivity.length > 500) {
        db.connectivity = db.connectivity.slice(-500)
      }
      save(db)
    }

    res.json({ ok: true, added: batch.length, total: db.connectivity.length })
  } catch (err) {
    console.error('Post connectivity error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Schools endpoints
app.get('/api/schools', async (_, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const db = await loadAll()
      return res.json(db.schools)
    }
    res.json(load().schools)
  } catch (err) {
    console.error('Get schools error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Resources endpoints
app.get('/api/resources', async (req, res) => {
  try {
    const db = process.env.DATABASE_URL ? await loadAll() : load()
    const { schoolId } = req.query
    if (schoolId !== undefined) {
      return res.json((db.resources || []).filter((r) => String(r.schoolId) === String(schoolId)))
    }
    res.json(db.resources || [])
  } catch (err) {
    console.error('Get resources error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.patch('/api/resources/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (process.env.DATABASE_URL) {
      const resource = await updateResource(id, req.body)
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' })
      }
      return res.json(resource)
    }

    const db = load()
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
  } catch (err) {
    console.error('Patch resource error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Analytics endpoint
app.get('/api/analytics', async (_, res) => {
  try {
    const db = process.env.DATABASE_URL ? await loadAll() : load()
    const schools = db.schools || []
    const resources = db.resources || []
    const results = db.results || []

    const totalStudents = schools.reduce((sum, s) => sum + (s.students || 0), 0)
    const totalQuizScorePct =
      results.length > 0
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

    const priorityScore = schools
      .map((s) => {
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
          .sort((a, b) => b.needed - b.stock - (a.needed - a.stock))

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
          const vAvg =
            villageAttempts.reduce((sum, r) => sum + ((r.score / (r.total || 1)) * 100), 0) / villageAttempts.length
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
      })
      .sort((a, b) => b.score - a.score)

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
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
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

// Startup routine
if (process.env.DATABASE_URL) {
  try {
    await initSchema()
    await seedIfEmpty()
    console.log('Using PostgreSQL')
  } catch (err) {
    console.error('Failed to initialize PostgreSQL:', err)
    process.exit(1)
  }
} else {
  console.log('Using data.json')
}

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, '0.0.0.0', () => console.log(`API running on port ${PORT}`))

process.on('SIGTERM', async () => {
  server.close(async () => {
    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        console.error('Error closing pool on SIGTERM:', e)
      }
    }
    process.exit(0)
  })
})
