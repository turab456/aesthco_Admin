const { DataTypes } = require('sequelize')

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
]

const PAYMENT_METHODS = ['COD']
const PAYMENT_STATUSES = ['pending', 'paid', 'cancelled']

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assignedPartnerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...ORDER_STATUSES),
        allowNull: false,
        defaultValue: 'PLACED',
      },
      paymentMethod: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        defaultValue: 'COD',
      },
      paymentStatus: {
        type: DataTypes.ENUM(...PAYMENT_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      couponId: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      couponCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingLabel: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // address snapshot
      addressName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'Orders',
      timestamps: true,
    },
  )

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId', as: 'customer' })
    Order.belongsTo(models.User, { foreignKey: 'assignedPartnerId', as: 'assignedPartner' })
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' })
    Order.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' })
  }

  Order.STATUSES = ORDER_STATUSES
  Order.PAYMENT_METHODS = PAYMENT_METHODS
  Order.PAYMENT_STATUSES = PAYMENT_STATUSES

  return Order
}
