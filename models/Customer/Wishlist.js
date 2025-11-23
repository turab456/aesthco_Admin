const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wishlist = sequelize.define(
    'Wishlist',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'Wishlists',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'productId'],
        },
      ],
    }
  );

  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Wishlist.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return Wishlist;
};
