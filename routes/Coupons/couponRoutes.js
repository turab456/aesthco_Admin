const express = require('express')
const CouponController = require('../../controllers/Coupons/couponController')
const AuthMiddleware = require('../../middleware/AuthMiddleware')
const { User } = require('../../models')

const router = express.Router()
const { SUPER_ADMIN, CUSTOMER } = User.ROLES

router.use(AuthMiddleware.authenticate)

// Admin coupon management
router.post('/admin', AuthMiddleware.authorize(SUPER_ADMIN), CouponController.create)
router.get('/admin', AuthMiddleware.authorize(SUPER_ADMIN), CouponController.list)
router.patch('/admin/:id', AuthMiddleware.authorize(SUPER_ADMIN), CouponController.update)

// Customer validation before checkout
router.get('/available', AuthMiddleware.authorize(CUSTOMER), CouponController.listAvailable)
router.post('/validate', AuthMiddleware.authorize(CUSTOMER), CouponController.validate)

module.exports = router
