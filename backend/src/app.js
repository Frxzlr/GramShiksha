import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { isAllowedOrigin } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { requestContext } from './middleware/requestContext.js'
import { AppError } from './utils/AppError.js'
import api from './routes/index.js'

export function createApp() {
  const app = express()

  // We run behind proxies (Vercel's rewrite, then Render's load balancer).
  // Trust that many hops so req.ip is the real client IP for rate limiting,
  // without trusting an X-Forwarded-For header a client could forge.
  app.set('trust proxy', env.TRUST_PROXY)

  // ---- Global middleware. ORDER MATTERS: each runs before the next. ----

  // 1. Request id + one log line per request. First, so even rejected
  //    requests are logged and carry an id.
  app.use(requestContext)

  // 2. Security headers on EVERY response, including errors and 429s.
  app.use(helmet())

  // 3. CORS: only our own frontends may call the API from a browser.
  //    Before the rate limiter so preflight requests get CORS headers.
  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = same-origin request or curl/Postman: allowed.
        if (!origin || isAllowedOrigin(origin)) return cb(null, true)
        cb(new AppError(403, 'CORS_ORIGIN_DENIED', `Origin ${origin} is not allowed`))
      },
      credentials: true, // the refresh-token cookie
    })
  )

  // 4. Rate limiting, before we spend any work parsing bodies, checking
  //    tokens or querying the database.
  app.use('/api', apiLimiter)

  // 5. Parse JSON bodies, max 100 KB, so a huge body can't exhaust memory.
  app.use(express.json({ limit: '100kb' }))

  // 6. Parse cookies (only the refresh-token cookie is used).
  app.use(cookieParser())

  // 7. Routes. /api/v1 is the versioned API. /api stays as an alias because
  //    PWAs already installed on students' phones cached the old URLs.
  app.use('/api/v1', api)
  app.use('/api', api)

  // 8. Nothing matched: JSON 404.
  app.use(notFoundHandler)

  // 9. Central error handler. Must be LAST, and has 4 arguments.
  app.use(errorHandler)

  return app
}
