// An error we expect and want the client to see: it carries its own HTTP
// status, a stable machine-readable code and a safe human-readable message.
// Anything that is NOT an AppError is treated as a bug and shown as a 500.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details)
export const unauthorized = (code, message) => new AppError(401, code, message)
export const forbidden = (message) => new AppError(403, 'FORBIDDEN', message)
export const notFound = (what) => new AppError(404, 'NOT_FOUND', `${what} not found`)
