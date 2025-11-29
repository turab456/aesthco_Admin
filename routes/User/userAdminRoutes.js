const express = require('express')
const AuthMiddleware = require('../../middleware/AuthMiddleware')
const UserAdminController = require('../../controllers/User/userAdminController')
const { User } = require('../../models')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: AdminUsers
 *   description: Admin user overview APIs
 */

router.use(AuthMiddleware.authenticate)

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List users with order stats (admin)
 *     tags: [AdminUsers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Users with order aggregates
 */
router.get('/', AuthMiddleware.authorize(User.ROLES.SUPER_ADMIN), UserAdminController.listWithOrderStats)

module.exports = router
