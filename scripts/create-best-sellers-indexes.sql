-- ============================================
-- SCRIPT D'OPTIMISATION - MEILLEURES VENTES
-- ============================================
-- Ce script crée les index nécessaires pour optimiser 
-- les requêtes de calcul des meilleures ventes

-- ============================================
-- INDEX SUR LA TABLE Order
-- ============================================

-- Index composite pour filtrer les commandes livrées par date
CREATE INDEX IF NOT EXISTS idx_order_status_created_at 
ON "Order" (status, "createdAt") 
WHERE status = 'DELIVERED';

-- Index pour les requêtes de performance sur les commandes
CREATE INDEX IF NOT EXISTS idx_order_status_updated_at 
ON "Order" (status, "updatedAt");

-- ============================================
-- INDEX SUR LA TABLE OrderItem  
-- ============================================

-- Index composite pour les jointures avec Order et Product
CREATE INDEX IF NOT EXISTS idx_orderitem_order_product 
ON "OrderItem" ("orderId", "productId");

-- Index pour les calculs de revenus
CREATE INDEX IF NOT EXISTS idx_orderitem_product_quantity_price 
ON "OrderItem" ("productId", quantity, "unitPrice");

-- ============================================
-- INDEX SUR LA TABLE VendorProduct
-- ============================================

-- Index composite pour les meilleures ventes actives
CREATE INDEX IF NOT EXISTS idx_vendorproduct_published_sales 
ON "VendorProduct" (status, "isDelete", "isBestSeller", "salesCount") 
WHERE status = 'PUBLISHED' AND "isDelete" = false;

-- Index pour le tri par meilleures ventes
CREATE INDEX IF NOT EXISTS idx_vendorproduct_bestseller_rank 
ON "VendorProduct" ("isBestSeller", "bestSellerRank", "salesCount") 
WHERE "isBestSeller" = true;

-- Index pour les statistiques par vendeur
CREATE INDEX IF NOT EXISTS idx_vendorproduct_vendor_sales 
ON "VendorProduct" ("vendorId", "salesCount", "totalRevenue") 
WHERE "isDelete" = false AND status = 'PUBLISHED';

-- Index pour les dates de dernière vente
CREATE INDEX IF NOT EXISTS idx_vendorproduct_last_sale_date 
ON "VendorProduct" ("lastSaleDate") 
WHERE "lastSaleDate" IS NOT NULL;

-- Index pour les vues de produits
CREATE INDEX IF NOT EXISTS idx_vendorproduct_views_count 
ON "VendorProduct" ("viewsCount") 
WHERE "viewsCount" > 0;

-- ============================================
-- INDEX SUR LA TABLE Product (produits de base)
-- ============================================

-- Index pour les jointures avec VendorProduct
CREATE INDEX IF NOT EXISTS idx_product_id_name 
ON "Product" (id, name);

-- ============================================
-- INDEX SUR LA TABLE User (vendeurs)
-- ============================================

-- Index pour les jointures avec VendorProduct
CREATE INDEX IF NOT EXISTS idx_user_vendor_info 
ON "User" (id, "firstName", "lastName", shop_name) 
WHERE role = 'VENDEUR';

-- ============================================
-- INDEX SUR LA TABLE Design
-- ============================================

-- Index pour les jointures avec VendorProduct
CREATE INDEX IF NOT EXISTS idx_design_id_cloudinary 
ON "Design" (id, name, "cloudinaryUrl");

-- ============================================
-- INDEX SUR LA TABLE ColorVariation
-- ============================================

-- Index pour récupérer les images principales des produits
CREATE INDEX IF NOT EXISTS idx_colorvariation_product_images 
ON "ColorVariation" ("productId", images) 
WHERE images IS NOT NULL;

-- ============================================
-- INDEX SUR LA TABLE _ProductToCategory (relation many-to-many)
-- ============================================

-- Index pour les filtres par catégorie
CREATE INDEX IF NOT EXISTS idx_product_category_relation 
ON "_ProductToCategory" ("A", "B");

-- ============================================
-- STATISTIQUES ET MAINTENANCE
-- ============================================

-- Mettre à jour les statistiques des tables pour l'optimiseur
ANALYZE "Order";
ANALYZE "OrderItem";
ANALYZE "VendorProduct";
ANALYZE "Product";
ANALYZE "User";
ANALYZE "Design";
ANALYZE "ColorVariation";
ANALYZE "_ProductToCategory";

-- ============================================
-- VUES MATÉRIALISÉES (optionnel pour PostgreSQL)
-- ============================================

-- Vue matérialisée pour les statistiques de vente (si supportée)
-- Cette vue peut être rafraîchie périodiquement pour de meilleures performances
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vendor_product_sales_stats AS
SELECT 
  vp.id as vendor_product_id,
  vp.name as product_name,
  vp."vendorId" as vendor_id,
  u."firstName" || ' ' || u."lastName" as vendor_name,
  u.shop_name,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.quantity * oi."unitPrice") as total_revenue,
  AVG(oi."unitPrice") as average_unit_price,
  COUNT(DISTINCT o."userId") as unique_customers,
  MIN(o."createdAt") as first_sale_date,
  MAX(o."createdAt") as last_sale_date,
  COUNT(DISTINCT o.id) as total_orders
FROM "VendorProduct" vp
JOIN "User" u ON u.id = vp."vendorId"
LEFT JOIN "OrderItem" oi ON oi."productId" = vp.id
LEFT JOIN "Order" o ON o.id = oi."orderId" AND o.status = 'DELIVERED'
WHERE vp."isDelete" = false AND vp.status = 'PUBLISHED'
GROUP BY vp.id, vp.name, vp."vendorId", u."firstName", u."lastName", u.shop_name;

-- Index sur la vue matérialisée
CREATE INDEX IF NOT EXISTS idx_mv_sales_stats_revenue 
ON mv_vendor_product_sales_stats (total_revenue DESC);

CREATE INDEX IF NOT EXISTS idx_mv_sales_stats_quantity 
ON mv_vendor_product_sales_stats (total_quantity_sold DESC);
*/

-- ============================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================

-- Requête pour vérifier que tous les index ont été créés
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (indexname LIKE 'idx_%' OR indexname LIKE '%best%')
ORDER BY tablename, indexname;

-- ============================================
-- CONSEILS D'UTILISATION
-- ============================================

/*
1. MAINTENANCE RÉGULIÈRE :
   - Exécuter ANALYZE sur les tables principales après de gros volumes de données
   - Monitorer les performances des requêtes avec EXPLAIN ANALYZE
   
2. MONITORING :
   - Surveiller l'utilisation des index avec pg_stat_user_indexes
   - Identifier les requêtes lentes avec pg_stat_statements
   
3. OPTIMISATIONS ADDITIONNELLES :
   - Considérer la partition des tables Order/OrderItem par date si volume très important
   - Implémenter un cache Redis pour les requêtes fréquentes
   - Utiliser des vues matérialisées rafraîchies périodiquement
   
4. REQUÊTE DE MONITORING DES PERFORMANCES :
   SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan as index_scans,
     idx_tup_read as tuples_read,
     idx_tup_fetch as tuples_fetched
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public'
   ORDER BY idx_scan DESC;
*/ 