const express = require('express')
const DashboardController = require('../../controllers/Dashboard/dashboardController')
const AuthMiddleware = require('../../middleware/AuthMiddleware')
const { User } = require('../../models')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregate metrics for admin and partners
 */

router.use(AuthMiddleware.authenticate)

/**
 * @swagger
 * /api/v1/dashboard/admin:
 *   get:
 *     summary: Admin dashboard metrics
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard numbers
 */
router.get('/admin', AuthMiddleware.authorize(User.ROLES.SUPER_ADMIN), DashboardController.admin)

/**
 * @swagger
 * /api/v1/dashboard/partner:
 *   get:
 *     summary: Partner dashboard metrics
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard numbers for the authenticated partner
 */
router.get('/partner', AuthMiddleware.authorize(User.ROLES.PARTNER), DashboardController.partner)

module.exports = router
