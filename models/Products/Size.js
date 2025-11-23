const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Size = sequelize.define('Size', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    }
  }, {
    tableName: 'Sizes',
    schema: 'masters',
    indexes: [
      { unique: true, fields: ['code'] },
      { unique: true, fields: ['sortOrder'] }
    ]
  });

  Size.associate = (models) => {
    Size.hasMany(models.ProductVariant, {
      foreignKey: 'sizeId',
      as: 'variants'
    });
  };

  return Size;
};
