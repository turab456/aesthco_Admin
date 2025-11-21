// models/EmailOTP.js
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const EmailOTP = sequelize.define('EmailOTP', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('email_verification', 'password_reset', 'login'),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true
  });

  // Static method to generate OTP
  EmailOTP.generateOTP = function() {
    return crypto.randomInt(100000, 999999).toString();
  };

  // Static method to create OTP
  EmailOTP.createOTP = async function(email, type, expiryMinutes = 10) {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate previous OTPs of same type for this email
    await this.update(
      { isUsed: true },
      { 
        where: { 
          email, 
          type, 
          isUsed: false 
        } 
      }
    );

    return this.create({
      email,
      otp,
      type,
      expiresAt
    });
  };

  // Instance method to verify OTP
  EmailOTP.prototype.verify = async function(inputOTP) {
    if (this.isUsed) {
      throw new Error('OTP has already been used');
    }

    if (new Date() > this.expiresAt) {
      throw new Error('OTP has expired');
    }

    if (this.attempts >= 3) {
      throw new Error('Too many failed attempts');
    }

    if (this.otp !== inputOTP) {
      await this.update({ attempts: this.attempts + 1 });
      throw new Error('Invalid OTP');
    }

    await this.update({ isUsed: true });
    return true;
  };

  return EmailOTP;
};
