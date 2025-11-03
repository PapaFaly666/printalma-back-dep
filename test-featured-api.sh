#!/bin/bash

# Script de test pour l'API Featured Themes
# Ce script teste la conversion automatique des IDs string -> number

echo "=== Test de l'API Featured Themes ==="
echo ""

# 1. Se connecter et récupérer le cookie
echo "1. Connexion en tant qu'admin..."
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "pfdiagne35@gmail.com", "password": "printalmatest123"}' \
  -c cookies.txt \
  -s > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Connexion réussie"
else
  echo "❌ Échec de la connexion"
  exit 1
fi

echo ""

# 2. Récupérer les catégories disponibles
echo "2. Récupération des catégories disponibles..."
CATEGORIES=$(curl -s http://localhost:3004/design-categories/active)
echo "Catégories trouvées:"
echo "$CATEGORIES" | jq -r '.[] | "\(.id) - \(.name)"' | head -5

echo ""

# 3. Test avec des IDs sous forme de strings (comme envoyé par le frontend)
echo "3. Test PUT avec IDs en strings (simulation frontend)..."
RESPONSE=$(curl -X PUT http://localhost:3004/design-categories/admin/featured \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"categoryIds": ["1", "3"]}' \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status HTTP: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Succès! Les IDs strings ont été convertis en nombres"
  echo "Réponse:"
  echo "$BODY" | jq '.'
else
  echo "❌ Échec"
  echo "Réponse:"
  echo "$BODY" | jq '.'
fi

echo ""

# 4. Vérifier que la configuration a été appliquée
echo "4. Vérification de la configuration (endpoint public)..."
FEATURED=$(curl -s http://localhost:3004/design-categories/featured)
echo "Thèmes en vedette:"
echo "$FEATURED" | jq -r '.[] | "\(.featuredOrder): \(.name) (ID: \(.id))"'

if [ $(echo "$FEATURED" | jq 'length') -gt 0 ]; then
  echo "✅ Configuration appliquée avec succès!"
else
  echo "⚠️  Aucun thème featured (peut-être une erreur précédente)"
fi

# Nettoyage
rm -f cookies.txt

echo ""
echo "=== Test terminé ==="
