
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    token: {
      // CRITICAL CHANGE: Increased length to 512 to hold the full JWT.
      type: DataTypes.STRING(512), 
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deviceInfo: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  // This method accepts the token instead of creating one.
  RefreshToken.createToken = async function(token, userId, deviceInfo = null) {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    return this.create({
      token,
      userId,
      expiresAt,
      deviceInfo
    });
  };

  // Instance method to revoke token
  RefreshToken.prototype.revoke = async function() {
    return this.update({ isRevoked: true });
  };

  // Associations
  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return RefreshToken;
};
