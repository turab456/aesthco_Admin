// require('dotenv').config();
// const app = require('../app');
// const { sequelize } = require('../models');

// const PORT = process.env.PORT || 4000;
// const SHUTDOWN_DELAY_MS = 500;

// async function startServer() {
//   try {
//     await sequelize.authenticate();
//     // Ensure custom schemas for product masters and catalog
//     await sequelize.createSchema('masters', { logging: false }).catch(() => {});
//     await sequelize.createSchema('catalog', { logging: false }).catch(() => {});
//     await sequelize.sync({ alter: true });

//     // Ensure size sort order column and unique index (masters.Sizes)
//     try {
//       await sequelize.query(
//         'ALTER TABLE "masters"."Sizes" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;'
//       );
//       await sequelize.query(
//         'CREATE UNIQUE INDEX IF NOT EXISTS "Sizes_sortOrder_idx" ON "masters"."Sizes" ("sortOrder") WHERE "sortOrder" IS NOT NULL;'
//       );
//     } catch (sizeIndexError) {
//       console.error('Failed to ensure sortOrder on Sizes:', sizeIndexError);
//     }

//     // Ensure new variant flag exists (idempotent)
//     try {
//       await sequelize.query(
//         'ALTER TABLE "catalog"."ProductVariants" ADD COLUMN IF NOT EXISTS "showInListing" BOOLEAN NOT NULL DEFAULT TRUE;'
//       );
//       await sequelize.query(
//         'UPDATE "catalog"."ProductVariants" SET "showInListing" = TRUE WHERE "showInListing" IS NULL;'
//       );
//     } catch (migrationError) {
//       console.error('Failed to ensure showInListing column on ProductVariants:', migrationError);
//     }

//     // Drop legacy unique index on (productId, colorId, sizeId) to allow duplicate combinations
//     try {
//       await sequelize.query(`
//         DO $$
//         DECLARE
//           idx TEXT;
//         BEGIN
//           -- Drop known index names if they exist
//           FOR idx IN
//             SELECT indexname
//             FROM pg_indexes
//             WHERE schemaname = 'catalog'
//               AND tablename = 'ProductVariants'
//               AND indexname IN (
//                 'ProductVariants_productId_colorId_sizeId',
//                 'ProductVariants_productId_colorId_sizeId_key'
//               )
//           LOOP
//             EXECUTE format('DROP INDEX IF EXISTS "catalog"."%I";', idx);
//           END LOOP;

//           -- Drop any other unique index on these three columns
//           FOR idx IN
//             SELECT i.relname
//             FROM pg_class t
//             JOIN pg_index ix ON t.oid = ix.indrelid
//             JOIN pg_class i ON i.oid = ix.indexrelid
//             JOIN pg_namespace n ON n.oid = t.relnamespace
//             WHERE n.nspname = 'catalog'
//               AND t.relname = 'ProductVariants'
//               AND ix.indisunique = TRUE
//               AND EXISTS (
//                 SELECT 1 FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord)
//                 JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
//                 WHERE a.attname IN ('productId','colorId','sizeId')
//               )
//           LOOP
//             EXECUTE format('DROP INDEX IF EXISTS "catalog"."%I";', idx);
//           END LOOP;
//         END $$;
//       `);
//     } catch (indexDropError) {
//       console.error('Failed to drop unique index on ProductVariants (productId, colorId, sizeId):', indexDropError);
//     }

//     const server = app.listen(PORT, () => {
//       console.log(`Aesthco Auth API listening on http://localhost:${PORT}`);
//     });

//     const gracefulShutdown = () => {
//       console.log('Shutting down server...');
//       server.close(() => {
//         sequelize.close().finally(() => process.exit(0));
//       });

//       setTimeout(() => process.exit(1), SHUTDOWN_DELAY_MS).unref();
//     };

//     process.on('SIGTERM', gracefulShutdown);
//     process.on('SIGINT', gracefulShutdown);
//   } catch (error) {
//     console.error('Unable to start server:', error);
//     process.exit(1);
//   }
// }

// startServer();
require('dotenv').config();
const app = require('../app');
const { sequelize } = require('../models');

const PORT = process.env.PORT || 4000;
const SHUTDOWN_DELAY_MS = 500;

async function startServer() {
  try {
    // ✅ Only check DB connection
    await sequelize.authenticate();

    // ✅ Start server immediately
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
