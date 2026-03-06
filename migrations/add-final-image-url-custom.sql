-- Migration: Add final_image_url_custom to product_customizations
-- Date: 2026-03-03
-- Description: Ajouter le champ pour stocker l'URL de l'image finale générée avec Sharp pour les personnalisations clients

-- Add final_image_url_custom column
ALTER TABLE product_customizations
ADD COLUMN IF NOT EXISTS final_image_url_custom TEXT;

-- Add index for faster queries on this field
CREATE INDEX IF NOT EXISTS idx_product_customizations_final_image_url_custom
ON product_customizations(final_image_url_custom)
WHERE final_image_url_custom IS NOT NULL;

-- Comment
COMMENT ON COLUMN product_customizations.final_image_url_custom IS 'URL de l''image finale générée avec Sharp (mockup avec tous les éléments de design appliqués)';
