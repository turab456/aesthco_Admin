const express = require('express');
const multer = require('multer');
const ProductController = require('../../controllers/Products/productController');
const AuthMiddleware = require('../../middleware/AuthMiddleware');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog APIs
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *     Collection:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *     Color:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         code: { type: string }
 *         hexCode: { type: string }
 *     Size:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         code: { type: string }
 *         label: { type: string }
 *     ProductVariantInput:
 *       type: object
 *       required: [colorId, sizeId, sku, stockQuantity, basePrice]
 *       properties:
 *         colorId: { type: integer }
 *         sizeId: { type: integer }
 *         sku: { type: string }
 *         stockQuantity: { type: integer }
 *         basePrice: { type: number }
 *         salePrice: { type: number }
 *         isAvailable: { type: boolean }
 *         showInListing: { type: boolean }
 *     ProductImageInput:
 *       type: object
 *       required: [imageUrl]
 *       properties:
 *         imageUrl: { type: string }
 *         isPrimary: { type: boolean }
 *         sortOrder: { type: integer }
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *         shortDescription: { type: string }
 *         description: { type: string }
 *         gender: { type: string, enum: [MEN, WOMEN, UNISEX] }
 *         isActive: { type: boolean }
 *         category: { $ref: '#/components/schemas/Category' }
 *         collection: { $ref: '#/components/schemas/Collection' }
 *         images:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductImageInput' }
 *         variants:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductVariantInput'
 *               - type: object
 *                 properties:
 *                   id: { type: integer }
 *                   color: { $ref: '#/components/schemas/Color' }
 *                   size: { $ref: '#/components/schemas/Size' }
 *                   showInListing: { type: boolean }
 *     ProductCreateRequest:
 *       type: object
 *       required: [name, slug, shortDescription, description, gender, categoryId]
 *       properties:
 *         name: { type: string }
 *         slug: { type: string }
 *         shortDescription: { type: string }
 *         description: { type: string }
 *         gender: { type: string, enum: [MEN, WOMEN, UNISEX] }
 *         categoryId: { type: integer }
 *         collectionId: { type: integer }
 *         isActive: { type: boolean }
 *         variants:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductVariantInput' }
 *         images:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductImageInput' }
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductResponse' }
 */
router.get('/', ProductController.list);

/**
 * @swagger
 * /api/v1/products/{idOrSlug}:
 *   get:
 *     summary: Get product by id or slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *       404:
 *         description: Not found
 */
router.get('/:idOrSlug', ProductController.get);

router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create product (super-admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', ProductController.create);
/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product (super-admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateRequest'
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', ProductController.update);
/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product (super-admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', ProductController.remove);
/**
 * @swagger
 * /api/v1/products/upload/image:
 *   post:
 *     summary: Upload product image to Cloudinary (super-admin only)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded
 */
router.post('/upload/image', upload.single('image'), ProductController.uploadImage);

module.exports = router;
