import { AppError } from '../utils/AppError.js'

// Unknown URL -> a JSON 404 in our standard error format (Express would
// otherwise send an HTML page).
export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`))
}

// Postgres error codes we translate into client errors.
const PG_ERRORS = {
  23505: [409, 'CONFLICT', 'A record with this value already exists'],
  23503: [409, 'INVALID_REFERENCE', 'A referenced record does not exist'],
  23514: [422, 'CONSTRAINT_VIOLATION', 'The value breaks a data rule (for example, stock cannot go below 0)'],
  '22P02': [400, 'INVALID_INPUT', 'A value has the wrong format'],
}

function normalise(err) {
  if (err instanceof AppError) return err
  if (err?.type === 'entity.parse.failed') return new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON')
  if (err?.type === 'entity.too.large') return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large (limit 100kb)')
  if (err?.code && PG_ERRORS[err.code]) return new AppError(...PG_ERRORS[err.code])
  return null // a bug: hide the details
}

// THE single place every error ends up. Express 5 forwards errors thrown in
// async handlers here automatically, so controllers have no try/catch.
// Every error response has the same shape:
//   { "error": "message", "code": "MACHINE_CODE", "details": [...], "requestId": "..." }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const known = normalise(err)
  const status = known?.status ?? 500

  if (status >= 500) {
    // Full error and stack trace go to the server log only, never to the client.
    console.error(`[error] rid=${req.id}`, err)
  }

  const body = {
    error: known ? known.message : 'Internal server error',
    code: known ? known.code : 'INTERNAL_ERROR',
    requestId: req.id,
  }
  if (known?.details) body.details = known.details

  res.status(status).json(body)
}
