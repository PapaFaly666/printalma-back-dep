#!/bin/bash

# Script pour simuler un callback Orange Money SUCCESS en local
# Usage: ./simulate-om-success.sh ORD-1771805528447

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <ORDER_NUMBER>"
  echo "   Exemple: $0 ORD-1771805528447"
  exit 1
fi

ORDER_NUMBER=$1
echo "🍊 Simulation callback SUCCESS pour: $ORDER_NUMBER"

# Récupérer le transactionId actuel
CURRENT=$(curl -s "http://localhost:3004/orange-money/payment-status/$ORDER_NUMBER")
REFERENCE=$(echo "$CURRENT" | jq -r '.transactionId')

echo "   Référence actuelle: $REFERENCE"

# Envoyer le callback SUCCESS
curl -X POST "http://localhost:3004/orange-money/callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"SUCCESS\",
    \"transactionId\": \"TXN-OM-REAL-$(date +%s)\",
    \"amount\": {
      \"unit\": \"XOF\",
      \"value\": 2000
    },
    \"code\": \"PRINTALMA001\",
    \"reference\": \"$REFERENCE\",
    \"metadata\": {
      \"orderNumber\": \"$ORDER_NUMBER\",
      \"customerName\": \"Test Client\"
    }
  }" 2>/dev/null

echo ""
echo "⏳ Attente du traitement (3s)..."
sleep 3

# Vérifier le résultat
echo ""
echo "📊 Statut après callback:"
curl -s "http://localhost:3004/orange-money/payment-status/$ORDER_NUMBER" | jq '{paymentStatus, transactionId, shouldRedirect}'

echo ""
echo "✅ Done!"
