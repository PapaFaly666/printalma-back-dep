#!/bin/bash

echo "🗄️ VÉRIFICATION DES TRANSACTIONS PAYTECH EN BASE DE DONNÉES"
echo "======================================================"

# Récupération de la connexion BDD
DB_URL=$(grep "DATABASE_URL" .env | grep -v "^#" | cut -d'"' -f2)

echo "📊 Connexion à la base de données..."
echo "Base: Neon PostgreSQL (us-east-1)"

echo ""
echo "🔍 REQUÊTES DE VÉRIFICATION:"
echo "============================="

echo ""
echo "1️⃣  Tables disponibles:"
echo "----------------------"
psql "$DB_URL" -c "\dt" 2>/dev/null | head -10 || echo "❌ Connexion impossible"

echo ""
echo "2️⃣  Structure de la table orders:"
echo "--------------------------------"
psql "$DB_URL" -c "\d orders" 2>/dev/null | head -15 || echo "❌ Impossible de décrire la table"

echo ""
echo "3️⃣  Transactions Paytech (paymentMethod = 'PAYTECH'):"
echo "---------------------------------------------------"
psql "$DB_URL" -c "
SELECT
  orderNumber,
  totalAmount,
  paymentStatus,
  transactionId,
  status,
  createdAt
FROM orders
WHERE paymentMethod = 'PAYTECH'
ORDER BY createdAt DESC
LIMIT 10;" 2>/dev/null || echo "❌ Impossible de récupérer les transactions"

echo ""
echo "4️⃣  Commandes en attente de paiement:"
echo "------------------------------------"
psql "$DB_URL" -c "
SELECT
  orderNumber,
  totalAmount,
  paymentStatus,
  paymentMethod,
  createdAt
FROM orders
WHERE paymentStatus = 'PENDING'
ORDER BY createdAt DESC
LIMIT 10;" 2>/dev/null || echo "❌ Impossible de récupérer les commandes en attente"

echo ""
echo "5️⃣  Statistiques des paiements:"
echo "-----------------------------"
psql "$DB_URL" -c "
SELECT
  paymentMethod,
  paymentStatus,
  COUNT(*) as nombre,
  COALESCE(SUM(totalAmount), 0) as total_montant
FROM orders
WHERE paymentMethod IS NOT NULL
GROUP BY paymentMethod, paymentStatus
ORDER BY paymentMethod, paymentStatus;" 2>/dev/null || echo "❌ Impossible de calculer les statistiques"

echo ""
echo "6️⃣  Transactions avec transactionId (Paytech):"
echo "----------------------------------------------"
psql "$DB_URL" -c "
SELECT
  orderNumber,
  transactionId,
  paymentStatus,
  totalAmount,
  createdAt,
  updatedAt
FROM orders
WHERE transactionId IS NOT NULL
ORDER BY updatedAt DESC
LIMIT 10;" 2>/dev/null || echo "❌ Impossible de trouver les transactions avec ID"

echo ""
echo "7️⃣  Recherche de vos transactions de test:"
echo "----------------------------------------"
TEST_PATTERNS=("TEST-" "SIMPLE-" "MOYEN-" "GROS-" "INTERFACE-")

for pattern in "${TEST_PATTERNS[@]}"; do
    echo "🔍 Recherche: $pattern*"
    psql "$DB_URL" -c "
    SELECT
      orderNumber,
      totalAmount,
      paymentStatus,
      transactionId,
      createdAt
    FROM orders
    WHERE orderNumber LIKE '$pattern%'
    ORDER BY createdAt DESC;" 2>/dev/null | head -5
done

echo ""
echo "📋 RÉCAPITULATIF:"
echo "================"
echo "• Si vous voyez '❌ Connexion impossible': problème d'accès BDD"
echo "• Si les requêtes retournent 0 lignes: pas de transactions enregistrées"
echo "• Si paymentStatus = NULL: transactions non finalisées"
echo "• Si transactionId = NULL: attente de paiement"

echo ""
echo "🎯 POUR VOIR LES TRANSACTIONS:"
echo "1. Finalisez un paiement via: https://paytech.sn/payment/checkout/eey3kpmh97ru31"
echo "2. Vérifiez l'IPN callback pour mise à jour automatique"
echo "3. Re-exécutez ce script après finalisation"

echo ""
echo "📖 Documentation complète: ./PAYTECH_DATABASE_STORAGE.md"