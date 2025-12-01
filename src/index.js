require('dotenv').config();
const app = require('../app');
const { sequelize } = require('../models');

const PORT = process.env.PORT || 4000;
const SHUTDOWN_DELAY_MS = 500;
const SYNC_ON_BOOT = process.env.SYNC_ON_BOOT !== 'true';

async function ensureSchemasAndIndexes() {
  // Ensure schemas exist (idempotent)
  await sequelize.createSchema('masters', { logging: false }).catch(() => {});
  await sequelize.createSchema('catalog', { logging: false }).catch(() => {});

  // Ensure uuid generator exists for OTPs
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  // Sync all models to the DB (create/alter tables)
  await sequelize.sync({ alter: true });

  // Ensure size sort order column and unique index (masters.Sizes)
  await sequelize.query(
    'ALTER TABLE "masters"."Sizes" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;'
  );
  await sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Sizes_sortOrder_idx" ON "masters"."Sizes" ("sortOrder") WHERE "sortOrder" IS NOT NULL;'
  );

  // Ensure ProductVariants.showInListing exists
  await sequelize.query(
    'ALTER TABLE "catalog"."ProductVariants" ADD COLUMN IF NOT EXISTS "showInListing" BOOLEAN NOT NULL DEFAULT TRUE;'
  );
  await sequelize.query(
    'UPDATE "catalog"."ProductVariants" SET "showInListing" = TRUE WHERE "showInListing" IS NULL;'
  );

  // Drop legacy unique indexes on ProductVariants (productId, colorId, sizeId)
  await sequelize.query(`
    DO $$
    DECLARE
      idx TEXT;
    BEGIN
      FOR idx IN
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'catalog'
          AND tablename = 'ProductVariants'
          AND indexname IN (
            'ProductVariants_productId_colorId_sizeId',
            'ProductVariants_productId_colorId_sizeId_key'
          )
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS "catalog"."%I";', idx);
      END LOOP;

      FOR idx IN
        SELECT i.relname
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'catalog'
          AND t.relname = 'ProductVariants'
          AND ix.indisunique = TRUE
          AND EXISTS (
            SELECT 1 FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
            WHERE a.attname IN ('productId','colorId','sizeId')
          )
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS "catalog"."%I";', idx);
      END LOOP;
    END $$;
  `);
}

async function startServer() {
  try {
    await sequelize.authenticate();

    if (SYNC_ON_BOOT) {
      try {
        await ensureSchemasAndIndexes();
        console.log('Database schemas synced successfully.');
      } catch (syncErr) {
        console.error('Failed to sync DB on boot:', syncErr);
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Aesthco Auth API listening on http://localhost:${PORT}`);
    });

    const gracefulShutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        sequelize.close().finally(() => process.exit(0));
      });

      setTimeout(() => process.exit(1), SHUTDOWN_DELAY_MS).unref();
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
