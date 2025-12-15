module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure UUID generation is available
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryInterface.createTable('EmailOTPs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('email_verification', 'password_reset', 'login'),
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // helpful index for lookups
    await queryInterface.addIndex('EmailOTPs', ['email', 'type'], {
      name: 'EmailOTPs_email_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('EmailOTPs', 'EmailOTPs_email_type_idx');
    await queryInterface.dropTable('EmailOTPs');
  },
};
