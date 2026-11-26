import { Router } from 'express'
import * as ctrl from '../controllers/schools.controller.js'
import { validate } from '../middleware/validate.js'
import { idParam } from '../validators/schemas.js'

const router = Router()

router.get('/', ctrl.list)
router.get('/:id', validate({ params: idParam }), ctrl.getOne) // school + its resources

export default router
