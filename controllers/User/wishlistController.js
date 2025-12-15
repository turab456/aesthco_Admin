const { Wishlist, Product } = require("../../models");

class WishlistController {
  static async list(req, res) {
    try {
      const items = await Wishlist.findAll({
        where: { userId: req.user.id },
        include: [{ model: Product, as: "product" }],
        order: [["createdAt", "DESC"]],
      });
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error("Wishlist list error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch wishlist." });
    }
  }

  static async add(req, res) {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res
          .status(400)
          .json({ success: false, message: "productId is required." });
      }

      const [item, created] = await Wishlist.findOrCreate({
        where: { userId: req.user.id, productId },
        defaults: { userId: req.user.id, productId },
      });

      return res.status(created ? 201 : 200).json({
        success: true,
        message: created ? "Added to wishlist." : "Already in wishlist.",
        data: item,
      });
    } catch (error) {
      console.error("Wishlist add error:", error);
      return res
        .status(400)
        .json({ success: false, message: error.message || "Failed to update wishlist." });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const item = await Wishlist.findOne({ where: { id, userId: req.user.id } });
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Wishlist item not found." });
      }
      await item.destroy();
      return res.json({ success: true, message: "Removed from wishlist." });
    } catch (error) {
      console.error("Wishlist delete error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to remove wishlist item." });
    }
  }
}

module.exports = WishlistController;
