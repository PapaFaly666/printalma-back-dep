-- Migration: Add default_color_id to vendor_products table
-- Date: 2025-12-26
-- Description: Allow vendors to set a default color for their products

-- Add the default_color_id column
ALTER TABLE vendor_products
ADD COLUMN IF NOT EXISTS default_color_id INTEGER;

-- Add comment to document the field
COMMENT ON COLUMN vendor_products.default_color_id IS 'ID of the default color to display first to customers. Must be one of the selected colors in the colors JSON field.';

-- Optional: Set default_color_id to the first color in the colors JSON array for existing products
-- This is optional and can be run separately if needed
-- UPDATE vendor_products
-- SET default_color_id = (colors->0->>'id')::integer
-- WHERE default_color_id IS NULL
--   AND colors IS NOT NULL
--   AND jsonb_array_length(colors) > 0;
