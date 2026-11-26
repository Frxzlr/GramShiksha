import * as auth from '../services/auth.service.js'
import { notFound } from '../utils/AppError.js'
import { REFRESH_COOKIE, refreshCookieOptions } from '../utils/tokens.js'
import { env } from '../config/env.js'

// The refresh token goes into an httpOnly cookie; only the short-lived access
// token is returned in the JSON body.
function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.status(status).json({ user, accessToken, expiresIn: env.ACCESS_TOKEN_TTL })
}

export async function register(req, res) {
  const user = await auth.register(req.valid.body)
  // New accounts are always students, and are signed straight in.
  sendSession(res, 201, { user, ...(await auth.createSession(user)) })
}

export async function login(req, res) {
  sendSession(res, 200, await auth.login(req.valid.body))
}

export async function refresh(req, res) {
  try {
    sendSession(res, 200, await auth.refresh(req.cookies?.[REFRESH_COOKIE]))
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
    throw err
  }
}

export async function logout(req, res) {
  await auth.logout(req.cookies?.[REFRESH_COOKIE])
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.status(204).end()
}

export async function me(req, res) {
  const user = await auth.getUser(req.user.id)
  if (!user) throw notFound('User')
  res.json({ user })
}
