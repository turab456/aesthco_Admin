const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productSlug: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      colorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sizeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      colorName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sizeName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'OrderItems',
      timestamps: false,
    },
  )

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' })
    OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
    OrderItem.belongsTo(models.Color, { foreignKey: 'colorId', as: 'color' })
    OrderItem.belongsTo(models.Size, { foreignKey: 'sizeId', as: 'size' })
  }

  return OrderItem
}
