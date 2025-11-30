module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
    ALTER TABLE "masters"."Sizes"
    ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;
  `);

    await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Sizes_sortOrder_idx"
    ON "masters"."Sizes" ("sortOrder")
    WHERE "sortOrder" IS NOT NULL;
  `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "masters"."Sizes_sortOrder_idx";');
    await queryInterface.removeColumn({ tableName: 'Sizes', schema: 'masters' }, 'sortOrder');
  },
};
