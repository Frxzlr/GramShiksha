import { rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/AppError.js'

// When a limit is hit, send the error through our central error handler so a
// 429 looks like every other error. The library has already set the
// RateLimit-* and Retry-After headers.
const onLimit = (message) => (req, res, next, options) =>
  next(new AppError(options.statusCode, 'RATE_LIMITED', message))

const common = { standardHeaders: 'draft-7', legacyHeaders: false }

// Every /api request: 300 per 15 minutes per IP. Generous enough for a
// classroom device that sends a connectivity reading every 2 minutes.
export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (req) => req.path.endsWith('/health'),
  handler: onLimit('Too many requests. Please slow down and try again shortly.'),
})

// Login and register: 5 failed attempts per 15 minutes per IP, to stop
// password guessing. Successful logins do not count.
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  handler: onLimit('Too many login attempts. Try again in 15 minutes.'),
})

// AI lesson generation costs real money per call: 10 per minute per teacher.
// Runs after requireAuth, so it is keyed by user id, not IP.
export const generateLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `user:${req.user.id}`,
  handler: onLimit('AI generation limit reached (10 per minute). Wait a minute and try again.'),
})
