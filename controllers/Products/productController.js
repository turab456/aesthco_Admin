const { Category, Collection, Product, Color, Size, ProductVariant, ProductImage } = require('../../models');
const cloudinary = require('../../services/cloudinary');
const { Op } = require('sequelize');

const requireBengaluru = (city = '', state = '') => {
  if (city.trim().toLowerCase() !== 'bengaluru' && city.trim().toLowerCase() !== 'bangalore') {
    throw new Error('Only Bengaluru city is supported for addresses.');
  }
  if (state.trim().toLowerCase() !== 'karnataka') {
    throw new Error('Only Karnataka state is supported.');
  }
};

const withRoleGuard = (role) => {
  const allowCreateUpdateDelete = role === 'super-admin';
  return {
    allowCreateUpdateDelete
  };
};

const serializeProduct = (product) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  shortDescription: product.shortDescription,
  description: product.description,
  gender: product.gender,
  isActive: product.isActive,
  categoryId: product.categoryId,
  collectionId: product.collectionId,
  category: product.category ? { id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
  collection: product.collection ? { id: product.collection.id, name: product.collection.name, slug: product.collection.slug } : null,
  images: product.images?.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
    color: img.color
      ? { id: img.color.id, name: img.color.name, code: img.color.code, hexCode: img.color.hexCode }
      : null
  })) || [],
  variants: product.variants?.map((v) => ({
    id: v.id,
    sku: v.sku,
    stockQuantity: v.stockQuantity,
    basePrice: Number(v.basePrice),
    salePrice: v.salePrice ? Number(v.salePrice) : null,
    isAvailable: v.isAvailable,
    color: v.color ? { id: v.color.id, name: v.color.name, code: v.color.code, hexCode: v.color.hexCode } : null,
    size: v.size ? { id: v.size.id, code: v.size.code, label: v.size.label } : null
  })) || []
});

class ProductController {
  static async list(req, res) {
    try {
      const products = await Product.findAll({
        include: [
          { model: Category, as: 'category' },
          { model: Collection, as: 'collection' },
          { model: ProductImage, as: 'images', separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']], include: [{ model: Color, as: 'color' }] },
          {
            model: ProductVariant,
            as: 'variants',
            include: [
              { model: Color, as: 'color' },
              { model: Size, as: 'size' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.json({
        success: true,
        data: products.map(serializeProduct)
      });
    } catch (error) {
      console.error('List products error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
  }

  static async get(req, res) {
    try {
      const { idOrSlug } = req.params;
      const product = await Product.findOne({
        where: {
          [Op.or]: [{ id: idOrSlug }, { slug: idOrSlug }]
        },
        include: [
          { model: Category, as: 'category' },
          { model: Collection, as: 'collection' },
          { model: ProductImage, as: 'images', separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']], include: [{ model: Color, as: 'color' }] },
          {
            model: ProductVariant,
            as: 'variants',
            include: [
              { model: Color, as: 'color' },
              { model: Size, as: 'size' }
            ]
          }
        ]
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.json({ success: true, data: serializeProduct(product) });
    } catch (error) {
      console.error('Get product error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch product.' });
    }
  }

  static async create(req, res) {
    const guard = withRoleGuard(req.user?.role);
    if (!guard.allowCreateUpdateDelete) {
      return res.status(403).json({ success: false, message: 'Only super-admin can manage products.' });
    }

    const t = await Category.sequelize.transaction();
    try {
      const { name, slug, shortDescription, description, gender, categoryId, collectionId, isActive = true, variants = [], images = [] } = req.body;

      // Validation
      const errors = [];
      
      if (!name || !name.trim()) {
        errors.push('Product name is required.');
      }
      if (!slug || !slug.trim()) {
        errors.push('Product slug is required.');
      }
      if (!shortDescription || !shortDescription.trim()) {
        errors.push('Short description is required.');
      }
      if (!description || !description.trim()) {
        errors.push('Product description is required.');
      }
      if (!gender) {
        errors.push('Gender is required.');
      }
      if (!categoryId) {
        errors.push('Category is required.');
      }
      if (!images || images.length === 0) {
        errors.push('At least one image is required.');
      }
      if (!variants || variants.length === 0) {
        errors.push('At least one variant is required.');
      }

      // Validate variants
      if (variants && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.colorId) {
            errors.push(`Variant ${i + 1}: Color is required.`);
          }
          if (!v.sizeId) {
            errors.push(`Variant ${i + 1}: Size is required.`);
          }
          if (!v.sku || !v.sku.trim()) {
            errors.push(`Variant ${i + 1}: SKU is required.`);
          }
          if (v.stockQuantity === undefined || v.stockQuantity === null || v.stockQuantity === '') {
            errors.push(`Variant ${i + 1}: Stock quantity is required.`);
          }
          if (v.basePrice === undefined || v.basePrice === null || v.basePrice === '') {
            errors.push(`Variant ${i + 1}: Base price is required.`);
          }
        }
      }

      if (errors.length > 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: errors.join(' ') });
      }

      const product = await Product.create(
        {
          name,
          slug,
          shortDescription,
          description,
          gender,
          categoryId,
          collectionId: collectionId || null,
          isActive
        },
        { transaction: t }
      );

      for (const variant of variants) {
        await ProductVariant.create(
          {
            productId: product.id,
            colorId: variant.colorId,
            sizeId: variant.sizeId,
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            basePrice: variant.basePrice,
            salePrice: variant.salePrice || null,
            isAvailable: variant.isAvailable ?? true
          },
          { transaction: t }
        );
      }

      for (const [idx, img] of images.entries()) {
        await ProductImage.create(
          {
            productId: product.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: typeof img.sortOrder === 'number' ? img.sortOrder : idx,
            colorId: img.colorId || null
          },
          { transaction: t }
        );
      }

      await t.commit();
      const created = await Product.findByPk(product.id, {
        include: [
          { model: Category, as: 'category' },
          { model: Collection, as: 'collection' },
          { model: ProductImage, as: 'images', include: [{ model: Color, as: 'color' }] },
          { model: ProductVariant, as: 'variants', include: [{ model: Color, as: 'color' }, { model: Size, as: 'size' }] }
        ]
      });

      return res.status(201).json({ success: true, message: 'Product created.', data: serializeProduct(created) });
    } catch (error) {
      await t.rollback();
      console.error('Create product error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create product.' });
    }
  }

  static async update(req, res) {
    const guard = withRoleGuard(req.user?.role);
    if (!guard.allowCreateUpdateDelete) {
      return res.status(403).json({ success: false, message: 'Only super-admin can manage products.' });
    }

    const t = await Category.sequelize.transaction();
    try {
      const { id } = req.params;
      const { name, slug, shortDescription, description, gender, categoryId, collectionId, isActive, variants = [], images = [] } = req.body;

      // Validation
      const errors = [];
      
      if (!name || !name.trim()) {
        errors.push('Product name is required.');
      }
      if (!slug || !slug.trim()) {
        errors.push('Product slug is required.');
      }
      if (!shortDescription || !shortDescription.trim()) {
        errors.push('Short description is required.');
      }
      if (!description || !description.trim()) {
        errors.push('Product description is required.');
      }
      if (!gender) {
        errors.push('Gender is required.');
      }
      if (!categoryId) {
        errors.push('Category is required.');
      }
      if (!images || images.length === 0) {
        errors.push('At least one image is required.');
      }
      if (!variants || variants.length === 0) {
        errors.push('At least one variant is required.');
      }

      // Validate variants
      if (variants && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.colorId) {
            errors.push(`Variant ${i + 1}: Color is required.`);
          }
          if (!v.sizeId) {
            errors.push(`Variant ${i + 1}: Size is required.`);
          }
          if (!v.sku || !v.sku.trim()) {
            errors.push(`Variant ${i + 1}: SKU is required.`);
          }
          if (v.stockQuantity === undefined || v.stockQuantity === null || v.stockQuantity === '') {
            errors.push(`Variant ${i + 1}: Stock quantity is required.`);
          }
          if (v.basePrice === undefined || v.basePrice === null || v.basePrice === '') {
            errors.push(`Variant ${i + 1}: Base price is required.`);
          }
        }
      }

      if (errors.length > 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: errors.join(' ') });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      await product.update(
        {
          name,
          slug,
          shortDescription,
          description,
          gender,
          categoryId,
          collectionId: collectionId || null,
          isActive
        },
        { transaction: t }
      );

      // Handle variants update
      if (variants && variants.length > 0) {
        // Get existing variants
        const existingVariants = await ProductVariant.findAll({
          where: { productId: id },
          transaction: t
        });

        // Delete variants that are not in the new list
        const newVariantIds = variants.filter(v => v.id).map(v => v.id);
        for (const existingVariant of existingVariants) {
          if (!newVariantIds.includes(existingVariant.id)) {
            await existingVariant.destroy({ transaction: t });
          }
        }

        // Create or update variants
        for (const variant of variants) {
          if (variant.id) {
            // Update existing variant
            await ProductVariant.update(
              {
                colorId: variant.colorId,
                sizeId: variant.sizeId,
                sku: variant.sku,
                stockQuantity: variant.stockQuantity,
                basePrice: variant.basePrice,
                salePrice: variant.salePrice || null,
                isAvailable: variant.isAvailable ?? true
              },
              {
                where: { id: variant.id, productId: id },
                transaction: t
              }
            );
          } else {
            // Create new variant
            await ProductVariant.create(
              {
                productId: id,
                colorId: variant.colorId,
                sizeId: variant.sizeId,
                sku: variant.sku,
                stockQuantity: variant.stockQuantity,
                basePrice: variant.basePrice,
                salePrice: variant.salePrice || null,
                isAvailable: variant.isAvailable ?? true
              },
              { transaction: t }
            );
          }
        }
      }

      // Handle images update
      if (images && images.length > 0) {
        // Get existing images
        const existingImages = await ProductImage.findAll({
          where: { productId: id },
          transaction: t
        });

        // Delete images that are not in the new list
        const newImageIds = images.filter(img => img.id).map(img => img.id);
        for (const existingImage of existingImages) {
          if (!newImageIds.includes(existingImage.id)) {
            await existingImage.destroy({ transaction: t });
          }
        }

        // Create or update images
        for (const [idx, img] of images.entries()) {
          if (img.id) {
            // Update existing image
            await ProductImage.update(
              {
                isPrimary: img.isPrimary ?? false,
                sortOrder: typeof img.sortOrder === 'number' ? img.sortOrder : idx,
                colorId: img.colorId || null
              },
              {
                where: { id: img.id, productId: id },
                transaction: t
              }
            );
          } else if (img.imageUrl) {
            // Create new image (only if imageUrl is provided)
            await ProductImage.create(
              {
                productId: id,
                imageUrl: img.imageUrl,
                isPrimary: img.isPrimary ?? false,
                sortOrder: typeof img.sortOrder === 'number' ? img.sortOrder : idx,
                colorId: img.colorId || null
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();
      const updated = await Product.findByPk(id, {
        include: [
          { model: Category, as: 'category' },
          { model: Collection, as: 'collection' },
          { model: ProductImage, as: 'images', include: [{ model: Color, as: 'color' }] },
          { model: ProductVariant, as: 'variants', include: [{ model: Color, as: 'color' }, { model: Size, as: 'size' }] }
        ]
      });

      return res.json({ success: true, message: 'Product updated.', data: serializeProduct(updated) });
    } catch (error) {
      await t.rollback();
      console.error('Update product error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to update product.' });
    }
  }

  static async remove(req, res) {
    const guard = withRoleGuard(req.user?.role);
    if (!guard.allowCreateUpdateDelete) {
      return res.status(403).json({ success: false, message: 'Only super-admin can manage products.' });
    }

    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      await product.destroy();
      return res.json({ success: true, message: 'Product deleted.' });
    } catch (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
  }

  // Upload image to Cloudinary and return URL
  static async uploadImage(req, res) {
    const guard = withRoleGuard(req.user?.role);
    if (!guard.allowCreateUpdateDelete) {
      return res.status(403).json({ success: false, message: 'Only super-admin can manage products.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image file is required.' });
      }
      const result = await cloudinary.uploadBuffer(req.file.buffer, 'products');
      return res.status(201).json({
        success: true,
        message: 'Image uploaded.',
        data: { url: result.secure_url, publicId: result.public_id }
      });
    } catch (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({ success: false, message: 'Image upload failed.' });
    }
  }
}

module.exports = ProductController;
