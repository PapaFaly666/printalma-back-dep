-- Fix: Make productId truly nullable in OrderItem table
-- This allows orders to contain only stickers (without productId)

-- Step 1: Drop the foreign key constraint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_fkey";

-- Step 2: Make the column nullable
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;

-- Step 3: Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey"
  FOREIGN KEY ("product_id")
  REFERENCES "products"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
