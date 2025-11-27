module.exports = {
  async up(queryInterface) {
    // ✅ Safe add column (Postgres)
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      ADD COLUMN IF NOT EXISTS "showInListing" BOOLEAN DEFAULT TRUE;
    `);

    // ✅ Fix old rows if any NULL slipped in
    await queryInterface.sequelize.query(`
      UPDATE "catalog"."ProductVariants"
      SET "showInListing" = TRUE
      WHERE "showInListing" IS NULL;
    `);

    // ✅ Enforce NOT NULL (safe now)
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      ALTER COLUMN "showInListing" SET NOT NULL;
    `);
  },

  async down(queryInterface) {
    // Optional rollback — safe
    await queryInterface.sequelize.query(`
      ALTER TABLE "catalog"."ProductVariants"
      DROP COLUMN IF EXISTS "showInListing";
    `);
  }
};
