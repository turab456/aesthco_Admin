const express = require('express');
const AuthController = require('../../controllers/Auth/authController');
const AuthMiddleware = require('../../middleware/AuthMiddleware');
const {
  loginLimiter,
  registerLimiter,
  otpLimiter
} = require('../../middleware/RateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a customer account (legacy endpoint)
 *     tags: [Auth]
 *     description: Prefer using /register/customer for clarity. This endpoint defaults to customer role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       201:
 *         description: Account created and OTP sent.
 */
router.post('/register', registerLimiter, AuthController.registerCustomer);

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     LoginWithRoleRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/LoginRequest'
 *         - type: object
 *           required:
 *             - role
 *           properties:
 *             role:
 *               type: string
 *               enum: [super-admin, partner, customer]
 *               description: Target portal role (required; must match assigned role)
 */

/**
 * @swagger
 * /api/v1/auth/register/customer:
 *   post:
 *     summary: Register a customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       201:
 *         description: Customer account created.
 */
router.post('/register/customer', registerLimiter, AuthController.registerCustomer);

/**
 * @swagger
 * /api/v1/auth/register/partner:
 *   post:
 *     summary: Register a partner/delivery account
 *     tags: [Auth]
 *     description: Creates an account limited to delivery operations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       201:
 *         description: Partner account created.
 */
router.post('/register/partner', registerLimiter, AuthController.registerPartner);

/**
 * @swagger
 * /api/v1/auth/register/super-admin:
 *   post:
 *     summary: Create a super admin account
 *     tags: [Auth]
 */
router.post('/register/super-admin', registerLimiter, AuthController.registerSuperAdmin);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received by email
 *     responses:
 *       200:
 *         description: Email verified.
 */
router.post('/verify-otp', otpLimiter, AuthController.verifyOTP);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with explicit role (legacy endpoint)
 *     tags: [Auth]
 *     description: Prefer using /login/customer, /login/partner, or /login/super-admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginWithRoleRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *       202:
 *         description: OTP resent because email not verified.
 */
router.post('/login', loginLimiter, AuthController.login);

/**
 * @swagger
 * /api/v1/auth/login/customer:
 *   post:
 *     summary: Customer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *       202:
 *         description: OTP resent because email not verified.
 */
router.post('/login/customer', loginLimiter, AuthController.loginCustomer);

/**
 * @swagger
 * /api/v1/auth/login/partner:
 *   post:
 *     summary: Partner portal login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *       202:
 *         description: OTP resent because email not verified.
 */
router.post('/login/partner', loginLimiter, AuthController.loginPartner);

/**
 * @swagger
 * /api/v1/auth/login/super-admin:
 *   post:
 *     summary: Super admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *       202:
 *         description: OTP resent because email not verified.
 */
router.post('/login/super-admin', loginLimiter, AuthController.loginSuperAdmin);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request OTP to reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if email exists.
 */
router.post('/forgot-password', otpLimiter, AuthController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 description: OTP received via forgot password request
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
router.post('/reset-password', otpLimiter, AuthController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Generate new access token from refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns new access token.
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Fetch profile for current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the authenticated user profile.
 */
router.get('/me', AuthMiddleware.authenticate, AuthController.getProfile);

module.exports = router;
