module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS masters;');
    await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS catalog;');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS catalog CASCADE;');
    await queryInterface.sequelize.query('DROP SCHEMA IF EXISTS masters CASCADE;');
  },
};
