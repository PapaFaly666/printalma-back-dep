-- Migration: Ajouter le champ admin_validated pour la validation des produits WIZARD
-- Date: 2025-01-24

ALTER TABLE "VendorProduct" ADD COLUMN IF NOT EXISTS "admin_validated" BOOLEAN;

-- Commentaire pour expliquer l'utilisation du champ
COMMENT ON COLUMN "VendorProduct"."admin_validated" IS 'Validation admin spécifique pour produits WIZARD: null=pas concerné (traditionnel), false=en attente (WIZARD), true=validé (WIZARD)';

-- Initialiser les valeurs existantes
-- Produits WIZARD existants (sans designId) -> en attente de validation
UPDATE "VendorProduct"
SET "admin_validated" = false
WHERE "design_id" IS NULL AND "admin_validated" IS NULL;

-- Produits traditionnels (avec designId) -> pas concernés
UPDATE "VendorProduct"
SET "admin_validated" = null
WHERE "design_id" IS NOT NULL AND "admin_validated" IS NULL;

-- Index pour optimiser les requêtes de validation
CREATE INDEX IF NOT EXISTS "idx_vendor_product_admin_validated"
ON "VendorProduct" ("admin_validated")
WHERE "admin_validated" IS NOT NULL;