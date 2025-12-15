const { Op } = require('sequelize')
const { Coupon, CouponRedemption } = require('../models')

class CouponService {
  static normalizeCode(code) {
    return typeof code === 'string' ? code.trim().toUpperCase() : null
  }

  static buildIdentityFilters(user, email, phone) {
    const filters = []
    if (user?.id) filters.push({ userId: user.id })
    if (email) filters.push({ email })
    if (phone) filters.push({ phone })
    return filters
  }

  static calculateDiscount(coupon, orderAmount) {
    const numericAmount = Number(orderAmount) || 0
    if (numericAmount <= 0) return 0

    const discountValue = Number(coupon.discountValue) || 0
    let discount =
      coupon.discountType === 'PERCENT'
        ? (numericAmount * discountValue) / 100
        : discountValue

    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, Number(coupon.maxDiscountAmount))
    }

    return Math.max(0, Math.min(discount, numericAmount))
  }

  static async validateCoupon({ code, user, email, phone, orderAmount, transaction, lockCoupon = false }) {
    const normalizedCode = this.normalizeCode(code)
    if (!normalizedCode) {
      throw new Error('Coupon code is required')
    }

    const findOptions = {
      where: { code: normalizedCode },
      transaction,
    }

    if (transaction && lockCoupon) {
      findOptions.lock = transaction.LOCK.UPDATE
    }

    const coupon = await Coupon.findOne(findOptions)
    if (!coupon) {
      throw new Error('Invalid coupon code')
    }

    const now = new Date()
    if (!coupon.isActive) throw new Error('Coupon is inactive')
    if (coupon.startAt && now < coupon.startAt) throw new Error('Coupon is not active yet')
    if (coupon.endAt && now > coupon.endAt) throw new Error('Coupon has expired')

    const numericAmount = Number(orderAmount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Order amount must be greater than zero')
    }

    if (coupon.minOrderAmount && numericAmount < Number(coupon.minOrderAmount)) {
      throw new Error(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`)
    }

    if (coupon.globalMaxRedemptions) {
      const totalRedemptions = await CouponRedemption.count({
        where: { couponId: coupon.id },
        transaction,
      })
      if (totalRedemptions >= coupon.globalMaxRedemptions) {
        throw new Error('This coupon has reached its redemption limit')
      }
    }

    const identityFilters = this.buildIdentityFilters(user, email, phone)
    if (identityFilters.length > 0) {
      const usedByUser = await CouponRedemption.count({
        where: { couponId: coupon.id, [Op.or]: identityFilters },
        transaction,
      })
      if (usedByUser >= coupon.perUserLimit) {
        throw new Error('Coupon redemption limit reached for this user')
      }
    }

    const discountAmount = this.calculateDiscount(coupon, numericAmount)
    return { coupon, discountAmount }
  }
}

module.exports = CouponService
