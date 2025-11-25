const { Op } = require('sequelize')
const { sequelize, Coupon, CouponRedemption } = require('../../models')
const CouponService = require('../../services/CouponService')

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

class CouponController {
  static async create(req, res) {
    try {
      const {
        code,
        type = 'OTHER',
        discountType,
        discountValue,
        startAt,
        endAt,
        globalMaxRedemptions,
        perUserLimit = 1,
        isActive = true,
        minOrderAmount,
        maxDiscountAmount,
      } = req.body

      if (!code || !discountType || discountValue === undefined) {
        return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required' })
      }

      if (!Coupon.DISCOUNT_TYPES.includes(discountType)) {
        return res.status(400).json({ success: false, message: 'Invalid discountType' })
      }

      if (!Coupon.TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid coupon type' })
      }

      const numericDiscount = Number(discountValue)
      if (Number.isNaN(numericDiscount) || numericDiscount <= 0) {
        return res.status(400).json({ success: false, message: 'discountValue must be greater than zero' })
      }

      if (discountType === 'PERCENT' && numericDiscount > 100) {
        return res.status(400).json({ success: false, message: 'Percent discount cannot exceed 100' })
      }

      const startDate = startAt ? new Date(startAt) : null
      const endDate = endAt ? new Date(endAt) : null
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ success: false, message: 'startAt must be before endAt' })
      }

      const parsedGlobalMax = parseOptionalNumber(globalMaxRedemptions)
      if (parsedGlobalMax !== null && parsedGlobalMax < 1) {
        return res.status(400).json({ success: false, message: 'globalMaxRedemptions must be at least 1 when provided' })
      }

      const parsedPerUserLimit = parseOptionalNumber(perUserLimit)
      if (parsedPerUserLimit !== null && parsedPerUserLimit < 1) {
        return res.status(400).json({ success: false, message: 'perUserLimit must be at least 1' })
      }

      const parsedMinOrder = parseOptionalNumber(minOrderAmount)
      if (parsedMinOrder !== null && parsedMinOrder < 0) {
        return res.status(400).json({ success: false, message: 'minOrderAmount cannot be negative' })
      }

      const parsedMaxDiscount = parseOptionalNumber(maxDiscountAmount)
      if (parsedMaxDiscount !== null && parsedMaxDiscount <= 0) {
        return res.status(400).json({ success: false, message: 'maxDiscountAmount must be greater than zero when provided' })
      }

      const coupon = await Coupon.create({
        code: code.trim().toUpperCase(),
        type,
        discountType,
        discountValue: numericDiscount,
        startAt: startDate,
        endAt: endDate,
        globalMaxRedemptions: parsedGlobalMax,
        perUserLimit: parsedPerUserLimit ?? 1,
        isActive: Boolean(isActive),
        minOrderAmount: parsedMinOrder,
        maxDiscountAmount: parsedMaxDiscount,
      })

      return res.status(201).json({ success: true, data: coupon })
    } catch (error) {
      console.error('Create coupon error:', error)
      return res.status(400).json({ success: false, message: error.message || 'Failed to create coupon' })
    }
  }

  static async update(req, res) {
    const { id } = req.params
    try {
      const coupon = await Coupon.findByPk(id)
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' })
      }

      const {
        code,
        type,
        discountType,
        discountValue,
        startAt,
        endAt,
        globalMaxRedemptions,
        perUserLimit,
        isActive,
        minOrderAmount,
        maxDiscountAmount,
      } = req.body

      const updates = {}
      if (code) updates.code = code.trim().toUpperCase()
      if (type) {
        if (!Coupon.TYPES.includes(type)) {
          return res.status(400).json({ success: false, message: 'Invalid coupon type' })
        }
        updates.type = type
      }
      if (discountType) {
        if (!Coupon.DISCOUNT_TYPES.includes(discountType)) {
          return res.status(400).json({ success: false, message: 'Invalid discountType' })
        }
        updates.discountType = discountType
      }
      if (discountValue !== undefined) {
        const numericDiscount = Number(discountValue)
        if (Number.isNaN(numericDiscount) || numericDiscount <= 0) {
          return res.status(400).json({ success: false, message: 'discountValue must be greater than zero' })
        }
        if ((updates.discountType || coupon.discountType) === 'PERCENT' && numericDiscount > 100) {
          return res.status(400).json({ success: false, message: 'Percent discount cannot exceed 100' })
        }
        updates.discountValue = numericDiscount
      }
      if (startAt !== undefined) updates.startAt = startAt ? new Date(startAt) : null
      if (endAt !== undefined) updates.endAt = endAt ? new Date(endAt) : null
      if (globalMaxRedemptions !== undefined) {
        const parsed = parseOptionalNumber(globalMaxRedemptions)
        if (parsed !== null && parsed < 1) {
          return res.status(400).json({ success: false, message: 'globalMaxRedemptions must be at least 1 when provided' })
        }
        updates.globalMaxRedemptions = parsed
      }
      if (perUserLimit !== undefined) {
        const parsedPerUser = parseOptionalNumber(perUserLimit)
        if (parsedPerUser !== null && parsedPerUser < 1) {
          return res.status(400).json({ success: false, message: 'perUserLimit must be at least 1' })
        }
        updates.perUserLimit = parsedPerUser ?? 1
      }
      if (isActive !== undefined) updates.isActive = Boolean(isActive)
      if (minOrderAmount !== undefined) {
        const parsedMin = parseOptionalNumber(minOrderAmount)
        if (parsedMin !== null && parsedMin < 0) {
          return res.status(400).json({ success: false, message: 'minOrderAmount cannot be negative' })
        }
        updates.minOrderAmount = parsedMin
      }
      if (maxDiscountAmount !== undefined) {
        const parsedMax = parseOptionalNumber(maxDiscountAmount)
        if (parsedMax !== null && parsedMax <= 0) {
          return res.status(400).json({ success: false, message: 'maxDiscountAmount must be greater than zero when provided' })
        }
        updates.maxDiscountAmount = parsedMax
      }

      const nextStart = updates.startAt !== undefined ? updates.startAt : coupon.startAt
      const nextEnd = updates.endAt !== undefined ? updates.endAt : coupon.endAt
      if (nextStart && nextEnd && nextStart > nextEnd) {
        return res.status(400).json({ success: false, message: 'startAt must be before endAt' })
      }

      await coupon.update(updates)
      return res.json({ success: true, data: coupon })
    } catch (error) {
      console.error('Update coupon error:', error)
      return res.status(400).json({ success: false, message: error.message || 'Failed to update coupon' })
    }
  }

  static async list(_req, res) {
    try {
      const coupons = await Coupon.findAll({
        attributes: {
          include: [[sequelize.fn('COUNT', sequelize.col('redemptions.id')), 'redemptionsCount']],
        },
        include: [{ model: CouponRedemption, as: 'redemptions', attributes: [], required: false }],
        group: ['Coupon.id'],
        order: [['createdAt', 'DESC']],
      })

      return res.json({ success: true, data: coupons })
    } catch (error) {
      console.error('List coupons error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch coupons' })
    }
  }

  static async validate(req, res) {
    const { code, orderAmount } = req.body
    try {
      const { coupon, discountAmount } = await CouponService.validateCoupon({
        code,
        user: req.user,
        email: req.user.email,
        phone: req.user.phoneNumber,
        orderAmount,
      })

      let remainingGlobal = null
      if (coupon.globalMaxRedemptions) {
        const used = await CouponRedemption.count({ where: { couponId: coupon.id } })
        remainingGlobal = Math.max(coupon.globalMaxRedemptions - used, 0)
      }

      return res.json({
        success: true,
        data: {
          coupon,
          discountAmount,
          remainingGlobal,
        },
      })
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message || 'Invalid coupon' })
    }
  }

  static async listAvailable(req, res) {
    try {
      const now = new Date()
      const identityFilters = CouponService.buildIdentityFilters(req.user, req.user.email, req.user.phoneNumber)

      const query = {
        where: {
          isActive: true,
          [Op.and]: [
            { [Op.or]: [{ startAt: null }, { startAt: { [Op.lte]: now } }] },
            { [Op.or]: [{ endAt: null }, { endAt: { [Op.gte]: now } }] },
          ],
        },
        order: [['createdAt', 'DESC']],
      }

      if (identityFilters.length) {
        query.attributes = {
          include: [[sequelize.fn('COUNT', sequelize.col('redemptions.id')), 'userRedemptions']],
        }
        query.include = [
          {
            model: CouponRedemption,
            as: 'redemptions',
            attributes: [],
            required: false,
            where: { [Op.or]: identityFilters },
          },
        ]
        query.group = ['Coupon.id']
      }

      const coupons = await Coupon.findAll(query)

      // Exclude coupons whose global max redemptions have been reached
      let globalCounts = new Map()
      if (coupons.length) {
        const couponIds = coupons.map((c) => c.id)
        const redemptionCounts = await CouponRedemption.findAll({
          attributes: ['couponId', [sequelize.fn('COUNT', sequelize.col('couponId')), 'count']],
          where: { couponId: couponIds },
          group: ['couponId'],
        })
        globalCounts = new Map(
          redemptionCounts.map((row) => [row.get('couponId'), Number(row.get('count')) || 0]),
        )
      }

      const globallyAvailable = coupons.filter((coupon) => {
        if (!coupon.globalMaxRedemptions) return true
        const used = globalCounts.get(coupon.id) || 0
        return used < coupon.globalMaxRedemptions
      })

      const filteredCoupons =
        identityFilters.length === 0
          ? globallyAvailable
          : globallyAvailable.filter((coupon) => {
              const perUserLimit = coupon.perUserLimit ?? 1
              const usedCount = Number(coupon.get('userRedemptions') || 0)
              if (!perUserLimit) return true
              return usedCount < perUserLimit
            })

      return res.json({ success: true, data: filteredCoupons })
    } catch (error) {
      console.error('List available coupons error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch coupons' })
    }
  }
}

module.exports = CouponController
