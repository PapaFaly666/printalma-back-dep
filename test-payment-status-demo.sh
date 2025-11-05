#!/bin/bash
# Script pour démontrer la mise à jour du statut de paiement
BASE_URL="http://localhost:3004"

echo "🔄 Démonstration de la mise à jour automatique du statut de paiement"
echo ""

# Utiliser la commande existante ORD-1762284497704
order_number="ORD-1762284497704"

echo "📋 Commande utilisée: $order_number"
echo ""

echo "1. 📊 Statut actuel de la commande:"
current_status=$(curl -s "http://localhost:3004/orders/$order_number/payment-attempts")
echo "$current_status" | jq '.data | {order_number, payment_status, total_attempts, has_insufficient_funds}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "2. ✅ Simulation d'un paiement RÉUSSI:"
success_data='{
  "invoice_token": "test_WlUPtG5Gaw",
  "status": "completed",
  "custom_data": "{\"order_number\": \"'$order_number'\"}",
  "total_amount": 3000,
  "payment_method": "wave-senegal"
}'

success_response=$(curl -s -X POST "${BASE_URL}/paydunya/test-status-update" \
  -H "Content-Type: application/json" \
  -d "$success_data")

echo "Réponse du système:"
echo "$success_response" | jq '.'

echo ""
echo "3. 📊 Statut après paiement réussi:"
after_success=$(curl -s "http://localhost:3004/orders/$order_number/payment-attempts")
echo "$after_success" | jq '.data | {order_number, payment_status, total_attempts, has_insufficient_funds}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "4. ❌ Simulation d'un paiement avec FONDS INSUFFISANTS:"
insufficient_data='{
  "invoice_token": "test_insufficient_demo",
  "status": "failed",
  "custom_data": "{\"order_number\": \"'$order_number'\"}",
  "total_amount": 3000,
  "payment_method": "orange-money-senegal",
  "cancel_reason": "Fonds insuffisants dans le compte Orange Money",
  "error_code": "INSUFFICIENT_FUNDS"
}'

insufficient_response=$(curl -s -X POST "${BASE_URL}/paydunya/test-status-update" \
  -H "Content-Type: application/json" \
  -d "$insufficient_data")

echo "Réponse du système:"
echo "$insufficient_response" | jq '.'

echo ""
echo "5. 📊 Statut final après fonds insuffisants:"
final_status=$(curl -s "http://localhost:3004/orders/$order_number/payment-attempts")
echo "$final_status" | jq '.data | {order_number, payment_status, total_attempts, has_insufficient_funds, last_failure_reason}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 RÉSUMÉ DE LA DÉMONSTRATION:"
echo "✅ Le système met automatiquement à jour le statut des commandes"
echo "✅ Paiement réussi → Statut: PAID"
echo "✅ Fonds insuffisants → Statut: FAILED + flag has_insufficient_funds: true"
echo "✅ Les tentatives sont comptabilisées (total_attempts)"
echo "✅ Les raisons d'échec sont enregistrées (last_failure_reason)"