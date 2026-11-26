import { query } from '../db/pool.js'
import { getAnalytics } from '../services/analytics.service.js'
import { addReadings, listReadings } from '../services/connectivity.service.js'
import { generateLesson } from '../services/generate.service.js'

export async function health(req, res) {
  await query('SELECT 1')
  res.json({ ok: true, storage: 'postgres', uptimeSec: Math.round(process.uptime()) })
}

// ~100 KB built once at startup; phones time its download to estimate speed.
const PING_PAYLOAD = 'GramShiksha connectivity measurement ping payload. '.repeat(1970)
export function ping(req, res) {
  res.set('Cache-Control', 'no-store').type('text/plain').send(PING_PAYLOAD)
}

export async function analytics(req, res) {
  res.json(await getAnalytics())
}

export async function listConnectivity(req, res) {
  res.json(await listReadings())
}

export async function addConnectivity(req, res) {
  const body = req.valid.body
  res.status(201).json(await addReadings(Array.isArray(body) ? body : [body]))
}

export async function generate(req, res) {
  res.json(await generateLesson(req.valid.body.text))
}
