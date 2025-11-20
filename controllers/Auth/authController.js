const { User, EmailOTP, RefreshToken } = require('../../models');
const JWTUtils = require('../../utils/jwt');
const EmailService = require('../../utils/emailService');

const OTP_TYPES = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset'
};

const ROLE = User.ROLES || {};
const ALLOWED_ROLES = Object.values(ROLE);
const DEFAULT_CUSTOMER_ROLE = ROLE.CUSTOMER || 'customer';
const PARTNER_ROLE = ROLE.PARTNER || 'partner';
const SUPER_ADMIN_ROLE = ROLE.SUPER_ADMIN || 'super-admin';

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeName = (name = '') => name.trim();
const getFirstName = (fullName = '') => normalizeName(fullName).split(' ')[0] || 'there';

const sendVerificationOTP = async (user) => {
  const otpRecord = await EmailOTP.createOTP(user.email, OTP_TYPES.EMAIL_VERIFICATION);
  await EmailService.sendVerificationEmail(
    user.email,
    otpRecord.otp,
    getFirstName(user.fullName)
  );
  return otpRecord;
};

class AuthController {
  static async register(req, res) {
    try {
      const { fullName, email, password, role } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, and password are required.'
        });
      }

      const normalizedEmail = normalizeEmail(email);
      const normalizedName = normalizeName(fullName);
      const requestedRole = ALLOWED_ROLES.includes(role) ? role : DEFAULT_CUSTOMER_ROLE;

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
      return res.status(500).json({
        success: false,
        message: 'Failed to register user.'
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
          accessToken,
          refreshToken
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

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken
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
