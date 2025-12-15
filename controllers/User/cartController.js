const { Cart, Product, Color, Size } = require("../../models");

const buildKeyWhere = (userId, body) => ({
  userId,
  productId: body.productId,
  colorId: body.colorId || null,
  sizeId: body.sizeId || null,
});

class CartController {
  static async list(req, res) {
    try {
    const items = await Cart.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Product, as: "product" },
        { model: Color, as: "color" },
        { model: Size, as: "size" },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.json({ success: true, data: items });
    } catch (error) {
      console.error("Cart list error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch cart items." });
    }
  }

  static async add(req, res) {
    try {
      const { productId, quantity = 1, colorId = null, sizeId = null } = req.body;
      if (!productId) {
        return res
          .status(400)
          .json({ success: false, message: "productId is required." });
      }
      const parsedQty = Math.max(1, Number(quantity) || 1);

      const [item, created] = await Cart.findOrCreate({
        where: buildKeyWhere(req.user.id, { productId, colorId, sizeId }),
        defaults: {
          userId: req.user.id,
          productId,
          colorId,
          sizeId,
          quantity: parsedQty,
        },
      });

      if (!created) {
        await item.update({ quantity: item.quantity + parsedQty });
      }

      const fresh = await Cart.findByPk(item.id, {
        include: [
          { model: Product, as: "product" },
          { model: Color, as: "color" },
          { model: Size, as: "size" },
        ],
      });

      return res.status(created ? 201 : 200).json({
        success: true,
        message: created ? "Item added to cart." : "Cart updated.",
        data: fresh,
      });
    } catch (error) {
      console.error("Cart add error:", error);
      return res
        .status(400)
        .json({ success: false, message: error.message || "Failed to update cart." });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const item = await Cart.findOne({ where: { id, userId: req.user.id } });
      if (!item) {
        return res.status(404).json({ success: false, message: "Cart item not found." });
      }
      const parsedQty = Math.max(1, Number(quantity) || 1);
      await item.update({ quantity: parsedQty });
      return res.json({ success: true, message: "Cart item updated.", data: item });
    } catch (error) {
      console.error("Cart update error:", error);
      return res
        .status(400)
        .json({ success: false, message: error.message || "Failed to update cart." });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const item = await Cart.findOne({ where: { id, userId: req.user.id } });
      if (!item) {
        return res.status(404).json({ success: false, message: "Cart item not found." });
      }
      await item.destroy();
      return res.json({ success: true, message: "Cart item removed." });
    } catch (error) {
      console.error("Cart delete error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to remove cart item." });
    }
  }

  static async clear(req, res) {
    try {
      await Cart.destroy({ where: { userId: req.user.id } });
      return res.json({ success: true, message: "Cart cleared." });
    } catch (error) {
      console.error("Cart clear error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to clear cart." });
    }
  }
}

module.exports = CartController;
