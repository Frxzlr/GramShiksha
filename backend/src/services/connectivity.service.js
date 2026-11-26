import { query, withTransaction } from '../db/pool.js'

const MAX_ROWS = 500

export async function listReadings() {
  const { rows } = await query(
    `SELECT id, village, mbps, rtt_ms AS "rttMs", online, at
     FROM connectivity ORDER BY at DESC LIMIT $1`,
    [MAX_ROWS]
  )
  return rows
}

// Insert the batch and trim the table to the newest 500 readings in ONE
// transaction: if anything fails, neither happens.
export async function addReadings(items) {
  return withTransaction(async (client) => {
    await query(
      `INSERT INTO connectivity (village, mbps, rtt_ms, online, at)
       SELECT * FROM unnest($1::text[], $2::numeric[], $3::numeric[], $4::boolean[], $5::bigint[])`,
      [
        items.map((i) => i.village),
        items.map((i) => i.mbps),
        items.map((i) => i.rttMs ?? null),
        items.map((i) => i.online),
        items.map((i) => i.at),
      ],
      client
    )
    await query(
      `DELETE FROM connectivity WHERE id NOT IN (
         SELECT id FROM connectivity ORDER BY at DESC, id DESC LIMIT $1)`,
      [MAX_ROWS],
      client
    )
    return { ok: true, added: items.length }
  })
}
