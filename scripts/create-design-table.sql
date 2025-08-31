-- Création de l'enum DesignCategory
CREATE TYPE "DesignCategory" AS ENUM ('LOGO', 'PATTERN', 'ILLUSTRATION', 'TYPOGRAPHY', 'ABSTRACT');

-- Création de la table designs
CREATE TABLE "Design" (
  "id" SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL CHECK ("price" >= 100),
  "category" "DesignCategory" NOT NULL DEFAULT 'ILLUSTRATION',
  
  -- URLs et métadonnées des fichiers
  "imageUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "cloudinaryPublicId" TEXT NOT NULL,
  "thumbnailPublicId" TEXT,
  
  -- Métadonnées techniques
  "fileSize" INTEGER,
  "originalFileName" TEXT,
  "dimensions" JSONB,
  "format" TEXT,
  
  -- Statuts de publication
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isPending" BOOLEAN NOT NULL DEFAULT false,
  "isDraft" BOOLEAN NOT NULL DEFAULT true,
  
  -- Métadonnées et tags
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Statistiques
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "earnings" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  
  -- Contraintes
  CONSTRAINT "Design_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX "Design_vendorId_idx" ON "Design"("vendorId");
CREATE INDEX "Design_isPublished_idx" ON "Design"("isPublished");
CREATE INDEX "Design_createdAt_idx" ON "Design"("createdAt");
CREATE INDEX "Design_price_idx" ON "Design"("price");

-- Contraintes supplémentaires
ALTER TABLE "Design" ADD CONSTRAINT "Design_name_not_empty" CHECK (LENGTH(TRIM("name")) >= 3);

COMMENT ON TABLE "Design" IS 'Table des designs créés par les vendeurs';
COMMENT ON COLUMN "Design"."price" IS 'Prix en FCFA (centimes)';
COMMENT ON COLUMN "Design"."earnings" IS 'Gains totaux en FCFA';
COMMENT ON COLUMN "Design"."dimensions" IS 'Dimensions de l''image {width: number, height: number}';

-- Insertion d'exemples de données (optionnel pour les tests)
-- INSERT INTO "Design" ("vendorId", "name", "description", "price", "category", "imageUrl", "cloudinaryPublicId") 
-- VALUES 
-- (1, 'Logo Moderne', 'Un logo épuré pour entreprises', 2500, 'LOGO', 'https://example.com/logo.jpg', 'designs/1/logo_123'),
-- (1, 'Pattern Géométrique', 'Pattern abstrait géométrique', 1500, 'PATTERN', 'https://example.com/pattern.jpg', 'designs/1/pattern_124'); 