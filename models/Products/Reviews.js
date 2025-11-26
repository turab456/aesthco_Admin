const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define(
    'Review',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'Reviews',
      indexes: [
        { unique: true, fields: ['userId', 'productId', 'orderId'] },
        { fields: ['productId', 'isApproved'] },
      ],
    },
  );

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    Review.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order', constraints: false });
  };

  return Review;
};

