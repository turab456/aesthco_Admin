const { DataTypes } = require('sequelize')

const COUPON_TYPES = ['WELCOME', 'SEASONAL', 'OTHER']
const DISCOUNT_TYPES = ['PERCENT', 'FIXED']

module.exports = (sequelize) => {
  const Coupon = sequelize.define(
    'Coupon',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        set(value) {
          if (typeof value === 'string') {
            this.setDataValue('code', value.trim().toUpperCase())
          } else {
            this.setDataValue('code', value)
          }
        },
      },
      type: {
        type: DataTypes.ENUM(...COUPON_TYPES),
        allowNull: false,
        defaultValue: 'OTHER',
      },
      discountType: {
        type: DataTypes.ENUM(...DISCOUNT_TYPES),
        allowNull: false,
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      startAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      globalMaxRedemptions: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      perUserLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      minOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: 'Coupons',
      timestamps: true,
      indexes: [{ unique: true, fields: ['code'] }],
    },
  )

  Coupon.associate = (models) => {
    Coupon.hasMany(models.CouponRedemption, {
      foreignKey: 'couponId',
      as: 'redemptions',
      onDelete: 'CASCADE',
    })
    Coupon.hasMany(models.Order, {
      foreignKey: 'couponId',
      as: 'orders',
    })
  }

  Coupon.TYPES = COUPON_TYPES
  Coupon.DISCOUNT_TYPES = DISCOUNT_TYPES

  return Coupon
}
