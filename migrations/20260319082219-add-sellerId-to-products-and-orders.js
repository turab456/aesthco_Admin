'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add sellerId to Products table (in catalog schema)
    await queryInterface.addColumn(
      { tableName: 'Products', schema: 'catalog' },
      'sellerId',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: { tableName: 'Sellers', schema: 'public' },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );

    // 2. Add sellerId to Orders table (in public schema)
    await queryInterface.addColumn(
      'Orders',
      'sellerId',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: { tableName: 'Sellers', schema: 'public' },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // 1. Remove sellerId from Products table
    await queryInterface.removeColumn(
      { tableName: 'Products', schema: 'catalog' },
      'sellerId'
    );

    // 2. Remove sellerId from Orders table
    await queryInterface.removeColumn(
      'Orders',
      'sellerId'
    );
  }
};
