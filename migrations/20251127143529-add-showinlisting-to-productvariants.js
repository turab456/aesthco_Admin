module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      ADD COLUMN IF NOT EXISTS "showInListing" BOOLEAN DEFAULT TRUE;
    `);

    await queryInterface.sequelize.query(`
      UPDATE "catalog"."ProductVariants"
      SET "showInListing" = TRUE
      WHERE "showInListing" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      ALTER COLUMN "showInListing" SET NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      DROP COLUMN IF EXISTS "showInListing";
    `);
  },
};
