const express = require('express');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const WishlistController = require('../../controllers/User/wishlistController');

const router = express.Router();
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Manage customer wishlist
 */

/**
 * @swagger
 * /api/v1/user/wishlist:
 *   get:
 *     summary: List wishlist items
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Add to wishlist
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 * /api/v1/user/wishlist/{id}:
 *   delete:
 *     summary: Remove wishlist item
 *     tags: [Wishlist]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/wishlist', WishlistController.list);
router.post('/wishlist', WishlistController.add);
router.delete('/wishlist/:id', WishlistController.remove);

module.exports = router;
