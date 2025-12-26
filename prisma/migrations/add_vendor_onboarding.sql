-- Migration pour l'onboarding vendeur (NestJS + Prisma + PostgreSQL)
-- Date: 2025-12-23

-- 1. Ajouter le champ onboarding_completed_at à la table User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP(3);

-- 2. Créer la table vendor_phones
CREATE TABLE IF NOT EXISTS vendor_phones (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_vendor_phones_user FOREIGN KEY (vendor_id) REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT unique_vendor_phone UNIQUE (vendor_id, phone_number)
);

-- 3. Créer les index pour la table vendor_phones
CREATE INDEX IF NOT EXISTS idx_vendor_phones_vendor_id ON vendor_phones(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_phones_vendor_primary ON vendor_phones(vendor_id, is_primary);

-- 4. Commentaires pour documentation
COMMENT ON TABLE vendor_phones IS 'Table pour stocker les numéros de téléphone des vendeurs (2-3 numéros)';
COMMENT ON COLUMN vendor_phones.is_primary IS 'Indique si ce numéro est le numéro principal du vendeur';
COMMENT ON COLUMN "User".onboarding_completed_at IS 'Date et heure de complétion de l''onboarding vendeur';
