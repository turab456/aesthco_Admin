const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductVariant = sequelize.define('ProductVariant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    colorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sizeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    showInListing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'ProductVariants',
    schema: 'catalog',
    indexes: [
      // Keep a non-unique index for lookups without blocking multiple size/color combos
      { unique: false, fields: ['productId', 'colorId', 'sizeId'] }
    ]
  });

  ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });

    ProductVariant.belongsTo(models.Color, {
      foreignKey: 'colorId',
      as: 'color'
    });

    ProductVariant.belongsTo(models.Size, {
      foreignKey: 'sizeId',
      as: 'size'
    });
  };

  return ProductVariant;
};
