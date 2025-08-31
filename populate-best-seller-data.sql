-- 📊 Script SQL de Population des Données de Meilleures Ventes
-- 
-- Ce script remplit les champs isBestSeller, salesCount et totalRevenue
-- dans la table VendorProduct avec des données simulées.

-- 1. Mettre à jour les ventes simulées pour tous les produits publiés
UPDATE "VendorProduct" 
SET 
  "salesCount" = FLOOR(RANDOM() * 100 + 10), -- 10-110 ventes
  "totalRevenue" = FLOOR(RANDOM() * 100 + 10) * price,
  "updatedAt" = NOW()
WHERE 
  "isDelete" = false 
  AND "status" = 'PUBLISHED';

-- 2. Marquer les meilleures ventes (top 10% par revenus)
-- D'abord, réinitialiser tous les isBestSeller à false
UPDATE "VendorProduct" 
SET "isBestSeller" = false 
WHERE "isDelete" = false AND "status" = 'PUBLISHED';

-- Ensuite, marquer les meilleures ventes
WITH ranked_products AS (
  SELECT 
    id,
    "totalRevenue",
    ROW_NUMBER() OVER (ORDER BY "totalRevenue" DESC) as rank,
    COUNT(*) OVER () as total_count
  FROM "VendorProduct" 
  WHERE "isDelete" = false AND "status" = 'PUBLISHED' AND "totalRevenue" > 0
),
top_sellers AS (
  SELECT id
  FROM ranked_products 
  WHERE rank <= GREATEST(3, CEIL(total_count * 0.1))
)
UPDATE "VendorProduct" 
SET "isBestSeller" = true
WHERE id IN (SELECT id FROM top_sellers);

-- 3. Afficher les statistiques (requêtes de vérification)
-- Compter les meilleures ventes
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN "isBestSeller" = true THEN 1 END) as best_sellers_count,
  SUM("salesCount") as total_sales,
  SUM("totalRevenue") as total_revenue
FROM "VendorProduct" 
WHERE "isDelete" = false AND "status" = 'PUBLISHED';

-- Afficher les top 5 meilleures ventes
SELECT 
  vp.name,
  vp."salesCount",
  vp."totalRevenue",
  vp.price,
  u."shop_name",
  u."firstName" || ' ' || u."lastName" as vendor_name
FROM "VendorProduct" vp
JOIN "User" u ON vp."vendorId" = u.id
WHERE vp."isBestSeller" = true 
  AND vp."isDelete" = false 
  AND vp."status" = 'PUBLISHED'
ORDER BY vp."totalRevenue" DESC
LIMIT 5;

-- Statistiques par vendeur
SELECT 
  u."firstName" || ' ' || u."lastName" as vendor_name,
  u."shop_name",
  COUNT(vp.id) as total_products,
  COUNT(CASE WHEN vp."isBestSeller" = true THEN 1 END) as best_sellers_count,
  SUM(vp."salesCount") as total_sales,
  SUM(vp."totalRevenue") as total_revenue
FROM "VendorProduct" vp
JOIN "User" u ON vp."vendorId" = u.id
WHERE vp."isDelete" = false AND vp."status" = 'PUBLISHED'
GROUP BY u.id, u."firstName", u."lastName", u."shop_name"
ORDER BY total_revenue DESC; 
-- 
-- Ce script remplit les champs isBestSeller, salesCount et totalRevenue
-- dans la table VendorProduct avec des données simulées.

-- 1. Mettre à jour les ventes simulées pour tous les produits publiés
UPDATE "VendorProduct" 
SET 
  "salesCount" = FLOOR(RANDOM() * 100 + 10), -- 10-110 ventes
  "totalRevenue" = FLOOR(RANDOM() * 100 + 10) * price,
  "updatedAt" = NOW()
WHERE 
  "isDelete" = false 
  AND "status" = 'PUBLISHED';

-- 2. Marquer les meilleures ventes (top 10% par revenus)
-- D'abord, réinitialiser tous les isBestSeller à false
UPDATE "VendorProduct" 
SET "isBestSeller" = false 
WHERE "isDelete" = false AND "status" = 'PUBLISHED';

-- Ensuite, marquer les meilleures ventes
WITH ranked_products AS (
  SELECT 
    id,
    "totalRevenue",
    ROW_NUMBER() OVER (ORDER BY "totalRevenue" DESC) as rank,
    COUNT(*) OVER () as total_count
  FROM "VendorProduct" 
  WHERE "isDelete" = false AND "status" = 'PUBLISHED' AND "totalRevenue" > 0
),
top_sellers AS (
  SELECT id
  FROM ranked_products 
  WHERE rank <= GREATEST(3, CEIL(total_count * 0.1))
)
UPDATE "VendorProduct" 
SET "isBestSeller" = true
WHERE id IN (SELECT id FROM top_sellers);

-- 3. Afficher les statistiques (requêtes de vérification)
-- Compter les meilleures ventes
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN "isBestSeller" = true THEN 1 END) as best_sellers_count,
  SUM("salesCount") as total_sales,
  SUM("totalRevenue") as total_revenue
FROM "VendorProduct" 
WHERE "isDelete" = false AND "status" = 'PUBLISHED';

-- Afficher les top 5 meilleures ventes
SELECT 
  vp.name,
  vp."salesCount",
  vp."totalRevenue",
  vp.price,
  u."shop_name",
  u."firstName" || ' ' || u."lastName" as vendor_name
FROM "VendorProduct" vp
JOIN "User" u ON vp."vendorId" = u.id
WHERE vp."isBestSeller" = true 
  AND vp."isDelete" = false 
  AND vp."status" = 'PUBLISHED'
ORDER BY vp."totalRevenue" DESC
LIMIT 5;

-- Statistiques par vendeur
SELECT 
  u."firstName" || ' ' || u."lastName" as vendor_name,
  u."shop_name",
  COUNT(vp.id) as total_products,
  COUNT(CASE WHEN vp."isBestSeller" = true THEN 1 END) as best_sellers_count,
  SUM(vp."salesCount") as total_sales,
  SUM(vp."totalRevenue") as total_revenue
FROM "VendorProduct" vp
JOIN "User" u ON vp."vendorId" = u.id
WHERE vp."isDelete" = false AND vp."status" = 'PUBLISHED'
GROUP BY u.id, u."firstName", u."lastName", u."shop_name"
ORDER BY total_revenue DESC; 