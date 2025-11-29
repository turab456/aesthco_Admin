const express = require('express')
const AuthMiddleware = require('../../middleware/AuthMiddleware')
const UserAdminController = require('../../controllers/User/userAdminController')
const AuthController = require('../../controllers/Auth/authController')
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

/**
 * @swagger
 * /api/v1/admin/users/{userId}/toggle-active:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [AdminUsers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.patch('/:userId/toggle-active', AuthMiddleware.authorize(User.ROLES.SUPER_ADMIN), AuthController.toggleUserActiveStatus)

module.exports = router
