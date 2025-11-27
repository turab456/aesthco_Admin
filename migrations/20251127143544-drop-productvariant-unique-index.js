module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "catalog"."ProductVariants_productId_colorId_sizeId";
      DROP INDEX IF EXISTS "catalog"."ProductVariants_productId_colorId_sizeId_key";
    `);
  },

  async down() {
    /* no rollback needed */
  }
};
