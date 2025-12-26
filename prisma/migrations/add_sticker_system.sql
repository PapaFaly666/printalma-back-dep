-- Migration: Système de vente de stickers personnalisés
-- Date: 2025-12-24

BEGIN;

-- ==================================================
-- 1. Créer les enums pour les stickers
-- ==================================================

CREATE TYPE "StickerShape" AS ENUM ('SQUARE', 'CIRCLE', 'RECTANGLE', 'DIE_CUT');
CREATE TYPE "StickerProductStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- ==================================================
-- 2. Table sticker_sizes - Tailles prédéfinies
-- ==================================================

CREATE TABLE sticker_sizes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  width_cm DECIMAL(10, 2) NOT NULL CHECK (width_cm > 0),
  height_cm DECIMAL(10, 2) NOT NULL CHECK (height_cm > 0),
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 3. Table sticker_finishes - Finitions disponibles
-- ==================================================

CREATE TABLE sticker_finishes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (price_multiplier >= 1.00),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 4. Table sticker_products - Produits stickers
-- ==================================================

CREATE TABLE sticker_products (
  id SERIAL PRIMARY KEY,

  -- Références
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES "Design"(id) ON DELETE CASCADE,

  -- Informations du produit
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,

  -- Configuration du sticker
  size_id VARCHAR(50) NOT NULL REFERENCES sticker_sizes(id),
  width_cm DECIMAL(10, 2) NOT NULL CHECK (width_cm > 0),
  height_cm DECIMAL(10, 2) NOT NULL CHECK (height_cm > 0),
  finish VARCHAR(50) NOT NULL REFERENCES sticker_finishes(id),
  shape "StickerShape" NOT NULL DEFAULT 'SQUARE',

  -- Prix et stock
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  finish_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  final_price INTEGER NOT NULL CHECK (final_price >= 0),
  minimum_quantity INTEGER NOT NULL DEFAULT 1 CHECK (minimum_quantity > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),

  -- Métadonnées
  status "StickerProductStatus" NOT NULL DEFAULT 'DRAFT',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  sale_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- ==================================================
-- 5. Table sticker_order_items - Items de commande
-- ==================================================

CREATE TABLE sticker_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  sticker_product_id INTEGER NOT NULL REFERENCES sticker_products(id),

  -- Détails de la commande
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),

  -- Configuration (snapshot au moment de la commande)
  size_name VARCHAR(100),
  finish_name VARCHAR(100),
  shape_name VARCHAR(100),
  dimensions_cm VARCHAR(50),

  -- Métadonnées
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 6. Table sticker_views - Analytics vues
-- ==================================================

CREATE TABLE sticker_views (
  id SERIAL PRIMARY KEY,
  sticker_id INTEGER NOT NULL REFERENCES sticker_products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255),
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- 7. Table sticker_favorites - Analytics favoris
-- ==================================================

CREATE TABLE sticker_favorites (
  id SERIAL PRIMARY KEY,
  sticker_id INTEGER NOT NULL REFERENCES sticker_products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_sticker_favorite UNIQUE (sticker_id, user_id)
);

-- ==================================================
-- 8. Créer les index pour les performances
-- ==================================================

-- Index sticker_products
CREATE INDEX idx_sticker_products_vendor_id ON sticker_products(vendor_id);
CREATE INDEX idx_sticker_products_design_id ON sticker_products(design_id);
CREATE INDEX idx_sticker_products_status ON sticker_products(status);
CREATE INDEX idx_sticker_products_size_id ON sticker_products(size_id);
CREATE INDEX idx_sticker_products_finish ON sticker_products(finish);
CREATE INDEX idx_sticker_products_is_featured ON sticker_products(is_featured);
CREATE INDEX idx_sticker_products_published_at ON sticker_products(published_at);
CREATE INDEX idx_sticker_products_vendor_status ON sticker_products(vendor_id, status);
CREATE INDEX idx_sticker_products_published ON sticker_products(status, published_at) WHERE status = 'PUBLISHED';

-- Index sticker_order_items
CREATE INDEX idx_sticker_order_items_order_id ON sticker_order_items(order_id);
CREATE INDEX idx_sticker_order_items_sticker_id ON sticker_order_items(sticker_product_id);

-- Index sticker_views
CREATE INDEX idx_sticker_views_sticker_id ON sticker_views(sticker_id);
CREATE INDEX idx_sticker_views_viewed_at ON sticker_views(viewed_at);

-- Index sticker_favorites
CREATE INDEX idx_sticker_favorites_sticker_id ON sticker_favorites(sticker_id);
CREATE INDEX idx_sticker_favorites_user_id ON sticker_favorites(user_id);

-- ==================================================
-- 9. Fonction de mise à jour automatique updated_at
-- ==================================================

CREATE OR REPLACE FUNCTION update_sticker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sticker_products_updated_at
  BEFORE UPDATE ON sticker_products
  FOR EACH ROW
  EXECUTE FUNCTION update_sticker_updated_at();

COMMIT;
