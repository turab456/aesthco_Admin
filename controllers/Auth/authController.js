const { User, EmailOTP, RefreshToken } = require('../../models');
const JWTUtils = require('../../utils/jwt');
const EmailService = require('../../utils/emailService');

const OTP_TYPES = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  LOGIN: 'login'
};

const ROLE = User.ROLES || {};
const ALLOWED_ROLES = Object.values(ROLE);
const DEFAULT_CUSTOMER_ROLE = ROLE.CUSTOMER || 'customer';
const PARTNER_ROLE = ROLE.PARTNER || 'partner';
const SUPER_ADMIN_ROLE = ROLE.SUPER_ADMIN || 'super-admin';

const ROLE_TOKEN_KEYS = {
  [DEFAULT_CUSTOMER_ROLE]: {
    accessKey: 'accessToken',
    refreshKey: 'refreshToken'
  },
  [PARTNER_ROLE]: {
    accessKey: 'partner_auth_token',
    refreshKey: 'partner_refresh_token'
  },
  [SUPER_ADMIN_ROLE]: {
    accessKey: 'admin_auth_token',
    refreshKey: 'admin_refresh_token'
  },
  default: {
    accessKey: 'accessToken',
    refreshKey: 'refreshToken'
  }
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeName = (name = '') => name.trim();
const getFirstName = (fullName = '') => normalizeName(fullName).split(' ')[0] || 'there';

const buildRoleTokenPayload = (role, { accessToken = null, refreshToken = null }) => {
  const mapping = ROLE_TOKEN_KEYS[role] || ROLE_TOKEN_KEYS.default;
  const payload = {};

  if (accessToken) {
    payload.accessToken = accessToken;
    if (mapping.accessKey && mapping.accessKey !== 'accessToken') {
      payload[mapping.accessKey] = accessToken;
    }
  }

  if (refreshToken) {
    payload.refreshToken = refreshToken;
    if (mapping.refreshKey && mapping.refreshKey !== 'refreshToken') {
      payload[mapping.refreshKey] = refreshToken;
    }
  }

  return payload;
};

const sendVerificationOTP = async (user) => {
  const otpRecord = await EmailOTP.createOTP(user.email, OTP_TYPES.EMAIL_VERIFICATION);
  await EmailService.sendVerificationEmail(
    user.email,
    otpRecord.otp,
    getFirstName(user.fullName)
  );
  return otpRecord;
};

const sendLoginOTP = async (user) => {
  const otpRecord = await EmailOTP.createOTP(user.email, OTP_TYPES.LOGIN);
  await EmailService.sendLoginOTP(
    user.email,
    otpRecord.otp,
    getFirstName(user.fullName || user.email)
  );
  return otpRecord;
};

const ensureCustomerAccount = async (email, fullName = '') => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(fullName);

  let user = await User.findOne({ where: { email: normalizedEmail } });
  let isNew = false;

  if (user && user.role !== DEFAULT_CUSTOMER_ROLE) {
    throw new Error('This email is registered with a non-customer role. Use password login instead.');
  }

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      fullName: normalizedName || null,
      password: null,
      role: DEFAULT_CUSTOMER_ROLE,
      isVerified: false
    });
    isNew = true;
  } else if (normalizedName && !user.fullName) {
    await user.update({ fullName: normalizedName });
  }

  if (!user.isActive) {
    throw new Error('Account is inactive.');
  }

  return { user, isNew };
};

const sendWelcomeIfNew = async (isNew, user) => {
  if (!isNew) return;
  try {
    await EmailService.sendWelcomeEmail(user.email, getFirstName(user.fullName));
  } catch (err) {
    console.error('Welcome email failed:', err?.message || err);
  }
};

class AuthController {
  static async register(req, res) {
    try {
      const { fullName, email, password, role } = req.body;

      const normalizedEmail = normalizeEmail(email);
      const normalizedName = normalizeName(fullName);
      const requestedRole = ALLOWED_ROLES.includes(role) ? role : DEFAULT_CUSTOMER_ROLE;

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.'
        });
      }

      if (requestedRole === DEFAULT_CUSTOMER_ROLE) {
        const { user, isNew } = await ensureCustomerAccount(normalizedEmail, normalizedName);
        await sendLoginOTP(user);
        await sendWelcomeIfNew(isNew, user);

        return res.status(isNew ? 201 : 200).json({
          success: true,
          message: 'OTP sent to your email. Please verify to continue.',
          data: {
            userId: user.id,
            email: user.email,
            role: user.role,
            isNewUser: isNew
          }
        });
      }

      if (!fullName || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name and password are required for this role.'
        });
      }

      if (requestedRole === SUPER_ADMIN_ROLE) {
        return res.status(403).json({
          success: false,
          message: 'Super admin accounts must be created via the dedicated endpoint.'
        });
      }

      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        if (!existingUser.isVerified) {
          await sendVerificationOTP(existingUser);
          return res.status(202).json({
            success: true,
            message: 'Account already exists but is not verified. A new verification OTP has been sent.',
            data: {
              userId: existingUser.id,
              email: existingUser.email,
              role: existingUser.role
            }
          });
        }

        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const user = await User.create({
        fullName: normalizedName,
        email: normalizedEmail,
        password,
        role: requestedRole
      });

      await sendVerificationOTP(user);

      return res.status(201).json({
        success: true,
        message: 'Account created. A verification OTP has been emailed to you.',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to register user.'
      });
    }
  }

  static async registerCustomer(req, res) {
    req.body.role = ROLE.CUSTOMER || DEFAULT_CUSTOMER_ROLE;
    return AuthController.register(req, res);
  }

  static async registerPartner(req, res) {
    req.body.role = PARTNER_ROLE;
    return AuthController.register(req, res);
  }

  static async registerSuperAdmin(req, res) {
    try {
      const { fullName, email, password } = req.body;
      const adminSecret = req.body.adminSecret || req.headers['x-admin-secret'];

      if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({
          success: false,
          message: 'Invalid super admin registration secret.'
        });
      }

      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, and password are required.'
        });
      }

      const normalizedEmail = normalizeEmail(email);
      const normalizedName = normalizeName(fullName);

      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const user = await User.create({
        fullName: normalizedName,
        email: normalizedEmail,
        password,
        role: SUPER_ADMIN_ROLE,
        isVerified: true
      });

      return res.status(201).json({
        success: true,
        message: 'Super admin account created.',
        data: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Super admin registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create super admin account.'
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      const otpRecord = await EmailOTP.findOne({
        where: {
          email: normalizeEmail(email),
          type: OTP_TYPES.EMAIL_VERIFICATION,
          isUsed: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No valid OTP found for this email.'
        });
      }

      await otpRecord.verify(otp);

      await User.update(
        { isVerified: true },
        { where: { email: normalizeEmail(email) } }
      );

      return res.json({
        success: true,
        message: 'Email verified successfully.'
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed.'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password, role: roleContext } = req.body;

      if (!roleContext || !ALLOWED_ROLES.includes(roleContext)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role context is required to login.'
        });
      }

      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.'
        });
      }

      if (roleContext === DEFAULT_CUSTOMER_ROLE) {
        try {
          const { user, isNew } = await ensureCustomerAccount(normalizedEmail);
          await sendLoginOTP(user);
          await sendWelcomeIfNew(isNew, user);

          return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to continue.',
            data: {
              email: user.email,
              isNewUser: isNew
            }
          });
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Unable to start OTP login.'
          });
        }
      }

      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive.'
        });
      }

      if (roleContext !== user.role) {
        return res.status(403).json({
          success: false,
          message: `Access denied for ${roleContext} portal.`
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required for this role.'
        });
      }

      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked due to too many failed attempts.'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      if (!user.isVerified) {
        await sendVerificationOTP(user);
        return res.status(202).json({
          success: true,
          message: 'Verification OTP sent to your email address.',
          data: { email: user.email }
        });
      }

      await user.resetLoginAttempts();
      await user.update({ lastLogin: new Date() });

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(user);
      await RefreshToken.createToken(
        refreshToken,
        user.id,
        req.get('User-Agent') || 'Unknown Device'
      );

      const tokenPayload = buildRoleTokenPayload(user.role, { accessToken, refreshToken });

      return res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
          },
          ...tokenPayload
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }

  static async loginCustomer(req, res) {
    req.body.role = ROLE.CUSTOMER || DEFAULT_CUSTOMER_ROLE;
    return AuthController.login(req, res);
  }

  static async loginPartner(req, res) {
    req.body.role = PARTNER_ROLE;
    return AuthController.login(req, res);
  }

  static async loginSuperAdmin(req, res) {
    req.body.role = SUPER_ADMIN_ROLE;
    return AuthController.login(req, res);
  }

  static async sendCustomerOTP(req, res) {
    try {
      const { email, fullName } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.'
        });
      }

      const { user, isNew } = await ensureCustomerAccount(email, fullName);
      await sendLoginOTP(user);
      await sendWelcomeIfNew(isNew, user);

      return res.json({
        success: true,
        message: 'OTP sent to your email. Please verify to continue.',
        data: {
          email: user.email,
          isNewUser: isNew
        }
      });
    } catch (error) {
      console.error('Send customer OTP error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP.'
      });
    }
  }

  static async verifyCustomerOTP(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required.'
        });
      }

      const normalizedEmail = normalizeEmail(email);
      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user || user.role !== DEFAULT_CUSTOMER_ROLE) {
        return res.status(404).json({
          success: false,
          message: 'Customer account not found. Please use password login for other roles.'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive.'
        });
      }

      const otpRecord = await EmailOTP.findOne({
        where: {
          email: normalizedEmail,
          type: OTP_TYPES.LOGIN,
          isUsed: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No valid OTP found for this email.'
        });
      }

      await otpRecord.verify(otp);
      await user.resetLoginAttempts?.();
      await user.update({ isVerified: true, lastLogin: new Date() });

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(user);
      await RefreshToken.createToken(
        refreshToken,
        user.id,
        req.get('User-Agent') || 'Unknown Device'
      );

      const tokenPayload = buildRoleTokenPayload(user.role, { accessToken, refreshToken });

      return res.json({
        success: true,
        message: 'OTP verified successfully.',
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified
          },
          ...tokenPayload,
          requiresProfile: !user.fullName
        }
      });
    } catch (error) {
      console.error('Verify customer OTP error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed.'
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const normalizedEmail = normalizeEmail(email);

      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (user) {
        const otpRecord = await EmailOTP.createOTP(normalizedEmail, OTP_TYPES.PASSWORD_RESET);
        await EmailService.sendPasswordResetEmail(
          normalizedEmail,
          otpRecord.otp,
          getFirstName(user.fullName)
        );
      }

      return res.json({
        success: true,
        message: 'If the email exists, you will receive a password reset OTP.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      const normalizedEmail = normalizeEmail(email);

      const otpRecord = await EmailOTP.findOne({
        where: {
          email: normalizedEmail,
          type: OTP_TYPES.PASSWORD_RESET,
          isUsed: false
        },
        order: [['createdAt', 'DESC']]
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No valid OTP found for password reset.'
        });
      }

      await otpRecord.verify(otp);

      const user = await User.findOne({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from the current password.'
        });
      }

      user.password = newPassword;
      await user.save();

      await RefreshToken.update(
        { isRevoked: true },
        { where: { userId: user.id } }
      );

      return res.json({
        success: true,
        message: 'Password reset successfully.'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed.'
      });
    }
  }

  static async completeCustomerProfile(req, res) {
    try {
      const { fullName, phoneNumber } = req.body;
      const user = req.user;

      if (user.role !== DEFAULT_CUSTOMER_ROLE) {
        return res.status(403).json({
          success: false,
          message: 'Only customers can update this profile.'
        });
      }

      const normalizedName = normalizeName(fullName);
      if (!normalizedName || normalizedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }

      const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : null;

      await user.update({
        fullName: normalizedName,
        phoneNumber: normalizedPhone || null
      });

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile.'
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required.'
        });
      }

      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      const tokenRecord = await RefreshToken.findOne({
        where: {
          token: refreshToken,
          userId: decoded.id,
          isRevoked: false
        }
      });

      if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
        if (tokenRecord) {
          await tokenRecord.destroy();
        }
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token.'
        });
      }

      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive.'
        });
      }

      const newAccessToken = JWTUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      const tokenPayload = buildRoleTokenPayload(user.role, { accessToken: newAccessToken });

      return res.json({
        success: true,
        data: {
          ...tokenPayload
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await RefreshToken.destroy({
          where: { token: refreshToken }
        });
      }

      res.clearCookie?.('refreshToken');
      res.removeHeader('Authorization');

      return res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during logout.'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;
      return res.json({
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }
}

module.exports = AuthController;
