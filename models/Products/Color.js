const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Color = sequelize.define('Color', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hexCode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Colors',
    indexes: [
      { unique: true, fields: ['name'] }
    ]
  });

  Color.associate = (models) => {
    Color.hasMany(models.ProductVariant, {
      foreignKey: 'colorId',
      as: 'variants'
    });
  };

  return Color;
};
