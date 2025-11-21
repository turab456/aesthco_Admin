const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidName(value) {
            if (value === null || value === undefined || value === "") return;
            if (value.length < 2 || value.length > 50) {
              throw new Error("Full name must be between 2 and 50 characters");
            }
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [5, 255],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidPassword(value) {
            if (!value) return;
            if (value.length < 8 || value.length > 100) {
              throw new Error("Password must be between 8 and 100 characters");
            }
          },
        },
      },
      role: {
        type: DataTypes.ENUM("super-admin", "partner", "customer"),
        defaultValue: "customer",
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isValidPhone(value) {
            if (!value) return;
            if (value.length < 7 || value.length > 12) {
              throw new Error("Phone number must be between 7 and 20 characters");
            }
          },
        },
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeSave: async (user) => {
          if (user.changed("password") && user.password) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  // Instance methods
  User.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  };

  User.prototype.incrementLoginAttempts = async function () {
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes

    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.update({
        loginAttempts: 1,
        lockUntil: null,
      });
    }

    return this.update({
      loginAttempts: this.loginAttempts + 1,
      lockUntil:
        this.loginAttempts + 1 >= maxAttempts
          ? new Date(Date.now() + lockTime)
          : null,
    });
  };

  User.prototype.resetLoginAttempts = async function () {
    return this.update({
      loginAttempts: 0,
      lockUntil: null,
    });
  };

  // Define associations
  User.associate = (models) => {
    // Refresh tokens
    User.hasMany(models.RefreshToken, {
      foreignKey: "userId",
      as: "refreshTokens",
    });
  };

  User.ROLES = {
    SUPER_ADMIN: "super-admin",
    PARTNER: "partner",
    CUSTOMER: "customer",
  };

  return User;
};
