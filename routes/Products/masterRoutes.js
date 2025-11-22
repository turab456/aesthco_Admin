const express = require('express');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const MasterController = require('../../controllers/Products/masterController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Masters
 *   description: Master data for categories, collections, colors, and sizes
 *
 * components:
 *   schemas:
 *     CategoryMaster:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *     CollectionMaster:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *     ColorMaster:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         code: { type: string }
 *         hexCode: { type: string }
 *     SizeMaster:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         code: { type: string }
 *         label: { type: string }
 */

// Public: list masters (read)
/**
 * @swagger
 * /api/v1/masters/categories:
 *   get:
 *     summary: List categories
 *     tags: [Masters]
 *     responses:
 *       200:
 *         description: Category list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CategoryMaster' }
 */
router.get('/categories', MasterController.listCategories);
/**
 * @swagger
 * /api/v1/masters/collections:
 *   get:
 *     summary: List collections
 *     tags: [Masters]
 *     responses:
 *       200:
 *         description: Collection list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CollectionMaster' }
 */
router.get('/collections', MasterController.listCollections);
/**
 * @swagger
 * /api/v1/masters/colors:
 *   get:
 *     summary: List colors
 *     tags: [Masters]
 *     responses:
 *       200:
 *         description: Color list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ColorMaster' }
 */
router.get('/colors', MasterController.listColors);
/**
 * @swagger
 * /api/v1/masters/sizes:
 *   get:
 *     summary: List sizes
 *     tags: [Masters]
 *     responses:
 *       200:
 *         description: Size list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SizeMaster' }
 */
router.get('/sizes', MasterController.listSizes);

// Protected: mutate masters (super-admin only enforced in controller)
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/v1/masters/categories:
 *   post:
 *     summary: Create category (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryMaster' }
 *     responses:
 *       201: { description: Created }
 * /api/v1/masters/categories/{id}:
 *   put:
 *     summary: Update category (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryMaster' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete category (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.post('/categories', MasterController.createCategory);
router.put('/categories/:id', MasterController.updateCategory);
router.delete('/categories/:id', MasterController.deleteCategory);

/**
 * @swagger
 * /api/v1/masters/collections:
 *   post:
 *     summary: Create collection (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CollectionMaster' }
 *     responses:
 *       201: { description: Created }
 * /api/v1/masters/collections/{id}:
 *   put:
 *     summary: Update collection (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CollectionMaster' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete collection (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.post('/collections', MasterController.createCollection);
router.put('/collections/:id', MasterController.updateCollection);
router.delete('/collections/:id', MasterController.deleteCollection);

/**
 * @swagger
 * /api/v1/masters/colors:
 *   post:
 *     summary: Create color (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ColorMaster' }
 *     responses:
 *       201: { description: Created }
 * /api/v1/masters/colors/{id}:
 *   put:
 *     summary: Update color (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ColorMaster' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete color (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.post('/colors', MasterController.createColor);
router.put('/colors/:id', MasterController.updateColor);
router.delete('/colors/:id', MasterController.deleteColor);

/**
 * @swagger
 * /api/v1/masters/sizes:
 *   post:
 *     summary: Create size (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SizeMaster' }
 *     responses:
 *       201: { description: Created }
 * /api/v1/masters/sizes/{id}:
 *   put:
 *     summary: Update size (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SizeMaster' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete size (super-admin only)
 *     tags: [Masters]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.post('/sizes', MasterController.createSize);
router.put('/sizes/:id', MasterController.updateSize);
router.delete('/sizes/:id', MasterController.deleteSize);

module.exports = router;
