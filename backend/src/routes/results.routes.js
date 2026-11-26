import { Router } from 'express'
import * as ctrl from '../controllers/results.controller.js'
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createResultsBody, idParam, listResultsQuery } from '../validators/schemas.js'

const router = Router()

// Shared classroom devices may submit without an account (optionalAuth).
// If a student is signed in, the result is saved as theirs.
router.post('/', optionalAuth, validate({ body: createResultsBody }), ctrl.create)

// All results: staff only. Filters, sorting and pagination in the query string.
router.get('/', requireAuth, requireRole('teacher', 'planner'), validate({ query: listResultsQuery }), ctrl.list)

// A student's own results. Declared before '/:id' so "me" is not read as an id.
router.get('/me', requireAuth, validate({ query: listResultsQuery }), ctrl.listMine)

// One result: owner, teacher or planner (checked in the service).
router.get('/:id', requireAuth, validate({ params: idParam }), ctrl.getOne)

export default router
