#!/bin/bash

# Script de test pour simuler un callback Orange Money
# Usage: ./test-orange-callback.sh [orderNumber] [status]
#   status: SUCCESS (default) | FAILED | CANCELLED

ORDER_NUMBER=${1:-"TEST-ORDER-001"}
STATUS=${2:-"SUCCESS"}
TRANSACTION_ID="TXN-TEST-$(date +%s)"
REFERENCE="OM-$ORDER_NUMBER-$(date +%s)"

echo "======================================"
echo "🧪 Test du callback Orange Money"
echo "======================================"
echo "📦 Order Number: $ORDER_NUMBER"
echo "📊 Status: $STATUS"
echo "💳 Transaction ID: $TRANSACTION_ID"
echo "🔗 Reference: $REFERENCE"
echo ""

# Fonction pour vérifier le statut de paiement
check_payment_status() {
  echo ""
  echo "🔍 Vérification du statut de paiement..."
  curl -s http://localhost:3004/orange-money/payment-status/$ORDER_NUMBER | jq .
}

# Vérifier le statut initial
echo "1️⃣ Statut AVANT le callback:"
check_payment_status

echo ""
echo "======================================"
echo "2️⃣ Envoi du callback $STATUS"
echo "======================================"

if [ "$STATUS" == "SUCCESS" ]; then
  echo "✅ Simulation d'un paiement réussi..."
  curl -X POST http://localhost:3004/orange-money/callback \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"SUCCESS\",
      \"transactionId\": \"$TRANSACTION_ID\",
      \"amount\": {
        \"unit\": \"XOF\",
        \"value\": 10000
      },
      \"code\": \"PRINTALMA001\",
      \"reference\": \"$REFERENCE\",
      \"metadata\": {
        \"orderId\": \"1\",
        \"orderNumber\": \"$ORDER_NUMBER\",
        \"customerName\": \"Test Client\"
      }
    }" | jq .

elif [ "$STATUS" == "FAILED" ]; then
  echo "❌ Simulation d'un paiement échoué..."
  curl -X POST http://localhost:3004/orange-money/callback \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"FAILED\",
      \"transactionId\": \"$TRANSACTION_ID\",
      \"amount\": {
        \"unit\": \"XOF\",
        \"value\": 10000
      },
      \"code\": \"PRINTALMA001\",
      \"reference\": \"$REFERENCE\",
      \"metadata\": {
        \"orderId\": \"1\",
        \"orderNumber\": \"$ORDER_NUMBER\",
        \"customerName\": \"Test Client\"
      }
    }" | jq .

elif [ "$STATUS" == "CANCELLED" ]; then
  echo "🚫 Simulation d'un paiement annulé..."
  curl -X POST http://localhost:3004/orange-money/callback \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"CANCELLED\",
      \"transactionId\": \"$TRANSACTION_ID\",
      \"amount\": {
        \"unit\": \"XOF\",
        \"value\": 10000
      },
      \"code\": \"PRINTALMA001\",
      \"reference\": \"$REFERENCE\",
      \"metadata\": {
        \"orderId\": \"1\",
        \"orderNumber\": \"$ORDER_NUMBER\",
        \"customerName\": \"Test Client\"
      }
    }" | jq .
else
  echo "❌ Statut invalide: $STATUS"
  echo "Utilisez: SUCCESS, FAILED, ou CANCELLED"
  exit 1
fi

# Vérifier le statut après le callback
echo ""
echo "======================================"
echo "3️⃣ Statut APRÈS le callback:"
check_payment_status

echo ""
echo "======================================"
echo "4️⃣ Test de redirection (si déjà payé)"
echo "======================================"
check_payment_status

echo ""
echo "======================================"
echo "✅ Tests terminés !"
echo "======================================"
echo ""
echo "📋 Résumé:"
echo "   - Order Number: $ORDER_NUMBER"
echo "   - Status demandé: $STATUS"
echo "   - Transaction ID: $TRANSACTION_ID"
echo ""
echo "📊 Vérifiez les logs du serveur backend pour voir les détails complets"
echo ""
echo "💡 Astuces:"
echo "   - Pour tester SUCCESS: ./test-orange-callback.sh ORD-12345 SUCCESS"
echo "   - Pour tester FAILED:  ./test-orange-callback.sh ORD-12345 FAILED"
echo "   - Pour tester CANCELLED: ./test-orange-callback.sh ORD-12345 CANCELLED"
echo ""
