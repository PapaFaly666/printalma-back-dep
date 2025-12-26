-- Seed data pour le système de stickers
-- Date: 2025-12-24

BEGIN;

-- ==================================================
-- 1. Insérer les tailles de stickers
-- ==================================================

INSERT INTO sticker_sizes (id, name, description, width_cm, height_cm, base_price, is_active, display_order) VALUES
('small', 'Petit', '5cm x 5cm - Parfait pour ordinateur portable', 5.00, 5.00, 500, TRUE, 1),
('medium', 'Moyen', '10cm x 10cm - Taille standard polyvalente', 10.00, 10.00, 1000, TRUE, 2),
('large', 'Grand', '15cm x 15cm - Grand format pour décoration', 15.00, 15.00, 1500, TRUE, 3),
('xlarge', 'Très Grand', '20cm x 20cm - Format XXL', 20.00, 20.00, 2500, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 2. Insérer les finitions de stickers
-- ==================================================

INSERT INTO sticker_finishes (id, name, description, price_multiplier, is_active, display_order) VALUES
('matte', 'Mat', 'Finition mate élégante, anti-reflet', 1.00, TRUE, 1),
('glossy', 'Brillant', 'Finition brillante éclatante', 1.10, TRUE, 2),
('transparent', 'Transparent', 'Fond transparent, design visible', 1.30, TRUE, 3),
('holographic', 'Holographique', 'Effet arc-en-ciel premium', 1.50, TRUE, 4),
('metallic', 'Métallique', 'Effet métallisé brillant', 1.40, TRUE, 5)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==================================================
-- Vérification des données insérées
-- ==================================================

SELECT '✅ Tailles de stickers insérées:' as message;
SELECT id, name, CONCAT(width_cm, 'x', height_cm, 'cm') as dimensions, base_price as "prix_base_FCFA"
FROM sticker_sizes
ORDER BY display_order;

SELECT '✅ Finitions de stickers insérées:' as message;
SELECT id, name, price_multiplier as "multiplicateur_prix"
FROM sticker_finishes
ORDER BY display_order;
