#!/bin/bash

# Script de test pour l'API Designers
# Usage: ./test-designers-api.sh [JWT_TOKEN]

BASE_URL="http://localhost:3004"
JWT_TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"

echo "🧪 Tests de l'API Designers - PrintAlma"
echo "========================================"
echo ""

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
    echo ""
}

# 1. Test Health Check
echo "1️⃣  Test Health Check (GET /designers/health)"
echo "---------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/designers/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "$BODY" | jq '.'
    print_result 0 "Health check OK"
else
    echo "HTTP Code: $HTTP_CODE"
    echo "$BODY"
    print_result 1 "Health check échoué"
fi

# 2. Test Liste des designers (Public - Featured)
echo "2️⃣  Test Liste des designers en vedette (GET /designers/featured)"
echo "----------------------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/designers/featured")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "$BODY" | jq '.'
    print_result 0 "Liste des designers en vedette récupérée"
else
    echo "HTTP Code: $HTTP_CODE"
    echo "$BODY"
    print_result 1 "Échec de la récupération"
fi

# 3. Test Liste tous les designers (Admin)
echo "3️⃣  Test Liste tous les designers - Admin (GET /designers/admin)"
echo "---------------------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $JWT_TOKEN" "$BASE_URL/designers/admin")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "$BODY" | jq '.'
    print_result 0 "Liste complète récupérée (admin)"
else
    echo "HTTP Code: $HTTP_CODE"
    echo "$BODY"
    print_result 1 "Échec - Vérifiez votre token JWT"
fi

# 4. Test Création d'un designer (Admin)
echo "4️⃣  Test Création d'un designer - Admin (POST /designers/admin)"
echo "--------------------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/designers/admin" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "name=Designer Test" \
  -F "displayName=Test Designer" \
  -F "bio=Ceci est un designer de test créé par le script" \
  -F "isActive=true" \
  -F "sortOrder=100")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "$BODY" | jq '.'
    DESIGNER_ID=$(echo "$BODY" | jq -r '.id')
    print_result 0 "Designer créé avec succès (ID: $DESIGNER_ID)"

    # 5. Test Modification du designer créé
    echo "5️⃣  Test Modification du designer - Admin (PUT /designers/admin/$DESIGNER_ID)"
    echo "--------------------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/designers/admin/$DESIGNER_ID" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -F "name=Designer Test Modifié" \
      -F "bio=Bio mise à jour par le script de test")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "$BODY" | jq '.'
        print_result 0 "Designer modifié avec succès"
    else
        echo "HTTP Code: $HTTP_CODE"
        echo "$BODY"
        print_result 1 "Échec de la modification"
    fi

    # 6. Test Suppression du designer créé
    echo "6️⃣  Test Suppression du designer - Admin (DELETE /designers/admin/$DESIGNER_ID)"
    echo "----------------------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/designers/admin/$DESIGNER_ID" \
      -H "Authorization: Bearer $JWT_TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "204" ]; then
        print_result 0 "Designer supprimé avec succès"
    else
        echo "HTTP Code: $HTTP_CODE"
        print_result 1 "Échec de la suppression"
    fi
else
    echo "HTTP Code: $HTTP_CODE"
    echo "$BODY"
    print_result 1 "Échec de la création - Tests 5 et 6 ignorés"
fi

# 7. Test Mise à jour des designers en vedette (Admin)
echo "7️⃣  Test Mise à jour des designers en vedette (PUT /designers/featured/update)"
echo "----------------------------------------------------------------------------"

# D'abord, récupérer les IDs des 6 premiers designers
RESPONSE=$(curl -s "$BASE_URL/designers/admin" -H "Authorization: Bearer $JWT_TOKEN")
DESIGNER_IDS=$(echo "$RESPONSE" | jq -r '.designers[0:6] | map(.id | tostring) | join(",")')

if [ ! -z "$DESIGNER_IDS" ]; then
    # Convertir en tableau JSON
    IDS_ARRAY="[\"$(echo $DESIGNER_IDS | sed 's/,/","/g')\"]"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/designers/featured/update" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"designerIds\": $IDS_ARRAY}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "$BODY" | jq '.'
        print_result 0 "Designers en vedette mis à jour"
    else
        echo "HTTP Code: $HTTP_CODE"
        echo "$BODY"
        print_result 1 "Échec de la mise à jour des featured"
    fi
else
    print_result 1 "Impossible de récupérer les IDs des designers"
fi

echo ""
echo "🎉 Tests terminés!"
echo ""
echo -e "${YELLOW}💡 Note: Pour exécuter ces tests avec votre token JWT:${NC}"
echo -e "${YELLOW}   ./test-designers-api.sh YOUR_ACTUAL_JWT_TOKEN${NC}"
