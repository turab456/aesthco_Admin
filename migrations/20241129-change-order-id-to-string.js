'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('OrderItems', 'OrderItems_orderId_fkey');
    } catch (e) {
      console.log('OrderItems constraint not found');
    }

    try {
      await queryInterface.removeConstraint('Reviews', 'Reviews_orderId_fkey');
    } catch (e) {
      console.log('Reviews constraint not found');
    }

    try {
      await queryInterface.removeConstraint('CouponRedemptions', 'CouponRedemptions_orderId_fkey');
    } catch (e) {
      console.log('CouponRedemptions constraint not found');
    }

    await queryInterface.changeColumn('Orders', 'id', {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    });

    await queryInterface.changeColumn('OrderItems', 'orderId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Reviews', 'orderId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('CouponRedemptions', 'orderId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addConstraint('OrderItems', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'OrderItems_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Reviews', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'Reviews_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('CouponRedemptions', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'CouponRedemptions_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('OrderItems', 'OrderItems_orderId_fkey');
    await queryInterface.removeConstraint('Reviews', 'Reviews_orderId_fkey');
    await queryInterface.removeConstraint('CouponRedemptions', 'CouponRedemptions_orderId_fkey');

    await queryInterface.changeColumn('Orders', 'id', {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    });

    await queryInterface.changeColumn('OrderItems', 'orderId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.changeColumn('Reviews', 'orderId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.changeColumn('CouponRedemptions', 'orderId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.addConstraint('OrderItems', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'OrderItems_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Reviews', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'Reviews_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('CouponRedemptions', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'CouponRedemptions_orderId_fkey',
      references: {
        table: 'Orders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
