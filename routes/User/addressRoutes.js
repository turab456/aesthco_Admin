const express = require('express');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const AddressController = require('../../controllers/User/addressController');

const router = express.Router();

router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Manage customer delivery addresses (Bengaluru only)
 *
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "John Doe"
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         addressLine1:
 *           type: string
 *           example: "123 MG Road"
 *         addressLine2:
 *           type: string
 *           example: "Apartment 4B"
 *         city:
 *           type: string
 *           example: "Bengaluru"
 *         state:
 *           type: string
 *           example: "Karnataka"
 *         postalCode:
 *           type: string
 *           example: "560001"
 *         addressType:
 *           type: string
 *           enum: [home, work, other]
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AddressCreateRequest:
 *       type: object
 *       required:
 *         - addressLine1
 *       properties:
 *         name:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         addressLine1:
 *           type: string
 *         addressLine2:
 *           type: string
 *         city:
 *           type: string
 *           description: Must be Bengaluru/Bangalore only
 *           example: "Bengaluru"
 *         state:
 *           type: string
 *           description: Must be Karnataka only
 *           example: "Karnataka"
 *         postalCode:
 *           type: string
 *         addressType:
 *           type: string
 *           enum: [home, work, other]
 *         isDefault:
 *           type: boolean
 *     AddressUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/AddressCreateRequest'
 */

/**
 * @swagger
 * /api/v1/user/addresses:
 *   get:
 *     summary: List saved addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses ordered with default first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 */
router.get('/addresses', AddressController.list);

/**
 * @swagger
 * /api/v1/user/addresses:
 *   post:
 *     summary: Create a new address (Bengaluru only)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressCreateRequest'
 *     responses:
 *       201:
 *         description: Address created
 *       400:
 *         description: Validation error or non-Bengaluru city/state
 */
router.post('/addresses', AddressController.create);

/**
 * @swagger
 * /api/v1/user/addresses/{id}:
 *   put:
 *     summary: Update an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressUpdateRequest'
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 */
router.put('/addresses/:id', AddressController.update);

/**
 * @swagger
 * /api/v1/user/addresses/{id}/default:
 *   post:
 *     summary: Set an address as default
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Default address updated
 *       404:
 *         description: Address not found
 */
router.post('/addresses/:id/default', AddressController.setDefault);

/**
 * @swagger
 * /api/v1/user/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Address removed
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:id', AddressController.remove);

module.exports = router;
