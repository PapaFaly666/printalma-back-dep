-- Add stickerId column to OrderItem (optional, for mixed orders)
ALTER TABLE "order_items" ADD COLUMN "sticker_id" INT;

-- Make productId optional (allow orders with only stickers)
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;

-- Add foreign key constraint for stickerId
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "sticker_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for stickerId
CREATE INDEX "order_items_sticker_id_idx" ON "order_items"("sticker_id");
