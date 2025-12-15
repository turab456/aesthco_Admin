const { sequelize, User, Order } = require('../../models')

const DELIVERED = 'DELIVERED'
const CANCELLED = 'CANCELLED'

class UserAdminController {
  static async listWithOrderStats(_req, res) {
    try {
      const users = await User.findAll({
        attributes: [
          'id',
          'fullName',
          'email',
          'phoneNumber',
          'role',
          'isActive',
          'isVerified',
          'createdAt',
        ],
        order: [['createdAt', 'DESC']],
        raw: true,
      })

      const orderAggregates = await Order.findAll({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = '${DELIVERED}' THEN 1 ELSE 0 END`)), 'deliveredCount'],
          [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = '${CANCELLED}' THEN 1 ELSE 0 END`)), 'cancelledCount'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalValue'],
          [sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = '${DELIVERED}' THEN total ELSE 0 END`)), 'deliveredValue'],
          [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastOrderAt'],
        ],
        group: ['userId'],
        raw: true,
      })

      const orderByUser = new Map()
      for (const row of orderAggregates) {
        orderByUser.set(row.userId, {
          orderCount: Number(row.orderCount || 0),
          deliveredCount: Number(row.deliveredCount || 0),
          cancelledCount: Number(row.cancelledCount || 0),
          totalValue: Number(row.totalValue || 0),
          deliveredValue: Number(row.deliveredValue || 0),
          lastOrderAt: row.lastOrderAt,
        })
      }

      const data = users.map((user) => ({
        ...user,
        orders: orderByUser.get(user.id) || {
          orderCount: 0,
          deliveredCount: 0,
          cancelledCount: 0,
          totalValue: 0,
          deliveredValue: 0,
          lastOrderAt: null,
        },
      }))

      return res.json({ success: true, data })
    } catch (error) {
      console.error('Admin list users error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch users' })
    }
  }
}

module.exports = UserAdminController
