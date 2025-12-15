const { Op, fn, col } = require('sequelize');
const { Review, Order, OrderItem, Product, User } = require('../../models');

const splitName = (fullName) => {
  if (!fullName) return { firstName: 'Customer', lastName: '' };
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return { firstName: 'Customer', lastName: '' };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') };
};

const serializeFrontendReview = (review) => {
  const { firstName, lastName } = splitName(review.user?.fullName);
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    is_featured: review.isFeatured,
    createdAt: review.createdAt,
    user: {
      firstName,
      lastName,
    },
  };
};

const serializeAdminReview = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  isApproved: review.isApproved,
  isFeatured: review.isFeatured,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  product: review.product
    ? {
        id: review.product.id,
        name: review.product.name,
        slug: review.product.slug,
      }
    : null,
  order: review.order
    ? {
        id: review.order.id,
        status: review.order.status,
        placedAt: review.order.createdAt,
      }
    : null,
  user: review.user
    ? {
        id: review.user.id,
        name: review.user.fullName,
        email: review.user.email,
        phoneNumber: review.user.phoneNumber,
      }
    : null,
});

const serializeWritableReviewItem = (order, item, review) => ({
  order_id: order.id,
  order_date: order.createdAt,
  product_id: item.productId,
  product_name: item.productName,
  product_slug: item.productSlug,
  product_image: item.imageUrl,
  review: review
    ? {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        is_approved: review.isApproved,
        is_featured: review.isFeatured,
      }
    : undefined,
});

class ReviewController {
  static async getProductReviews(req, res) {
    try {
      const productId = Number(req.params.productId);
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product id is required.' });
      }

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const ratingFilter = req.query.rating ? Number(req.query.rating) : null;

      const where = { productId, isApproved: true };
      if (ratingFilter) where.rating = ratingFilter;

      const [paginated, summaryRow, distribution] = await Promise.all([
        Review.findAndCountAll({
          where,
          include: [{ model: User, as: 'user', attributes: ['fullName'] }],
          order: [
            ['isFeatured', 'DESC'],
            ['createdAt', 'DESC'],
          ],
          limit,
          offset: (page - 1) * limit,
        }),
        Review.findOne({
          attributes: [
            [fn('COUNT', col('id')), 'totalReviews'],
            [fn('COALESCE', fn('AVG', col('rating')), 0), 'averageRating'],
          ],
          where: { productId, isApproved: true },
          raw: true,
        }),
        Review.findAll({
          attributes: ['rating', [fn('COUNT', col('rating')), 'count']],
          where: { productId, isApproved: true },
          group: ['rating'],
          raw: true,
        }),
      ]);

      const totalReviews = Number(summaryRow?.totalReviews || 0);
      const averageRating = totalReviews > 0 ? Number(summaryRow.averageRating || 0) : 0;

      const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
        const match = distribution.find((d) => Number(d.rating) === rating);
        return { rating, count: Number(match?.count || 0) };
      });

      return res.json({
        success: true,
        data: {
          reviews: paginated.rows.map(serializeFrontendReview),
          summary: {
            totalReviews,
            averageRating,
            ratingDistribution,
          },
        },
      });
    } catch (error) {
      console.error('Get product reviews error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
    }
  }

  static async getWritableReviews(req, res) {
    try {
      const userId = req.user.id;
      const deliveredOrders = await Order.findAll({
        where: { userId, status: 'DELIVERED' },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['createdAt', 'DESC']],
      });

      const orderIds = deliveredOrders.map((o) => o.id);
      if (!orderIds.length) {
        return res.json({ success: true, data: { writableReviews: [], reviewedReviews: [] } });
      }

      const existingReviews = await Review.findAll({
        where: {
          userId,
          orderId: { [Op.in]: orderIds },
        },
      });

      const reviewByKey = new Map(
        existingReviews.map((rev) => [`${rev.orderId}-${rev.productId}`, rev]),
      );

      const writableReviews = [];
      const reviewedReviews = [];

      for (const order of deliveredOrders) {
        for (const item of order.items || []) {
          const key = `${order.id}-${item.productId}`;
          const review = reviewByKey.get(key);
          const mapped = serializeWritableReviewItem(order, item, review);
          if (review) reviewedReviews.push(mapped);
          else writableReviews.push(mapped);
        }
      }

      return res.json({ success: true, data: { writableReviews, reviewedReviews } });
    } catch (error) {
      console.error('Get writable reviews error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch reviewable items.' });
    }
  }

  static async create(req, res) {
    try {
      const userId = req.user.id;
      const productId = Number(req.body.productId || req.body.product_id);
      const orderId = req.body.orderId || req.body.order_id;
      const rating = Number(req.body.rating);
      const comment = req.body.comment?.trim() || null;

      if (!productId || !orderId) {
        return res.status(400).json({ success: false, message: 'product_id and order_id are required.' });
      }
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
      }

      const order = await Order.findOne({
        where: { id: orderId, userId, status: 'DELIVERED' },
        include: [
          {
            model: OrderItem,
            as: 'items',
            where: { productId },
            required: true,
          },
        ],
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          message: 'You can only review delivered items from your orders.',
        });
      }

      const existing = await Review.findOne({ where: { userId, productId, orderId } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this item for this order.',
        });
      }

      const review = await Review.create({
        userId,
        productId,
        orderId,
        rating,
        comment,
        isApproved: false,
        isFeatured: false,
      });

      return res.status(201).json({
        success: true,
        message: 'Review submitted for approval.',
        data: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          isFeatured: review.isFeatured,
        },
      });
    } catch (error) {
      console.error('Create review error:', error);
      return res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
  }

  static async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const rating = req.body.rating ? Number(req.body.rating) : null;
      const commentProvided = Object.prototype.hasOwnProperty.call(req.body, 'comment');
      const comment = commentProvided ? req.body.comment?.trim() || null : undefined;

      const review = await Review.findOne({ where: { id, userId } });
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
      }

      const payload = {
        rating: rating ?? review.rating,
        isApproved: false,
        isFeatured: false,
      };

      if (commentProvided) {
        payload.comment = comment;
      }

      await review.update(payload);

      return res.json({
        success: true,
        message: 'Review updated and sent for approval.',
        data: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.isApproved,
          isFeatured: review.isFeatured,
        },
      });
    } catch (error) {
      console.error('Update review error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update review.' });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const review = await Review.findByPk(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }

      const isOwner = req.user?.id && review.userId === req.user.id;
      const isAdmin = req.user?.role === User.ROLES.SUPER_ADMIN;
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
      }

      await review.destroy();
      return res.json({ success: true, message: 'Review deleted.' });
    } catch (error) {
      console.error('Delete review error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete review.' });
    }
  }

  static async listAdmin(req, res) {
    try {
      const { status, rating, productId, userId } = req.query;
      const where = {};

      if (status === 'approved') where.isApproved = true;
      else if (status === 'pending') where.isApproved = false;
      if (rating) where.rating = Number(rating);
      if (productId) where.productId = Number(productId);
      if (userId) where.userId = userId;

      const reviews = await Review.findAll({
        where,
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] },
          { model: Order, as: 'order', attributes: ['id', 'status', 'createdAt'] },
          { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phoneNumber'] },
        ],
        order: [
          ['isApproved', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });

      return res.json({ success: true, data: reviews.map(serializeAdminReview) });
    } catch (error) {
      console.error('List admin reviews error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { isApproved, isFeatured } = req.body;

      if (typeof isApproved !== 'boolean' && typeof isFeatured !== 'boolean') {
        return res
          .status(400)
          .json({ success: false, message: 'isApproved or isFeatured must be provided.' });
      }

      const review = await Review.findByPk(id, {
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] },
          { model: Order, as: 'order', attributes: ['id', 'status', 'createdAt'] },
          { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phoneNumber'] },
        ],
      });

      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }

      const updates = {};
      if (typeof isApproved === 'boolean') updates.isApproved = isApproved;
      if (typeof isFeatured === 'boolean') updates.isFeatured = isFeatured;

      await review.update(updates);

      return res.json({
        success: true,
        message: 'Review status updated.',
        data: serializeAdminReview(review),
      });
    } catch (error) {
      console.error('Update review status error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update review.' });
    }
  }
}

module.exports = ReviewController;
