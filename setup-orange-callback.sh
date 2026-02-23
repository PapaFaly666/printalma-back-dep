#!/bin/bash

echo "=========================================="
echo "🍊 CONFIGURATION CALLBACK ORANGE MONEY"
echo "=========================================="
echo ""
echo "Cette procédure enregistre votre URL de callback"
echo "auprès d'Orange Money (à faire UNE FOIS)"
echo ""

# Demander l'environnement
echo "Quel environnement ?"
echo "1) Sandbox (test)"
echo "2) Production"
read -p "Choix [1-2]: " ENV_CHOICE

if [ "$ENV_CHOICE" == "1" ]; then
  BACKEND_URL="http://localhost:3004"
  echo "📍 Mode: SANDBOX (localhost)"
elif [ "$ENV_CHOICE" == "2" ]; then
  BACKEND_URL="https://printalma-back-dep.onrender.com"
  echo "📍 Mode: PRODUCTION (Render)"
else
  echo "❌ Choix invalide"
  exit 1
fi

echo ""
echo "=========================================="
echo "1️⃣ Enregistrement du callback URL"
echo "=========================================="
echo ""
echo "URL de callback: $BACKEND_URL/orange-money/callback"
echo ""

# Enregistrer le callback
RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/register-callback")
echo "$RESPONSE" | jq '.'
echo ""

# Vérifier si succès
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo "✅ Callback URL enregistré avec succès!"
else
  echo "❌ Erreur lors de l'enregistrement"
  echo "Message: $(echo "$RESPONSE" | jq -r '.message')"
  exit 1
fi

echo ""
echo "=========================================="
echo "2️⃣ Vérification du callback URL"
echo "=========================================="
echo ""

# Vérifier le callback enregistré
VERIFY_RESPONSE=$(curl -s "$BACKEND_URL/orange-money/verify-callback")
echo "$VERIFY_RESPONSE" | jq '.'
echo ""

echo "=========================================="
echo "✅ CONFIGURATION TERMINÉE"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "   1. Les paiements Orange Money enverront maintenant"
echo "      les callbacks vers: $BACKEND_URL/orange-money/callback"
echo ""
echo "   2. Tu peux tester avec une vraie transaction"
echo ""
echo "   3. En LOCAL, utilise plutôt:"
echo "      ./simulate-om-success.sh ORDER_NUMBER"
echo ""
