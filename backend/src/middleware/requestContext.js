import { randomUUID } from 'node:crypto'

// Runs first. Gives every request an id (returned in the X-Request-Id header
// and in every error body) and logs one line per request when it finishes:
//   POST /api/v1/results 201 14.2ms rid=1f3a9c02 user=3
export function requestContext(req, res, next) {
  req.id = randomUUID()
  res.set('X-Request-Id', req.id)
  const start = performance.now()

  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1)
    const user = req.user ? ` user=${req.user.id}(${req.user.role})` : ''
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms rid=${req.id.slice(0, 8)}${user}`)
  })
  next()
}
