#!/bin/bash

# Script pour générer manuellement les mockups d'une commande
# Usage: ./test-generate-mockup.sh <ORDER_NUMBER>

ORDER_NUMBER=$1

if [ -z "$ORDER_NUMBER" ]; then
  echo "❌ Usage: ./test-generate-mockup.sh <ORDER_NUMBER>"
  echo "   Exemple: ./test-generate-mockup.sh ORD-1772504166847"
  exit 1
fi

echo "🎨 Génération des mockups pour la commande $ORDER_NUMBER..."
echo ""

# Appeler l'endpoint de génération
RESPONSE=$(curl -s -X POST http://localhost:3004/orders/$ORDER_NUMBER/generate-mockups \
  -H "Content-Type: application/json")

echo "📊 Résultat:"
echo "$RESPONSE" | jq '.'
echo ""

# Vérifier le succès
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Génération terminée!"
  echo ""

  # Afficher les résultats pour chaque item
  RESULTS=$(echo "$RESPONSE" | jq -c '.results[]')

  echo "📦 Détails par item:"
  echo "$RESULTS" | while IFS= read -r result; do
    ITEM_ID=$(echo "$result" | jq -r '.itemId')
    STATUS=$(echo "$result" | jq -r '.status')

    if [ "$STATUS" = "success" ]; then
      MOCKUP_URL=$(echo "$result" | jq -r '.mockupUrl')
      echo "  ✅ Item $ITEM_ID: Mockup généré"
      echo "     URL: $MOCKUP_URL"
    elif [ "$STATUS" = "skipped" ]; then
      REASON=$(echo "$result" | jq -r '.reason')
      echo "  ⏭️  Item $ITEM_ID: Ignoré ($REASON)"
    else
      REASON=$(echo "$result" | jq -r '.reason')
      echo "  ❌ Item $ITEM_ID: Erreur ($REASON)"
    fi
  done

  echo ""
  echo "💡 Les mockups ont été sauvegardés dans la base de données"
  echo "   Vous pouvez maintenant envoyer l'email avec:"
  echo "   ./test-send-email.sh $ORDER_NUMBER"

else
  echo "❌ Erreur lors de la génération"
fi
