import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const JWT_OPTIONS = { issuer: 'gramshiksha-api', audience: 'gramshiksha-web' }

// Access token: a short-lived (15 min) signed JWT. The client keeps it in
// memory only and sends it as "Authorization: Bearer <token>".
export function signAccessToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, name: user.name }, env.JWT_ACCESS_SECRET, {
    ...JWT_OPTIONS,
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL,
  })
}

export function verifyAccessToken(token) {
  // Pinning the algorithm stops "alg: none" and algorithm-confusion tricks.
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { ...JWT_OPTIONS, algorithms: ['HS256'] })
}

// Refresh token: 256 random bits, not a JWT. The browser keeps it in an
// httpOnly cookie; the database keeps only its SHA-256 hash.
export function newRefreshToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}

export const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export const REFRESH_COOKIE = 'gs_refresh'

export function refreshCookieOptions() {
  return {
    httpOnly: true, // JavaScript in the page cannot read it, so XSS cannot steal it
    secure: env.isProduction, // HTTPS only in production
    sameSite: 'strict', // never sent on requests started by another site (CSRF)
    path: '/api', // only sent to our API, not with page or asset requests
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  }
}
