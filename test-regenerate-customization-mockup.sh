#!/bin/bash

# Script pour régénérer le mockup d'une personnalisation existante
# Usage: ./test-regenerate-customization-mockup.sh <CUSTOMIZATION_ID>

CUSTOMIZATION_ID=$1

if [ -z "$CUSTOMIZATION_ID" ]; then
  echo "❌ Usage: ./test-regenerate-customization-mockup.sh <CUSTOMIZATION_ID>"
  echo ""
  echo "Exemple:"
  echo "  ./test-regenerate-customization-mockup.sh 123"
  echo ""
  echo "💡 Pour trouver l'ID d'une personnalisation:"
  echo "   psql \$DATABASE_URL -c \"SELECT id, product_id, client_email, final_image_url_custom FROM product_customizations ORDER BY id DESC LIMIT 10;\""
  exit 1
fi

API_URL="http://localhost:3004"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🔄 RÉGÉNÉRATION MOCKUP PERSONNALISATION                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   API: $API_URL"
echo "   Customization ID: $CUSTOMIZATION_ID"
echo ""

# 1. Vérifier l'état actuel
echo "📊 ÉTAPE 1: Vérification de l'état actuel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CURRENT_STATE=$(psql $DATABASE_URL -t -c "SELECT final_image_url_custom FROM product_customizations WHERE id = $CUSTOMIZATION_ID;")

if [ -z "$CURRENT_STATE" ]; then
  echo "❌ Personnalisation $CUSTOMIZATION_ID introuvable"
  exit 1
fi

CURRENT_STATE=$(echo "$CURRENT_STATE" | xargs)  # Trim whitespace

if [ "$CURRENT_STATE" = "" ] || [ "$CURRENT_STATE" = "null" ]; then
  echo "⚠️  finalImageUrlCustom est actuellement: NULL"
else
  echo "📸 finalImageUrlCustom actuel: $CURRENT_STATE"
fi
echo ""

# 2. Lancer la régénération
echo "🔄 ÉTAPE 2: Lancement de la régénération"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Génération en cours (cela peut prendre 10-30 secondes)..."
echo ""

REGEN_RESPONSE=$(curl -s -X POST "$API_URL/customizations/$CUSTOMIZATION_ID/regenerate-mockup" \
  -H "Content-Type: application/json")

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la communication avec le serveur"
  exit 1
fi

echo "📊 Résultat de la régénération:"
echo "$REGEN_RESPONSE" | jq '.'
echo ""

# Vérifier le succès
SUCCESS=$(echo "$REGEN_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  FINAL_IMAGE=$(echo "$REGEN_RESPONSE" | jq -r '.finalImageUrlCustom // "null"')

  echo "✅ Régénération réussie!"
  echo ""
  echo "🖼️ Image finale générée:"
  echo "   $FINAL_IMAGE"
  echo ""
else
  ERROR_MESSAGE=$(echo "$REGEN_RESPONSE" | jq -r '.message // "Erreur inconnue"')
  echo "❌ Échec de la régénération"
  echo "   Message: $ERROR_MESSAGE"
  exit 1
fi

# 3. Vérifier dans la base de données
echo "📊 ÉTAPE 3: Vérification dans la base de données"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 1  # Attendre que la BD soit à jour

NEW_STATE=$(psql $DATABASE_URL -t -c "SELECT final_image_url_custom FROM product_customizations WHERE id = $CUSTOMIZATION_ID;")
NEW_STATE=$(echo "$NEW_STATE" | xargs)

echo "📸 finalImageUrlCustom dans la BD:"
echo "   $NEW_STATE"
echo ""

if [ "$NEW_STATE" != "" ] && [ "$NEW_STATE" != "null" ]; then
  echo "✅ Le champ finalImageUrlCustom est bien rempli dans la base de données!"
else
  echo "❌ Le champ finalImageUrlCustom est toujours NULL dans la base de données"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ TEST TERMINÉ                                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Pour voir toutes les personnalisations avec leur mockup:"
echo "   psql \$DATABASE_URL -c \"SELECT id, client_email, final_image_url_custom FROM product_customizations WHERE final_image_url_custom IS NOT NULL LIMIT 10;\""
echo ""
