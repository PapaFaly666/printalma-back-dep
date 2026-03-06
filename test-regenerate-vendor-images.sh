#!/bin/bash

# Script pour tester la régénération des images finales d'un produit vendeur
# Usage: ./test-regenerate-vendor-images.sh <VENDOR_PRODUCT_ID> <JWT_TOKEN>

VENDOR_PRODUCT_ID=$1
JWT_TOKEN=$2

if [ -z "$VENDOR_PRODUCT_ID" ] || [ -z "$JWT_TOKEN" ]; then
  echo "❌ Usage: ./test-regenerate-vendor-images.sh <VENDOR_PRODUCT_ID> <JWT_TOKEN>"
  echo ""
  echo "Exemple:"
  echo "  ./test-regenerate-vendor-images.sh 123 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  echo ""
  echo "Pour obtenir un JWT_TOKEN:"
  echo "  1. Connectez-vous sur le frontend"
  echo "  2. Ouvrez la console du navigateur"
  echo "  3. Tapez: localStorage.getItem('token')"
  exit 1
fi

API_URL="http://localhost:3004"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🔄 RÉGÉNÉRATION DES IMAGES FINALES                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   API: $API_URL"
echo "   Produit vendeur ID: $VENDOR_PRODUCT_ID"
echo ""

# 1. Vérifier le statut actuel des images
echo "📊 ÉTAPE 1: Vérification du statut actuel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STATUS_RESPONSE=$(curl -s "$API_URL/vendor/products/$VENDOR_PRODUCT_ID/images-status" \
  -H "Authorization: Bearer $JWT_TOKEN")

if [ $? -ne 0 ]; then
  echo "❌ Impossible de contacter le serveur"
  exit 1
fi

echo "📊 Statut actuel:"
echo "$STATUS_RESPONSE" | jq '.'
echo ""

TOTAL_EXPECTED=$(echo "$STATUS_RESPONSE" | jq -r '.imagesGeneration.totalExpected // 0')
TOTAL_GENERATED=$(echo "$STATUS_RESPONSE" | jq -r '.imagesGeneration.totalGenerated // 0')

echo "📈 Résumé:"
echo "   Images attendues: $TOTAL_EXPECTED"
echo "   Images générées: $TOTAL_GENERATED"
echo ""

# 2. Lancer la régénération
echo "🔄 ÉTAPE 2: Lancement de la régénération"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Génération en cours (cela peut prendre 30s - 2min)..."
echo ""

REGEN_RESPONSE=$(curl -s -X POST "$API_URL/vendor/products/$VENDOR_PRODUCT_ID/regenerate-final-images" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la régénération"
  exit 1
fi

echo "📊 Résultat de la régénération:"
echo "$REGEN_RESPONSE" | jq '.'
echo ""

# Vérifier le succès
SUCCESS=$(echo "$REGEN_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  COLORS_PROCESSED=$(echo "$REGEN_RESPONSE" | jq -r '.result.colorsProcessed // 0')
  TOTAL_COLORS=$(echo "$REGEN_RESPONSE" | jq -r '.result.totalColors // 0')
  TOTAL_TIME=$(echo "$REGEN_RESPONSE" | jq -r '.result.totalGenerationTime // 0')
  AVG_TIME=$(echo "$REGEN_RESPONSE" | jq -r '.result.averageTimePerColor // 0')

  echo "✅ Régénération réussie!"
  echo ""
  echo "📊 Statistiques:"
  echo "   Couleurs traitées: $COLORS_PROCESSED/$TOTAL_COLORS"
  echo "   Temps total: ${TOTAL_TIME}ms"
  echo "   Temps moyen par couleur: ${AVG_TIME}ms"
  echo ""

  # Afficher les URLs générées
  echo "🖼️ Images générées:"
  echo "$REGEN_RESPONSE" | jq -r '.result.generatedImages[] | "   Couleur \(.colorId): \(.url)"'
  echo ""
else
  echo "❌ Échec de la régénération"
  echo "$REGEN_RESPONSE" | jq '.'
  exit 1
fi

# 3. Vérifier le statut après régénération
echo "📊 ÉTAPE 3: Vérification du statut après régénération"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 2  # Attendre 2 secondes pour que la BD soit à jour

FINAL_STATUS=$(curl -s "$API_URL/vendor/products/$VENDOR_PRODUCT_ID/images-status" \
  -H "Authorization: Bearer $JWT_TOKEN")

FINAL_GENERATED=$(echo "$FINAL_STATUS" | jq -r '.imagesGeneration.totalGenerated // 0')
ALL_GENERATED=$(echo "$FINAL_STATUS" | jq -r '.imagesGeneration.allGenerated // false')

echo "📊 Statut final:"
echo "   Images générées: $FINAL_GENERATED/$TOTAL_EXPECTED"
echo "   Toutes générées: $ALL_GENERATED"
echo ""

if [ "$ALL_GENERATED" = "true" ]; then
  echo "✅ Toutes les images finales ont été générées avec succès!"
else
  echo "⚠️ Certaines images n'ont pas été générées"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ TEST TERMINÉ                                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Pour voir les détails du produit:"
echo "   GET $API_URL/vendor/products/$VENDOR_PRODUCT_ID"
echo ""
