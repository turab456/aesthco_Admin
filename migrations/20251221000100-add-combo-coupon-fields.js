'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_Coupons_type" ADD VALUE IF NOT EXISTS \'NORMAL\';',
    );
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_Coupons_type" ADD VALUE IF NOT EXISTS \'COMBO\';',
    );

    await queryInterface.addColumn('Coupons', 'comboRequiredQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Coupons', 'comboAllowedQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Coupons', 'comboAllowedQuantity');
    await queryInterface.removeColumn('Coupons', 'comboRequiredQuantity');
  },
};
