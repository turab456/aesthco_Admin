-- Production migration script
-- BACKUP YOUR DATABASE FIRST!

BEGIN;

-- Drop foreign key constraints
ALTER TABLE "OrderItems" DROP CONSTRAINT IF EXISTS "OrderItems_orderId_fkey";
ALTER TABLE "Reviews" DROP CONSTRAINT IF EXISTS "Reviews_orderId_fkey";
ALTER TABLE "CouponRedemptions" DROP CONSTRAINT IF EXISTS "CouponRedemptions_orderId_fkey";

-- Change column types
ALTER TABLE "Orders" ALTER COLUMN "id" TYPE VARCHAR(255);
ALTER TABLE "OrderItems" ALTER COLUMN "orderId" TYPE VARCHAR(255);
ALTER TABLE "Reviews" ALTER COLUMN "orderId" TYPE VARCHAR(255);
ALTER TABLE "CouponRedemptions" ALTER COLUMN "orderId" TYPE VARCHAR(255);

-- Re-add foreign key constraints
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponRedemptions" ADD CONSTRAINT "CouponRedemptions_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;