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
    }
  }, {
    tableName: 'Sizes',
    indexes: [
      { unique: true, fields: ['code'] }
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
