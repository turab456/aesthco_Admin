const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Collection = sequelize.define('Collection', {
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
    }
  }, {
    tableName: 'Collections',
    indexes: [
      { unique: true, fields: ['slug'] }
    ]
  });

  Collection.associate = (models) => {
    Collection.hasMany(models.Product, {
      foreignKey: 'collectionId',
      as: 'products'
    });
  };

  return Collection;
};
