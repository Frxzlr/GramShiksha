import { badRequest } from '../utils/AppError.js'

// validate({ params, query, body }) checks each part of the request against a
// zod schema before the controller runs. Unknown fields are rejected (schemas
// are .strict()), strings are trimmed and length-limited, numbers are coerced
// and range-checked. The cleaned values are put on req.valid.
export const validate = (schemas) => (req, res, next) => {
  const valid = {}
  const details = []

  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(req[part] ?? {})
    if (result.success) {
      valid[part] = result.data
    } else {
      for (const issue of result.error.issues) {
        details.push({
          in: part,
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        })
      }
    }
  }

  if (details.length) return next(badRequest('Request validation failed', details))
  req.valid = valid
  next()
}
