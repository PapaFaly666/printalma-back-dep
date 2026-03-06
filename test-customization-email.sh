#!/bin/bash

# Script pour tester le flux complet de personnalisation avec email
# 1. Sauvegarde une personnalisation avec email client
# 2. Génère automatiquement le mockup
# 3. Envoie l'email au client
#
# Usage: ./test-customization-email.sh

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🎨 TEST COMPLET DU FLUX DE PERSONNALISATION                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
API_URL="http://localhost:3004"
PRODUCT_ID=1
COLOR_VARIATION_ID=1
VIEW_ID=1
CLIENT_EMAIL="test@example.com"  # ⚠️ Remplacez par votre email pour tester
CLIENT_NAME="Test Client"

echo "📋 Configuration:"
echo "   API: $API_URL"
echo "   Produit ID: $PRODUCT_ID"
echo "   Variation couleur ID: $COLOR_VARIATION_ID"
echo "   Vue ID: $VIEW_ID"
echo "   Email client: $CLIENT_EMAIL"
echo "   Nom client: $CLIENT_NAME"
echo ""

# Données de personnalisation
# Format simplifié avec un élément de texte
CUSTOMIZATION_DATA=$(cat <<EOF
{
  "productId": $PRODUCT_ID,
  "colorVariationId": $COLOR_VARIATION_ID,
  "viewId": $VIEW_ID,
  "clientEmail": "$CLIENT_EMAIL",
  "clientName": "$CLIENT_NAME",
  "sessionId": "test-session-$(date +%s)",
  "designElements": [
    {
      "id": "text-1",
      "type": "text",
      "text": "Mon Design Personnalisé",
      "x": 0.5,
      "y": 0.5,
      "width": 300,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "bold",
      "textAlign": "center"
    }
  ]
}
EOF
)

echo "📤 ÉTAPE 1: Sauvegarde de la personnalisation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/customization/upsert" \
  -H "Content-Type: application/json" \
  -d "$CUSTOMIZATION_DATA")

if [ $? -ne 0 ]; then
  echo "❌ Impossible de contacter le serveur"
  exit 1
fi

echo "📊 Réponse du serveur:"
echo "$RESPONSE" | jq '.'
echo ""

# Vérifier le succès
CUSTOMIZATION_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
PREVIEW_IMAGE=$(echo "$RESPONSE" | jq -r '.previewImageUrl // empty')

if [ -z "$CUSTOMIZATION_ID" ]; then
  echo "❌ ERREUR: La personnalisation n'a pas été créée"
  echo ""
  echo "💡 Vérifications:"
  echo "   1. Le serveur backend est-il démarré?"
  echo "   2. Le productId $PRODUCT_ID existe-t-il?"
  echo "   3. Le colorVariationId $COLOR_VARIATION_ID existe-t-il?"
  exit 1
fi

echo "✅ Personnalisation créée avec succès!"
echo "   ID: $CUSTOMIZATION_ID"
if [ -n "$PREVIEW_IMAGE" ] && [ "$PREVIEW_IMAGE" != "null" ]; then
  echo "   Mockup généré: $PREVIEW_IMAGE"
else
  echo "   ⚠️  Mockup non généré (normal si le produit n'a pas d'image de base)"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ TEST TERMINÉ                                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📧 Vérifiez votre boîte email: $CLIENT_EMAIL"
echo "   (N'oubliez pas de vérifier les spams!)"
echo ""
echo "💡 Si vous ne recevez pas l'email:"
echo "   1. Vérifiez les logs du serveur backend pour voir les erreurs SMTP"
echo "   2. Assurez-vous que les variables d'environnement SMTP sont configurées"
echo "   3. Vérifiez que l'email $CLIENT_EMAIL est valide"
echo ""
echo "🔍 Pour voir les détails de la personnalisation:"
echo "   GET $API_URL/customization/$CUSTOMIZATION_ID"
echo ""
