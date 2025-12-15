const express = require('express');
const ReviewController = require('../../controllers/Products/reviewController');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const { User } = require('../../models');

const router = express.Router();
const { SUPER_ADMIN, CUSTOMER } = User.ROLES;

// Public: product reviews (only approved are returned)
router.get('/product/:productId', ReviewController.getProductReviews);

router.use(AuthMiddleware.authenticate);

// Admin routes
router.get('/admin/list', AuthMiddleware.authorize(SUPER_ADMIN), ReviewController.listAdmin);
router.patch('/admin/:id', AuthMiddleware.authorize(SUPER_ADMIN), ReviewController.updateStatus);
router.delete('/admin/:id', AuthMiddleware.authorize(SUPER_ADMIN), ReviewController.remove);

// Customer routes
router.get('/writable', AuthMiddleware.authorize(CUSTOMER), ReviewController.getWritableReviews);
router.post('/', AuthMiddleware.authorize(CUSTOMER), ReviewController.create);
router.put('/:id', AuthMiddleware.authorize(CUSTOMER), ReviewController.update);
router.delete('/:id', AuthMiddleware.authorize(CUSTOMER, SUPER_ADMIN), ReviewController.remove);

module.exports = router;

