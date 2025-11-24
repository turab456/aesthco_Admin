const { Op } = require('sequelize')
const {
  Cart,
  UserAddress,
  Product,
  ProductVariant,
  ProductImage,
  Color,
  Size,
  Order,
  OrderItem,
  ShippingSetting,
} = require('../../models')

const DEFAULT_SHIPPING = {
  threshold: 1999,
  fee: 0,
}

const getActiveShippingSetting = async () => {
  const setting = await ShippingSetting.findOne({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  })

  if (!setting) return DEFAULT_SHIPPING

  return {
    threshold: Number(setting.freeShippingThreshold),
    fee: Number(setting.shippingFee),
  }
}

const buildShippingLabel = (order, items) => {
  return {
    orderId: order.id,
    codAmount: Number(order.total),
    paymentMethod: order.paymentMethod,
    customer: {
      name: order.addressName,
      phone: order.addressPhone,
    },
    address: {
      line1: order.addressLine1,
      line2: order.addressLine2,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
    },
    items: items.map((item) => ({
      name: item.productName,
      qty: item.quantity,
      amount: Number(item.totalPrice),
      sku: item.sku,
    })),
  }
}

class OrderController {
  static async createFromCart(req, res) {
    const userId = req.user.id
    const { addressId } = req.body

    try {
      if (!addressId) {
        return res.status(400).json({ success: false, message: 'Address is required' })
      }

      const address = await UserAddress.findOne({ where: { id: addressId, userId } })
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' })
      }

      const cartItems = await Cart.findAll({
        where: { userId },
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: ProductVariant,
                as: 'variants',
                include: [
                  { model: Color, as: 'color' },
                  { model: Size, as: 'size' },
                ],
              },
              {
                model: ProductImage,
                as: 'images',
                include: [{ model: Color, as: 'color' }],
              },
            ],
          },
          { model: Color, as: 'color' },
          { model: Size, as: 'size' },
        ],
      })

      if (!cartItems.length) {
        return res.status(400).json({ success: false, message: 'Cart is empty' })
      }

      const shippingSetting = await getActiveShippingSetting()

      const mappedItems = cartItems.map((item) => {
        const product = item.product
        if (!product || product.isActive === false) {
          throw new Error(`Product ${product?.name || item.productId} is inactive`)
        }
        const matchedVariant =
          product.variants?.find(
            (variant) =>
              variant.colorId === item.colorId &&
              variant.sizeId === item.sizeId,
          ) ||
          product.variants?.find((variant) => variant.colorId === item.colorId) ||
          product.variants?.find((variant) => variant.sizeId === item.sizeId)

        if (!matchedVariant) {
          throw new Error(`Variant not found for product ${product.name}`)
        }

        const stockQty = Number(matchedVariant.stockQuantity ?? 0)
        if (!matchedVariant.isAvailable || stockQty <= 0) {
          throw new Error(`Variant out of stock for product ${product.name}`)
        }

        const unitPrice =
          matchedVariant.salePrice && Number(matchedVariant.salePrice) > 0
            ? Number(matchedVariant.salePrice)
            : Number(matchedVariant.basePrice)

        const quantity = item.quantity
        const colorName = matchedVariant.color?.name || item.color?.name || null
        const sizeName = matchedVariant.size?.code || matchedVariant.size?.label || item.size?.label || null
        const image =
          product.images?.find((img) => img.colorId === item.colorId) ||
          product.images?.[0]

        return {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantId: matchedVariant.id,
          colorId: matchedVariant.colorId,
          sizeId: matchedVariant.sizeId,
          colorName,
          sizeName,
          sku: matchedVariant.sku,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          imageUrl: image?.imageUrl || null,
        }
      })

      const subtotal = mappedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const shippingFee = subtotal >= shippingSetting.threshold ? 0 : shippingSetting.fee
      const total = subtotal + shippingFee

      const orderPayload = {
        userId,
        status: 'PLACED',
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        subtotal,
        shippingFee,
        total,
        addressName: address.name,
        addressPhone: address.phoneNumber,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      }

      const order = await Order.sequelize.transaction(async (t) => {
        const createdOrder = await Order.create(orderPayload, { transaction: t })
        const itemsWithOrder = mappedItems.map((i) => ({ ...i, orderId: createdOrder.id }))
        const createdItems = await OrderItem.bulkCreate(itemsWithOrder, { transaction: t, returning: true })

        const shippingLabel = buildShippingLabel(createdOrder, createdItems)
        await createdOrder.update({ shippingLabel }, { transaction: t })

        await Cart.destroy({ where: { userId }, transaction: t })

        return await Order.findByPk(createdOrder.id, {
          include: [{ model: OrderItem, as: 'items' }],
          transaction: t,
        })
      })

      return res.status(201).json({ success: true, data: order })
    } catch (error) {
      console.error('Create order error:', error)
      return res.status(400).json({ success: false, message: error.message || 'Failed to create order' })
    }
  }

  static async listCustomerOrders(req, res) {
    const userId = req.user.id
    try {
      const orders = await Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [{ model: OrderItem, as: 'items' }],
      })
      return res.json({ success: true, data: orders })
    } catch (error) {
      console.error('List customer orders error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' })
    }
  }

  static async getCustomerOrder(req, res) {
    const userId = req.user.id
    const { id } = req.params
    try {
      const order = await Order.findOne({
        where: { id, userId },
        include: [{ model: OrderItem, as: 'items' }],
      })

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      return res.json({ success: true, data: order })
    } catch (error) {
      console.error('Get customer order error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch order' })
    }
  }

  static async listAdminOrders(_req, res) {
    try {
      const orders = await Order.findAll({
        order: [['createdAt', 'DESC']],
        include: [{ model: OrderItem, as: 'items' }],
      })
      return res.json({ success: true, data: orders })
    } catch (error) {
      console.error('List admin orders error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' })
    }
  }

  static async getAdminOrder(req, res) {
    const { id } = req.params
    try {
      const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] })
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }
      return res.json({ success: true, data: order })
    } catch (error) {
      console.error('Admin get order error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch order' })
    }
  }

  static async listPartnerOrders(req, res) {
    const partnerId = req.user.id
    try {
      const orders = await Order.findAll({
        where: {
          [Op.or]: [{ assignedPartnerId: null }, { assignedPartnerId: partnerId }],
        },
        order: [['createdAt', 'DESC']],
        include: [{ model: OrderItem, as: 'items' }],
      })
      return res.json({ success: true, data: orders })
    } catch (error) {
      console.error('List partner orders error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' })
    }
  }

  static async updateStatusByPartner(req, res) {
    const partnerId = req.user.id
    const { id } = req.params
    const { status } = req.body

    try {
      if (!Order.STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' })
      }

      const order = await Order.findByPk(id)
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      if (order.assignedPartnerId && order.assignedPartnerId !== partnerId) {
        return res.status(403).json({ success: false, message: 'Order is assigned to another partner' })
      }

      const nextPaymentStatus =
        status === 'DELIVERED'
          ? 'paid'
          : status === 'CANCELLED'
            ? 'cancelled'
            : order.paymentStatus

      await order.update(
        {
          status,
          assignedPartnerId: order.assignedPartnerId || partnerId,
          paymentStatus: nextPaymentStatus,
        },
        { returning: true },
      )

      return res.json({ success: true, data: order })
    } catch (error) {
      console.error('Update order status error:', error)
      return res.status(500).json({ success: false, message: 'Failed to update status' })
    }
  }

  static async getPartnerOrder(req, res) {
    const partnerId = req.user.id
    const { id } = req.params
    try {
      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'items' }],
      })

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }

      if (order.assignedPartnerId && order.assignedPartnerId !== partnerId) {
        return res.status(403).json({ success: false, message: 'Order is assigned to another partner' })
      }

      return res.json({ success: true, data: order })
    } catch (error) {
      console.error('Partner get order error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch order' })
    }
  }

  static async upsertShippingSetting(req, res) {
    const { freeShippingThreshold, shippingFee, isActive = true } = req.body
    try {
      const setting = await ShippingSetting.create({
        freeShippingThreshold: freeShippingThreshold ?? DEFAULT_SHIPPING.threshold,
        shippingFee: shippingFee ?? DEFAULT_SHIPPING.fee,
        isActive,
      })
      return res.status(201).json({ success: true, data: setting })
    } catch (error) {
      console.error('Shipping setting error:', error)
      return res.status(400).json({ success: false, message: error.message || 'Failed to save shipping setting' })
    }
  }

  static async getShippingSetting(_req, res) {
    try {
      const setting = await ShippingSetting.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
      })
      return res.json({
        success: true,
        data: setting || {
          freeShippingThreshold: DEFAULT_SHIPPING.threshold,
          shippingFee: DEFAULT_SHIPPING.fee,
        },
      })
    } catch (error) {
      console.error('Get shipping setting error:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch shipping setting' })
    }
  }
}

module.exports = OrderController
