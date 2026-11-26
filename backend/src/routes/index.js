import { Router } from 'express'
import * as misc from '../controllers/misc.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { generateLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { connectivityBody, generateBody } from '../validators/schemas.js'
import authRoutes from './auth.routes.js'
import lessonRoutes from './lessons.routes.js'
import resourceRoutes from './resources.routes.js'
import resultRoutes from './results.routes.js'
import schoolRoutes from './schools.routes.js'

// Every API route, grouped by resource. app.js mounts this at /api/v1.
const api = Router()

api.use('/auth', authRoutes)
api.use('/lessons', lessonRoutes)
api.use('/results', resultRoutes)
api.use('/resources', resourceRoutes)
api.use('/schools', schoolRoutes)

api.get('/health', misc.health)
api.get('/ping', misc.ping)
api.get('/analytics', misc.analytics)
api.get('/connectivity', misc.listConnectivity)
api.post('/connectivity', validate({ body: connectivityBody }), misc.addConnectivity)
api.post(
  '/generate',
  requireAuth,
  requireRole('teacher'),
  generateLimiter,
  validate({ body: generateBody }),
  misc.generate
)

export default api
