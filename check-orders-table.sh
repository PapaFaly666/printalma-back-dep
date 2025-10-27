#!/bin/bash

echo "🔍 VÉRIFICATION DE LA TABLE ORDERS POUR LES PAIEMENTS PAYTECH"
echo "========================================================="

# Récupération de la connexion BDD
DB_URL=$(grep "DATABASE_URL" .env | grep -v "^#" | cut -d'"' -f2)

echo "📊 Connexion à: Neon PostgreSQL"
echo "URL: $(echo "$DB_URL" | cut -d'@' -f2)"

echo ""
echo "🏗️  1. Vérification de la table orders:"
echo "-----------------------------------"
psql "$DB_URL" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders');" 2>/dev/null || echo "❌ Impossible de vérifier l'existence de la table"

echo ""
echo "📋 2. Structure de la table orders:"
echo "--------------------------------"
psql "$DB_URL" -c "\d orders" 2>/dev/null | head -20 || echo "❌ Impossible de décrire la table"

echo ""
echo "💰 3. Colonnes de paiement dans la table orders:"
echo "--------------------------------------------"
psql "$DB_URL" -c "
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND (column_name ILIKE '%payment%' OR column_name ILIKE '%transaction%')
ORDER BY column_name;" 2>/dev/null || echo "❌ Impossible de récupérer les colonnes de paiement"

echo ""
echo "📊 4. Vérification des index sur les colonnes de paiement:"
echo "----------------------------------------------------"
psql "$DB_URL" -c "
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND (indexdef ILIKE '%payment%' OR indexdef ILIKE '%transaction%')
ORDER BY indexname;" 2>/dev/null || echo "❌ Impossible de récupérer les index"

echo ""
echo "🔍 5. Recherche de transactions Paytech existantes:"
echo "----------------------------------------------"
psql "$DB_URL" -c "
SELECT
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN payment_method = 'PAYTECH' THEN 1 END) as paytech_transactions,
    COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_transactions,
    COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_transactions,
    COUNT(CASE WHEN transaction_id IS NOT NULL THEN 1 END) as with_transaction_id
FROM orders;" 2>/dev/null || echo "❌ Impossible de compter les transactions"

echo ""
echo "📋 6. Transactions Paytech détaillées (si elles existent):"
echo "------------------------------------------------------"
psql "$DB_URL" -c "
SELECT
    order_number,
    total_amount,
    payment_method,
    payment_status,
    transaction_id,
    status,
    created_at,
    updated_at
FROM orders
WHERE payment_method = 'PAYTECH'
   OR payment_status IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;" 2>/dev/null || echo "❌ Impossible de récupérer les transactions Paytech"

echo ""
echo "🧪 7. Test avec orderNumber de vos transactions créées:"
echo "--------------------------------------------------"
TEST_ORDER_NUMBERS=("TEST-001" "SIMPLE-1732678591" "MOYEN-1732678591" "GROS-1732678591" "INTERFACE-TEST-999")

for order_num in "${TEST_ORDER_NUMBERS[@]}"; do
    echo "🔍 Recherche de: $order_num"
    psql "$DB_URL" -c "
    SELECT
        order_number,
        total_amount,
        payment_method,
        payment_status,
        transaction_id,
        created_at
    FROM orders
    WHERE order_number = '$order_num';" 2>/dev/null | head -3
done

echo ""
echo "🎯 8. Toutes les commandes avec des infos de paiement:"
echo "-------------------------------------------------"
psql "$DB_URL" -c "
SELECT
    order_number,
    total_amount,
    payment_method,
    payment_status,
    transaction_id,
    created_at
FROM orders
WHERE payment_method IS NOT NULL
   OR payment_status IS NOT NULL
ORDER BY created_at DESC
LIMIT 15;" 2>/dev/null || echo "❌ Impossible de récupérer les commandes avec paiement"

echo ""
echo "📈 9. Statistiques par statut de paiement:"
echo "---------------------------------------"
psql "$DB_URL" -c "
SELECT
    COALESCE(payment_status, 'NO_STATUS') as payment_status,
    COUNT(*) as nombre_commandes,
    COALESCE(SUM(total_amount), 0) as montant_total
FROM orders
GROUP BY payment_status
ORDER BY nombre_commandes DESC;" 2>/dev/null || echo "❌ Impossible de calculer les statistiques"

echo ""
echo "✅ CONCLUSION:"
echo "=============="
echo "• Si la table 'orders' n'existe pas: exécutez 'npx prisma db push'"
echo "• Si les requêtes retournent 0: aucune transaction Paytech enregistrée"
echo "• Si payment_method = NULL: les transactions ne sont pas créées en BDD"
echo "• Si payment_status = NULL: les paiements ne sont pas finalisés"