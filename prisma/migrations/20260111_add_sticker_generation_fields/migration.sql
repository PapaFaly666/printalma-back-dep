-- Migration pour ajouter les champs de génération d'image aux stickers
-- Date: 2026-01-11
-- Description: Ajoute stickerType, borderColor, et surface pour la génération d'images avec bordures

-- Ajouter les colonnes pour la configuration de génération d'image
ALTER TABLE sticker_products
ADD COLUMN IF NOT EXISTS sticker_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS border_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS surface VARCHAR(50);

-- Créer des index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_sticker_products_sticker_type ON sticker_products(sticker_type);
CREATE INDEX IF NOT EXISTS idx_sticker_products_border_color ON sticker_products(border_color);

-- Mettre à jour les enregistrements existants avec des valeurs par défaut
UPDATE sticker_products
SET sticker_type = 'autocollant',
    border_color = 'glossy-white'
WHERE sticker_type IS NULL;
