import { env } from '../config/env.js'
import { AppError, forbidden, unauthorized } from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/tokens.js'

function readUser(req) {
  const [scheme, token] = (req.get('authorization') || '').split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    const payload = verifyAccessToken(token)
    return { id: Number(payload.sub), role: payload.role, name: payload.name }
  } catch (err) {
    throw err.name === 'TokenExpiredError'
      ? unauthorized('TOKEN_EXPIRED', 'Access token expired: call POST /api/v1/auth/refresh')
      : unauthorized('INVALID_TOKEN', 'Access token is invalid')
  }
}

// Authentication: who are you? No valid token -> 401.
export function requireAuth(req, res, next) {
  const user = readUser(req)
  if (!user) {
    return next(unauthorized('UNAUTHENTICATED', 'Sign in required: send Authorization: Bearer <access token>'))
  }
  req.user = user
  next()
}

// Same, but anonymous requests are allowed through (req.user stays undefined).
// Used where shared offline devices must keep working without an account.
export function optionalAuth(req, res, next) {
  req.user = readUser(req) ?? undefined
  next()
}

// Authorization: are you allowed? Signed in but wrong role -> 403.
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized('UNAUTHENTICATED', 'Sign in required'))
    if (!roles.includes(req.user.role)) {
      return next(forbidden(`This action needs the ${roles.join(' or ')} role; you are signed in as ${req.user.role}`))
    }
    next()
  }

// CSRF guard for the two routes that use the refresh cookie.
// SameSite=Strict already stops other sites sending the cookie; this also
// rejects any request whose Origin header is not one of our own frontends.
export function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin')
  if (origin && !isAllowedOrigin(origin)) {
    return next(new AppError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed'))
  }
  next()
}

const LAN_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/

export function isAllowedOrigin(origin) {
  if (env.corsOrigins.includes(origin)) return true
  // In development also allow a phone on the same Wi-Fi (npm run dev -- --host).
  return !env.isProduction && LAN_DEV_ORIGIN.test(origin)
}
