import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { requireAuth, requireTrustedOrigin } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { loginBody, registerBody } from '../validators/schemas.js'

const router = Router()

router.post('/register', authLimiter, validate({ body: registerBody }), ctrl.register)
router.post('/login', authLimiter, validate({ body: loginBody }), ctrl.login)
router.post('/refresh', requireTrustedOrigin, ctrl.refresh) // uses the httpOnly cookie
router.post('/logout', requireTrustedOrigin, ctrl.logout)
router.get('/me', requireAuth, ctrl.me)

export default router
