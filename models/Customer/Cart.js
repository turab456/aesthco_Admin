const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    'Cart',
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      colorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sizeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'CartItems',
    }
  );

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Cart.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    Cart.belongsTo(models.Color, { foreignKey: 'colorId', as: 'color' });
    Cart.belongsTo(models.Size, { foreignKey: 'sizeId', as: 'size' });
  };

  return Cart;
};
