import bcrypt from 'bcrypt'
import { query, withTransaction } from '../db/pool.js'
import { BCRYPT_ROUNDS, env } from '../config/env.js'
import { AppError, unauthorized } from '../utils/AppError.js'
import { hashToken, newRefreshToken, signAccessToken } from '../utils/tokens.js'

const PUBLIC_USER = 'id, name, email, role, village'

// Compared against when the email does not exist, so a wrong email and a
// wrong password take the same time (no hint about which accounts exist).
const DUMMY_HASH = await bcrypt.hash('not-a-real-password', BCRYPT_ROUNDS)

export async function register({ name, email, password, village }) {
  // bcrypt.hash runs on libuv's thread pool, so hashing (about 0.2 s at cost
  // 12) does not block other requests. It generates and stores a random salt.
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, village)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING ${PUBLIC_USER}`,
      [name, email, passwordHash, village ?? null]
    )
    return rows[0]
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists')
    throw err
  }
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${PUBLIC_USER}, password_hash FROM users WHERE lower(email) = lower($1)`,
    [email]
  )
  const user = rows[0]
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
  if (!user || !ok) throw unauthorized('INVALID_CREDENTIALS', 'Invalid email or password')

  delete user.password_hash
  return { user, ...(await createSession(user)) }
}

// New session = new access token + new refresh token (stored hashed).
export async function createSession(user, client) {
  const accessToken = signAccessToken(user)
  const refresh = newRefreshToken()
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(days => $3))`,
    [user.id, refresh.hash, env.REFRESH_TOKEN_DAYS],
    client
  )
  return { accessToken, refreshToken: refresh.token }
}

// Exchanges a valid refresh token for a new access token AND a new refresh
// token (rotation). The old one is revoked in the same transaction.
export async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized('NO_REFRESH_TOKEN', 'No refresh token: please sign in')
  const tokenHash = hashToken(refreshToken)

  const { rows } = await query(
    'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  )
  const stored = rows[0]
  if (!stored) throw unauthorized('INVALID_REFRESH_TOKEN', 'Session not found: please sign in')

  if (stored.revoked_at) {
    // A token that was already rotated is being used again: it may have been
    // stolen. End every session of this user to be safe.
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
      stored.user_id,
    ])
    throw unauthorized('REFRESH_TOKEN_REUSED', 'Session was already used: please sign in again')
  }
  if (new Date(stored.expires_at) <= new Date()) {
    throw unauthorized('REFRESH_TOKEN_EXPIRED', 'Session expired: please sign in')
  }

  return withTransaction(async (client) => {
    const revoked = await query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
      [stored.id],
      client
    )
    // Two refreshes raced with the same token: only the first one wins.
    if (revoked.rowCount === 0) throw unauthorized('REFRESH_TOKEN_REUSED', 'Session was already used')

    const { rows: users } = await query(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [stored.user_id], client)
    const user = users[0]
    if (!user) throw unauthorized('INVALID_REFRESH_TOKEN', 'Account no longer exists')
    return { user, ...(await createSession(user, client)) }
  })
}

// Logout deletes the session row, so the cookie can never be used again.
// (Rotated tokens are kept as "revoked" instead, to detect reuse.)
export async function logout(refreshToken) {
  if (!refreshToken) return
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hashToken(refreshToken)])
}

export async function getUser(id) {
  const { rows } = await query(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [id])
  return rows[0] ?? null
}
