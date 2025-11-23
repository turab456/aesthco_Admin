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
    showInListing: typeof v.showInListing === 'boolean' ? v.showInListing : true,
    color: v.color ? { id: v.color.id, name: v.color.name, code: v.color.code, hexCode: v.color.hexCode } : null,
    size: v.size ? { id: v.size.id, code: v.size.code, label: v.size.label, sortOrder: v.size.sortOrder } : null
  })) || []
});

const shouldShowVariantInListing = (variant) => {
  if (typeof variant.showInListing === 'boolean') {
    return variant.showInListing;
  }
  const qty = variant.stockQuantity ?? 0;
  return Boolean(variant.isAvailable) && qty > 0;
};

const selectVariantImages = (product, variant) => {
  const allImages = Array.isArray(product.images) ? product.images : [];
  const colorImages = variant.colorId
    ? allImages.filter((img) => img.colorId === variant.colorId)
    : [];

  const primary =
    colorImages.find((img) => img.isPrimary) ||
    colorImages[0] ||
    allImages.find((img) => img.isPrimary) ||
    allImages[0] ||
    null;

  const hover =
    colorImages.length > 1
      ? colorImages[1]
      : allImages.find((img) => img.id !== primary?.id) || primary || null;

  return {
    primaryUrl: primary?.imageUrl || null,
    hoverUrl: hover?.imageUrl || null
  };
};

const serializeVariantCard = (product, variant) => {
  const { primaryUrl, hoverUrl } = selectVariantImages(product, variant);
  const basePrice = Number(variant.basePrice);
  const salePrice = variant.salePrice ? Number(variant.salePrice) : null;

  return {
    cardId: `${product.id}-${variant.id}`,
    productId: product.id,
    productSlug: product.slug,
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
    variantId: variant.id,
    name: product.name,
    color: variant.color
      ? { id: variant.color.id, name: variant.color.name, code: variant.color.code, hexCode: variant.color.hexCode }
      : null,
    size: variant.size
      ? { id: variant.size.id, code: variant.size.code, label: variant.size.label }
      : null,
    basePrice,
    salePrice,
    imageUrl: primaryUrl,
    hoverImageUrl: hoverUrl,
    isAvailable: variant.isAvailable,
    productIsActive: product.isActive,
    showInListing: typeof variant.showInListing === 'boolean' ? variant.showInListing : true
  };
};

class ProductController {
  static async list(req, res) {
    try {
      const { categoryId, collectionId, colorId, sizeId, minPrice, maxPrice, sort, listByVariant, view } = req.query;
      const listVariants = listByVariant === 'true' || listByVariant === '1' || view === 'variant';

      const normalizeIds = (input) => {
        if (input === undefined || input === null) return [];
        if (Array.isArray(input)) return input.filter(Boolean).map((v) => Number(v));
        return String(input)
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => Number(v));
      };

      const colorIds = normalizeIds(colorId);
      const sizeIds = normalizeIds(sizeId);

      const where = {};
      if (categoryId) where.categoryId = categoryId;
      if (collectionId) where.collectionId = collectionId;

      const variantWhere = {};
      if (colorIds.length === 1) variantWhere.colorId = colorIds[0];
      else if (colorIds.length > 1) variantWhere.colorId = { [Op.in]: colorIds };
      if (sizeIds.length === 1) variantWhere.sizeId = sizeIds[0];
      else if (sizeIds.length > 1) variantWhere.sizeId = { [Op.in]: sizeIds };
      if (minPrice || maxPrice) {
        variantWhere.basePrice = {};
        if (minPrice) variantWhere.basePrice[Op.gte] = Number(minPrice);
        if (maxPrice) variantWhere.basePrice[Op.lte] = Number(maxPrice);
      }
      if (listVariants) {
        variantWhere.stockQuantity = { ...(variantWhere.stockQuantity || {}), [Op.gt]: 0 };
        variantWhere.isAvailable = true;
      }

      const order = [];
      if (sort === 'price_asc') order.push([{ model: ProductVariant, as: 'variants' }, 'basePrice', 'ASC']);
      else if (sort === 'price_desc') order.push([{ model: ProductVariant, as: 'variants' }, 'basePrice', 'DESC']);
      else order.push(['createdAt', 'DESC']);

      const products = await Product.findAll({
        where,
        include: [
          { model: Category, as: 'category' },
          { model: Collection, as: 'collection' },
          { model: ProductImage, as: 'images', separate: true, order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']], include: [{ model: Color, as: 'color' }] },
          {
            model: ProductVariant,
            as: 'variants',
            where: Object.keys(variantWhere).length ? variantWhere : undefined,
            required: listVariants || !!(colorIds.length || sizeIds.length || minPrice || maxPrice),
            include: [
              { model: Color, as: 'color' },
              { model: Size, as: 'size' }
            ]
          }
        ],
        order
      });

      if (listVariants) {
        const variantCards = [];
        for (const product of products) {
          if (!product.isActive) continue;
          const variants = Array.isArray(product.variants) ? product.variants : [];
          for (const variant of variants) {
            if (!shouldShowVariantInListing(variant)) continue;
            variantCards.push(serializeVariantCard(product, variant));
          }
        }
        return res.json({
          success: true,
          data: variantCards
        });
      }

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
      const orConditions = [{ slug: idOrSlug }];
      if (/^\d+$/.test(idOrSlug)) {
        orConditions.push({ id: Number(idOrSlug) });
      }
      const product = await Product.findOne({
        where: {
          [Op.or]: orConditions
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
            showInListing: variant.showInListing ?? true,
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
                showInListing: variant.showInListing ?? true,
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
                showInListing: variant.showInListing ?? true,
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
