-- SQL pour enlever la suppression en cascade entre SubCategory et Variation
-- À exécuter manuellement sur la base de données

-- D'abord, enlever la contrainte de clé étrangère existante
ALTER TABLE variations DROP CONSTRAINT variations_subCategoryId_fkey;

-- Puis, recréer la contrainte sans la suppression en cascade
ALTER TABLE variations
ADD CONSTRAINT variations_subCategoryId_fkey
FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id);

-- Vérifier que la contrainte a été correctement créée
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    rc.match_option,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'variations'
    AND tc.constraint_name = 'variations_subCategoryId_fkey';