#!/bin/bash

# Script pour mettre à jour le statut de paiement d'une commande
# Usage: ./test-update-payment-status.sh <ORDER_NUMBER>

ORDER_NUMBER=$1

if [ -z "$ORDER_NUMBER" ]; then
  echo "❌ Usage: ./test-update-payment-status.sh <ORDER_NUMBER>"
  echo "   Exemple: ./test-update-payment-status.sh ORD-1772504166847"
  exit 1
fi

echo "🔍 Vérification du statut actuel de la commande $ORDER_NUMBER..."
echo ""

# Vérifier le statut via l'endpoint debug
STATUS_RESPONSE=$(curl -s http://localhost:3004/orders/$ORDER_NUMBER/debug-status)

echo "📊 Statut actuel:"
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Extraire le statut de paiement
PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.paymentStatus // "UNKNOWN"')

echo "💳 Statut de paiement actuel: $PAYMENT_STATUS"
echo ""

if [ "$PAYMENT_STATUS" = "PAID" ]; then
  echo "✅ La commande est déjà PAID - L'email devrait avoir été envoyé"
  echo "   Vérifiez votre boîte email (spam inclus)"
  exit 0
fi

echo "⚠️  Le statut est '$PAYMENT_STATUS' - L'email NE SERA PAS envoyé"
echo ""
echo "💡 Pour tester l'envoi d'email, mettons à jour le statut à PAID..."
echo ""

read -p "Voulez-vous mettre à jour le statut à PAID maintenant? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]; then
  echo "❌ Annulé"
  exit 0
fi

echo "📤 Mise à jour du statut à PAID..."
echo ""

# Mettre à jour le statut
UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3004/orders/$ORDER_NUMBER/payment-status \
  -H "Content-Type: application/json" \
  -d "{\"paymentStatus\": \"PAID\", \"transactionId\": \"manual-test-$(date +%s)\"}")

echo "📊 Réponse de la mise à jour:"
echo "$UPDATE_RESPONSE" | jq '.'
echo ""

# Vérifier si l'email a été envoyé
SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Statut mis à jour avec succès!"
  echo ""
  echo "📧 L'email devrait avoir été envoyé automatiquement."
  echo "   Vérifiez votre boîte email (et les spams)"
  echo ""
  echo "💡 Si vous ne recevez toujours pas l'email, vérifiez les logs du serveur backend"
else
  echo "❌ Erreur lors de la mise à jour"
fi
