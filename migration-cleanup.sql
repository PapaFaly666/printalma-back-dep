-- Script pour nettoyer les galeries multiples par vendeur
-- Garde uniquement la galerie la plus récente par vendeur

-- Étape 1: Identifier les galeries à conserver (la plus récente par vendeur)
CREATE TEMPORARY TABLE galleries_to_keep AS
SELECT
    vg.id as gallery_id_to_keep,
    vg.vendor_id
FROM vendor_galleries vg
INNER JOIN (
    SELECT
        vendor_id,
        MAX(created_at) as latest_created_at,
        MAX(id) as latest_id
    FROM vendor_galleries
    WHERE deleted_at IS NULL
    GROUP BY vendor_id
) latest ON vg.vendor_id = latest.vendor_id
       AND (vg.created_at = latest.latest_created_at OR vg.id = latest.latest_id);

-- Étape 2: Supprimer les galeries en double (sauf celle à conserver)
-- D'abord, supprimer les images des galeries en double
DELETE FROM gallery_images
WHERE gallery_id IN (
    SELECT id
    FROM vendor_galleries vg
    WHERE vg.deleted_at IS NULL
    AND vg.vendor_id IN (
        SELECT vendor_id
        FROM vendor_galleries
        WHERE deleted_at IS NULL
        GROUP BY vendor_id
        HAVING COUNT(*) > 1
    )
    AND id NOT IN (
        SELECT gallery_id_to_keep
        FROM galleries_to_keep
    )
);

-- Étape 3: Supprimer les galeries en double (soft delete)
UPDATE vendor_galleries
SET deleted_at = NOW()
WHERE deleted_at IS NULL
AND vendor_id IN (
    SELECT vendor_id
    FROM vendor_galleries
    WHERE deleted_at IS NULL
    GROUP BY vendor_id
    HAVING COUNT(*) > 1
)
AND id NOT IN (
    SELECT gallery_id_to_keep
    FROM galleries_to_keep
);

-- Étape 4: Nettoyer la table temporaire
DROP TABLE galleries_to_keep;

-- Étape 5: Vérifier le résultat
SELECT
    vendor_id,
    COUNT(*) as remaining_gallery_count
FROM vendor_galleries
WHERE deleted_at IS NULL
GROUP BY vendor_id
ORDER BY vendor_id;

-- Étape 6: Afficher les galeries restantes
SELECT
    id,
    vendor_id,
    title,
    created_at,
    updated_at
FROM vendor_galleries
WHERE deleted_at IS NULL
ORDER BY vendor_id, created_at DESC;