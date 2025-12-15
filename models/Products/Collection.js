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
    },
    showOnHome: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    homeOrder: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Collections',
    schema: 'masters',
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
