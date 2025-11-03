-- Add featured columns to design_categories table
ALTER TABLE "design_categories"
ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featured_order" INTEGER;

-- Create index for better query performance
CREATE INDEX "idx_design_categories_featured"
ON "design_categories"("is_featured", "featured_order")
WHERE "is_featured" = true;

-- Add comment to document the purpose
COMMENT ON COLUMN "design_categories"."is_featured" IS 'Indicates if this category should appear in the trending themes section';
COMMENT ON COLUMN "design_categories"."featured_order" IS 'Display order for featured categories (1-5), NULL if not featured';
