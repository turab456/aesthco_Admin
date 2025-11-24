const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ShippingSetting = sequelize.define(
    'ShippingSetting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      freeShippingThreshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1999,
      },
      shippingFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'ShippingSettings',
      timestamps: true,
    },
  )

  return ShippingSetting
}
