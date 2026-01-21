-- Step 1: Add new columns
ALTER TABLE "sticker_products" ADD COLUMN "min_quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "sticker_products" ADD COLUMN "max_quantity" INTEGER NOT NULL DEFAULT 100;

-- Step 2: Migrate data from old columns to new columns
-- minQuantity gets the value from minimumQuantity (or default to 1)
UPDATE "sticker_products"
SET "min_quantity" = COALESCE("minimum_quantity", 1);

-- maxQuantity gets the value from stockQuantity (or default to 100)
UPDATE "sticker_products"
SET "max_quantity" = CASE
  WHEN "stock_quantity" > 0 THEN "stock_quantity"
  ELSE 100
END;

-- Step 3: Drop old columns
ALTER TABLE "sticker_products" DROP COLUMN "minimum_quantity";
ALTER TABLE "sticker_products" DROP COLUMN "stock_quantity";
