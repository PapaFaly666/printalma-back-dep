-- Migration: Add client_email and client_name to product_customizations
-- Date: 2026-03-03
-- Description: Add optional fields to store client contact information for customization emails

-- Add client_email column
ALTER TABLE product_customizations
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);

-- Add client_name column
ALTER TABLE product_customizations
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

-- Add index on client_email for faster queries
CREATE INDEX IF NOT EXISTS idx_product_customizations_client_email
ON product_customizations(client_email);

-- Comment
COMMENT ON COLUMN product_customizations.client_email IS 'Email du client pour l''envoi du mockup de personnalisation';
COMMENT ON COLUMN product_customizations.client_name IS 'Nom du client pour personnaliser l''email';
