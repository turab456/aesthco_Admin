const JWTUtils = require('../utils/jwt');
const { User } = require('../models');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  }

  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    };
  }

  static async requireEmailVerification(req, res, next) {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required.'
      });
    }
    next();
  }
}

module.exports = AuthMiddleware;
