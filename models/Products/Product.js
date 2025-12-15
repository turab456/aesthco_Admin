const { DataTypes } = require('sequelize');

const GENDERS = ['MEN', 'WOMEN', 'UNISEX'];

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM(...GENDERS),
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    collectionId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    performanceAndDurability: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fitAndDesign: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    seasonalComfort: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quickAnswers: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    }
  }, {
    tableName: 'Products',
    schema: 'catalog',
    underscored: false
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    Product.belongsTo(models.Collection, {
      foreignKey: 'collectionId',
      as: 'collection'
    });

    Product.hasMany(models.ProductVariant, {
      foreignKey: 'productId',
      as: 'variants'
    });

    Product.hasMany(models.ProductImage, {
      foreignKey: 'productId',
      as: 'images'
    });

    Product.hasMany(models.Review, {
      foreignKey: 'productId',
      as: 'reviews'
    });
  };

  Product.GENDERS = GENDERS;

  return Product;
};
