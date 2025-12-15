const express = require('express');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const CartController = require('../../controllers/User/cartController');

const router = express.Router();
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Manage customer cart
 */

/**
 * @swagger
 * /api/v1/user/cart:
 *   get:
 *     summary: List cart items
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Add item to cart (increments if exists)
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 * /api/v1/user/cart/{id}:
 *   put:
 *     summary: Update quantity
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Remove cart item
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/cart', CartController.list);
router.post('/cart', CartController.add);
router.put('/cart/:id', CartController.update);
router.delete('/cart/:id', CartController.remove);
router.delete('/cart', CartController.clear);

module.exports = router;
