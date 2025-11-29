const { Op } = require('sequelize')
const { User, Product, ProductVariant, Order } = require('../../models')

const LOW_STOCK_THRESHOLD = 5
const PENDING_STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY']
const RETURN_STATUSES = ['RETURN_REQUESTED']
const COMPLETED_STATUSES = ['DELIVERED']
const CANCELLED_STATUSES = ['CANCELLED']

const asNumber = (value) => Number(value || 0)

const buildUserStats = async () => {
  const [total, customers, partners, superAdmins, active, inactive] = await Promise.all([
    User.count(),
    User.count({ where: { role: User.ROLES.CUSTOMER } }),
    User.count({ where: { role: User.ROLES.PARTNER } }),
    User.count({ where: { role: User.ROLES.SUPER_ADMIN } }),
    User.count({ where: { isActive: true } }),
    User.count({ where: { isActive: false } }),
  ])

  return { total, customers, partners, superAdmins, active, inactive }
}

const buildProductStats = async () => {
  const [totalProducts, activeProducts, totalVariants, outOfStockVariants, lowStockVariants, stockOnHand] = await Promise.all([
    Product.count(),
    Product.count({ where: { isActive: true } }),
    ProductVariant.count(),
    ProductVariant.count({
      where: {
        [Op.or]: [{ stockQuantity: { [Op.lte]: 0 } }, { isAvailable: false }],
      },
    }),
    ProductVariant.count({
      where: {
        isAvailable: true,
        stockQuantity: {
          [Op.gt]: 0,
          [Op.lte]: LOW_STOCK_THRESHOLD,
        },
      },
    }),
    ProductVariant.sum('stockQuantity', { where: { isAvailable: true } }),
  ])

  return {
    totalProducts,
    activeProducts,
    totalVariants,
    outOfStockVariants,
    lowStockVariants,
    stockOnHand: asNumber(stockOnHand),
  }
}

const buildOrderStats = async () => {
  const [total, completed, pending, cancelled, returnRequested] = await Promise.all([
    Order.count(),
    Order.count({ where: { status: { [Op.in]: COMPLETED_STATUSES } } }),
    Order.count({ where: { status: { [Op.in]: [...PENDING_STATUSES, ...RETURN_STATUSES] } } }),
    Order.count({ where: { status: { [Op.in]: CANCELLED_STATUSES } } }),
    Order.count({ where: { status: { [Op.in]: RETURN_STATUSES } } }),
  ])

  return { total, completed, pending, cancelled, returnRequested }
}

const buildRevenueStats = async () => {
  const [paid, pending, cancelledValue] = await Promise.all([
    Order.sum('total', { where: { paymentStatus: 'paid' } }),
    Order.sum('total', {
      where: {
        paymentStatus: 'pending',
        status: { [Op.notIn]: CANCELLED_STATUSES },
      },
    }),
    Order.sum('total', { where: { status: { [Op.in]: CANCELLED_STATUSES } } }),
  ])

  const paidValue = asNumber(paid)
  const pendingValue = asNumber(pending)

  return {
    paid: paidValue,
    pending: pendingValue,
    expected: paidValue + pendingValue,
    cancelled: asNumber(cancelledValue),
  }
}

const buildPartnerOrderStats = async (partnerId) => {
  const baseWhere = { assignedPartnerId: partnerId }
  const [assigned, completed, pending, cancelled, returnRequested] = await Promise.all([
    Order.count({ where: baseWhere }),
    Order.count({ where: { ...baseWhere, status: { [Op.in]: COMPLETED_STATUSES } } }),
    Order.count({ where: { ...baseWhere, status: { [Op.in]: [...PENDING_STATUSES, ...RETURN_STATUSES] } } }),
    Order.count({ where: { ...baseWhere, status: { [Op.in]: CANCELLED_STATUSES } } }),
    Order.count({ where: { ...baseWhere, status: { [Op.in]: RETURN_STATUSES } } }),
  ])

  return { assigned, completed, pending, cancelled, returnRequested }
}

const buildPartnerRevenueStats = async (partnerId) => {
  const baseWhere = { assignedPartnerId: partnerId }
  const [completedValue, inProgressValue, outstandingCod, assignedValue] = await Promise.all([
    Order.sum('total', { where: { ...baseWhere, status: { [Op.in]: COMPLETED_STATUSES } } }),
    Order.sum('total', {
      where: {
        ...baseWhere,
        status: { [Op.in]: [...PENDING_STATUSES, ...RETURN_STATUSES] },
        paymentStatus: { [Op.ne]: 'cancelled' },
      },
    }),
    Order.sum('total', {
      where: {
        ...baseWhere,
        paymentStatus: 'pending',
        status: { [Op.notIn]: CANCELLED_STATUSES },
      },
    }),
    Order.sum('total', { where: { ...baseWhere, status: { [Op.notIn]: CANCELLED_STATUSES } } }),
  ])

  return {
    assignedValue: asNumber(assignedValue),
    completedValue: asNumber(completedValue),
    inProgressValue: asNumber(inProgressValue),
    outstandingCod: asNumber(outstandingCod),
  }
}

class DashboardController {
  static async admin(_req, res) {
    try {
      const [users, products, orders, revenue] = await Promise.all([
        buildUserStats(),
        buildProductStats(),
        buildOrderStats(),
        buildRevenueStats(),
      ])

      return res.json({
        success: true,
        data: { users, products, orders, revenue },
      })
    } catch (error) {
      console.error('Admin dashboard error:', error)
      return res.status(500).json({ success: false, message: 'Failed to load admin dashboard' })
    }
  }

  static async partner(req, res) {
    try {
      const partnerId = req.user.id
      const [orders, revenue] = await Promise.all([
        buildPartnerOrderStats(partnerId),
        buildPartnerRevenueStats(partnerId),
      ])

      return res.json({
        success: true,
        data: { orders, revenue },
      })
    } catch (error) {
      console.error('Partner dashboard error:', error)
      return res.status(500).json({ success: false, message: 'Failed to load partner dashboard' })
    }
  }
}

module.exports = DashboardController
