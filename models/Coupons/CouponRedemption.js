const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const CouponRedemption = sequelize.define(
    'CouponRedemption',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      couponId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      redeemedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'CouponRedemptions',
      timestamps: true,
      indexes: [
        { fields: ['couponId'] },
        { fields: ['userId'] },
        { fields: ['email'] },
        { fields: ['phone'] },
      ],
    },
  )

  CouponRedemption.associate = (models) => {
    CouponRedemption.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' })
    CouponRedemption.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' })
    CouponRedemption.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
  }

  return CouponRedemption
}
