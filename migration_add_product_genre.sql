-- Migration pour ajouter l'enum ProductGenre
-- Exécutez ce script dans votre base de données PostgreSQL

-- Créer l'enum ProductGenre
CREATE TYPE "ProductGenre" AS ENUM ('HOMME', 'FEMME', 'BEBE', 'UNISEXE');

-- Ajouter la colonne genre à la table Product (si elle n'existe pas déjà)
-- Si la colonne existe déjà, vous pouvez ignorer cette ligne
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "genre" "ProductGenre" NOT NULL DEFAULT 'UNISEXE';

-- Créer un index sur la colonne genre pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "Product_genre_idx" ON "Product"("genre");

-- Mettre à jour les produits existants qui n'ont pas de genre défini
UPDATE "Product" SET "genre" = 'UNISEXE' WHERE "genre" IS NULL; 
-- Exécutez ce script dans votre base de données PostgreSQL

-- Créer l'enum ProductGenre
CREATE TYPE "ProductGenre" AS ENUM ('HOMME', 'FEMME', 'BEBE', 'UNISEXE');

-- Ajouter la colonne genre à la table Product (si elle n'existe pas déjà)
-- Si la colonne existe déjà, vous pouvez ignorer cette ligne
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "genre" "ProductGenre" NOT NULL DEFAULT 'UNISEXE';

-- Créer un index sur la colonne genre pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "Product_genre_idx" ON "Product"("genre");

-- Mettre à jour les produits existants qui n'ont pas de genre défini
UPDATE "Product" SET "genre" = 'UNISEXE' WHERE "genre" IS NULL; 