import { Router } from 'express'
import * as ctrl from '../controllers/resources.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { idParam, listResourcesQuery, updateResourceBody } from '../validators/schemas.js'

const router = Router()

router.get('/', validate({ query: listResourcesQuery }), ctrl.list)
router.patch(
  '/:id',
  requireAuth,
  requireRole('planner'),
  validate({ params: idParam, body: updateResourceBody }),
  ctrl.update
)

export default router
