import pg from 'pg'

const { Pool, types } = pg

// Parse BIGINT (oid 20) and NUMERIC (oid 1700) as JavaScript numbers
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)))
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)))

export const seed = {
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

const sslConfig =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) &&
  !process.env.DATABASE_URL.includes('sslmode=require')
    ? false
    : { rejectUnauthorized: false }

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 5,
    })
  : null

export async function initSchema() {
  if (!pool) return
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        village TEXT NOT NULL,
        district TEXT NOT NULL,
        students INT NOT NULL CHECK (students >= 0),
        teachers INT NOT NULL CHECK (teachers >= 0),
        internet_mbps NUMERIC NOT NULL CHECK (internet_mbps >= 0),
        uptime_pct NUMERIC NOT NULL CHECK (uptime_pct >= 0 AND uptime_pct <= 100),
        has_computers INT NOT NULL CHECK (has_computers >= 0)
      );

      CREATE TABLE IF NOT EXISTS resources (
        id INT PRIMARY KEY,
        school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        item TEXT NOT NULL,
        stock INT NOT NULL CHECK (stock >= 0),
        needed INT NOT NULL CHECK (needed >= 0)
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id BIGINT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        summary_hi TEXT NOT NULL,
        quiz JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS results (
        id BIGSERIAL PRIMARY KEY,
        lesson_id BIGINT,
        lesson_title TEXT NOT NULL,
        village TEXT NOT NULL,
        score INT NOT NULL CHECK (score >= 0),
        total INT NOT NULL CHECK (total >= 0),
        at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS connectivity (
        id BIGSERIAL PRIMARY KEY,
        village TEXT NOT NULL,
        mbps NUMERIC NOT NULL,
        rtt_ms NUMERIC,
        online BOOLEAN NOT NULL,
        at BIGINT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_resources_school_id ON resources(school_id);
      CREATE INDEX IF NOT EXISTS idx_results_lesson_id ON results(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_results_village ON results(village);
      CREATE INDEX IF NOT EXISTS idx_connectivity_village ON connectivity(village);
    `)
  } finally {
    client.release()
  }
}

export async function seedIfEmpty(seedData = seed) {
  if (!pool) return
  const client = await pool.connect()
  try {
    const { rows: lessonRows } = await client.query('SELECT COUNT(*) AS count FROM lessons')
    const { rows: schoolRows } = await client.query('SELECT COUNT(*) AS count FROM schools')
    const lessonsCount = Number(lessonRows[0].count)
    const schoolsCount = Number(schoolRows[0].count)

    if (lessonsCount === 0 && schoolsCount === 0) {
      await client.query('BEGIN')
      try {
        for (const s of seedData.schools) {
          await client.query(
            `INSERT INTO schools (id, name, village, district, students, teachers, internet_mbps, uptime_pct, has_computers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [s.id, s.name, s.village, s.district, s.students, s.teachers, s.internetMbps, s.uptimePct, s.hasComputers]
          )
        }
        for (const r of seedData.resources) {
          await client.query(
            `INSERT INTO resources (id, school_id, item, stock, needed)
             VALUES ($1, $2, $3, $4, $5)`,
            [r.id, r.schoolId, r.item, r.stock, r.needed]
          )
        }
        for (const l of seedData.lessons) {
          await client.query(
            `INSERT INTO lessons (id, title, summary, summary_hi, quiz)
             VALUES ($1, $2, $3, $4, $5)`,
            [l.id, l.title, l.summary, l.summary_hi, JSON.stringify(l.quiz)]
          )
        }
        for (const res of seedData.results) {
          await client.query(
            `INSERT INTO results (lesson_id, lesson_title, village, score, total, at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [res.lessonId, res.lessonTitle, res.village, res.score, res.total, res.at]
          )
        }
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
  } finally {
    client.release()
  }
}

export async function loadAll() {
  if (!pool) return null
  const [lessonsRes, schoolsRes, resourcesRes, resultsRes, connRes] = await Promise.all([
    pool.query('SELECT id, title, summary, summary_hi, quiz FROM lessons ORDER BY id ASC'),
    pool.query('SELECT id, name, village, district, students, teachers, internet_mbps, uptime_pct, has_computers FROM schools ORDER BY id ASC'),
    pool.query('SELECT id, school_id, item, stock, needed FROM resources ORDER BY id ASC'),
    pool.query('SELECT id, lesson_id, lesson_title, village, score, total, at FROM results ORDER BY id ASC'),
    pool.query('SELECT id, village, mbps, rtt_ms, online, at FROM connectivity ORDER BY id ASC'),
  ])

  return {
    lessons: lessonsRes.rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      summary: row.summary,
      summary_hi: row.summary_hi,
      quiz: typeof row.quiz === 'string' ? JSON.parse(row.quiz) : row.quiz,
    })),
    schools: schoolsRes.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      village: row.village,
      district: row.district,
      students: Number(row.students),
      teachers: Number(row.teachers),
      internetMbps: Number(row.internet_mbps),
      uptimePct: Number(row.uptime_pct),
      hasComputers: Number(row.has_computers),
    })),
    resources: resourcesRes.rows.map((row) => ({
      id: Number(row.id),
      schoolId: Number(row.school_id),
      item: row.item,
      stock: Number(row.stock),
      needed: Number(row.needed),
    })),
    results: resultsRes.rows.map((row) => ({
      id: Number(row.id),
      lessonId: Number(row.lesson_id),
      lessonTitle: row.lesson_title,
      village: row.village,
      score: Number(row.score),
      total: Number(row.total),
      at: Number(row.at),
    })),
    connectivity: connRes.rows.map((row) => ({
      id: Number(row.id),
      village: row.village,
      mbps: Number(row.mbps),
      rttMs: row.rtt_ms === null ? null : Number(row.rtt_ms),
      online: Boolean(row.online),
      at: Number(row.at),
    })),
  }
}

export async function addLesson(lesson) {
  if (!pool) return lesson
  await pool.query(
    `INSERT INTO lessons (id, title, summary, summary_hi, quiz)
     VALUES ($1, $2, $3, $4, $5)`,
    [lesson.id, lesson.title, lesson.summary, lesson.summary_hi, JSON.stringify(lesson.quiz)]
  )
  return lesson
}

export async function addResults(items) {
  if (!pool) return { ok: true, total: 0 }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of items) {
      await client.query(
        `INSERT INTO results (lesson_id, lesson_title, village, score, total, at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.lessonId ?? null,
          item.lessonTitle || '',
          item.village || '',
          Number(item.score ?? 0),
          Number(item.total ?? 0),
          Number(item.at ?? Date.now()),
        ]
      )
    }
    await client.query('COMMIT')
    const countRes = await client.query('SELECT COUNT(*) AS total FROM results')
    return { ok: true, total: Number(countRes.rows[0].total) }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateResource(id, patch) {
  if (!pool) return null
  const client = await pool.connect()
  try {
    const existing = await client.query('SELECT id, school_id, item, stock, needed FROM resources WHERE id = $1', [id])
    if (existing.rows.length === 0) return null

    let newStock = Number(existing.rows[0].stock)
    let newNeeded = Number(existing.rows[0].needed)

    if (patch.stock !== undefined) {
      newStock = Number(patch.stock)
    }
    if (patch.needed !== undefined) {
      newNeeded = Number(patch.needed)
    }

    const updated = await client.query(
      `UPDATE resources SET stock = $1, needed = $2 WHERE id = $3 RETURNING id, school_id, item, stock, needed`,
      [newStock, newNeeded, id]
    )
    const row = updated.rows[0]
    return {
      id: Number(row.id),
      schoolId: Number(row.school_id),
      item: row.item,
      stock: Number(row.stock),
      needed: Number(row.needed),
    }
  } finally {
    client.release()
  }
}

export async function addConnectivity(items) {
  if (!pool) return { ok: true, added: 0, total: 0 }
  const batch = Array.isArray(items) ? items.slice(0, 50) : []
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of batch) {
      await client.query(
        `INSERT INTO connectivity (village, mbps, rtt_ms, online, at)
         VALUES ($1, $2, $3, $4, $5)`,
        [item.village, item.mbps, item.rttMs ?? null, item.online, item.at]
      )
    }
    if (batch.length > 0) {
      await client.query(`
        DELETE FROM connectivity
        WHERE id NOT IN (
          SELECT id FROM connectivity
          ORDER BY at DESC, id DESC
          LIMIT 500
        )
      `)
    }
    const countRes = await client.query('SELECT COUNT(*) AS total FROM connectivity')
    await client.query('COMMIT')
    return {
      ok: true,
      added: batch.length,
      total: Number(countRes.rows[0].total),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
