const express = require('express')
const OrderController = require('../../controllers/Orders/orderController')
const AuthMiddleware = require('../../middleware/AuthMiddleware')
const { User } = require('../../models')

const router = express.Router()

const { SUPER_ADMIN, PARTNER, CUSTOMER } = User.ROLES

router.use(AuthMiddleware.authenticate)

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management APIs
 *
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         productId: { type: integer }
 *         productName: { type: string }
 *         productSlug: { type: string }
 *         variantId: { type: integer }
 *         colorId: { type: integer }
 *         sizeId: { type: integer }
 *         colorName: { type: string }
 *         sizeName: { type: string }
 *         sku: { type: string }
 *         quantity: { type: integer }
 *         unitPrice: { type: number }
 *         totalPrice: { type: number }
 *         imageUrl: { type: string }
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         assignedPartnerId: { type: string, format: uuid, nullable: true }
 *         status:
 *           type: string
 *           enum: [PLACED, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED]
 *         paymentMethod:
 *           type: string
 *           enum: [COD]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *         subtotal: { type: number }
 *         shippingFee: { type: number }
 *         total: { type: number }
 *         addressName: { type: string }
 *         addressPhone: { type: string }
 *         addressLine1: { type: string }
 *         addressLine2: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         postalCode: { type: string }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     ShippingSetting:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         freeShippingThreshold: { type: number }
 *         shippingFee: { type: number }
 *         isActive: { type: boolean }
 */

// Customer routes
/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create order from cart (customer)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId:
 *                 type: string
 *                 format: uuid
 *               couponCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */
router.post('/', AuthMiddleware.authorize(CUSTOMER), OrderController.createFromCart)
/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List my orders
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 */
router.get('/', AuthMiddleware.authorize(CUSTOMER), OrderController.listCustomerOrders)
/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get my order by id
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order
 */
router.get('/shipping-settings', AuthMiddleware.authorize(CUSTOMER), OrderController.getShippingSetting)
router.get('/:id', AuthMiddleware.authorize(CUSTOMER), OrderController.getCustomerOrder)

// Partner routes
/**
 * @swagger
 * /api/v1/orders/partner/list:
 *   get:
 *     summary: List orders available/assigned to partner
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Orders
 */
router.get('/partner/list', AuthMiddleware.authorize(PARTNER), OrderController.listPartnerOrders)
/**
 * @swagger
 * /api/v1/orders/partner/{id}:
 *   get:
 *     summary: Get order detail (partner)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order
 */
router.get('/partner/:id', AuthMiddleware.authorize(PARTNER), OrderController.getPartnerOrder)
/**
 * @swagger
 * /api/v1/orders/partner/{id}/accept:
 *   patch:
 *     summary: Accept order (partner)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Accepted order
 */
router.patch('/partner/:id/accept', AuthMiddleware.authorize(PARTNER), OrderController.acceptByPartner)
/**
 * @swagger
 * /api/v1/orders/partner/{id}/status:
 *   patch:
 *     summary: Update order status (partner)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PLACED, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED]
 *     responses:
 *       200:
 *         description: Updated order
 */
router.patch('/partner/:id/status', AuthMiddleware.authorize(PARTNER), OrderController.updateStatusByPartner)

// Admin routes
/**
 * @swagger
 * /api/v1/orders/admin/list:
 *   get:
 *     summary: List all orders (admin)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/admin/list', AuthMiddleware.authorize(SUPER_ADMIN), OrderController.listAdminOrders)
/**
 * @swagger
 * /api/v1/orders/admin/shipping-settings:
 *   get:
 *     summary: Get active shipping setting
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Create shipping setting
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               freeShippingThreshold: { type: number }
 *               shippingFee: { type: number }
 *               isActive: { type: boolean }
 */
router.get('/admin/shipping-settings', AuthMiddleware.authorize(SUPER_ADMIN), OrderController.getShippingSetting)
router.post('/admin/shipping-settings', AuthMiddleware.authorize(SUPER_ADMIN), OrderController.upsertShippingSetting)
/**
 * @swagger
 * /api/v1/orders/admin/{id}:
 *   get:
 *     summary: Get order by id (admin)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.get('/admin/:id', AuthMiddleware.authorize(SUPER_ADMIN), OrderController.getAdminOrder)

module.exports = router
