#!/bin/bash

# =====================================================
# Script de test pour vérifier la configuration Render
# =====================================================

echo "🧪 Test de configuration PrintAlma sur Render"
echo "=============================================="
echo ""

BACKEND_URL="https://printalma-back-dep.onrender.com"
FRONTEND_URL="https://printalma-website-dep.onrender.com"

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================================================
# Test 1: Vérifier que le backend est accessible
# =====================================================
echo "📡 Test 1: Accessibilité du backend..."
if curl -s --head --request GET "$BACKEND_URL" | grep "200\|301\|302" > /dev/null; then
   echo -e "${GREEN}✅ Backend accessible${NC}"
else
   echo -e "${RED}❌ Backend inaccessible${NC}"
fi
echo ""

# =====================================================
# Test 2: Tester la configuration PayDunya
# =====================================================
echo "💳 Test 2: Configuration PayDunya..."
PAYDUNYA_CONFIG=$(curl -s "$BACKEND_URL/paydunya/test-config")

if echo "$PAYDUNYA_CONFIG" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PayDunya configuré${NC}"

    # Vérifier le mode
    if echo "$PAYDUNYA_CONFIG" | grep -q '"mode":"live"'; then
        echo -e "${YELLOW}⚠️  Mode LIVE activé (vrais paiements)${NC}"
    else
        echo -e "${GREEN}📝 Mode TEST activé${NC}"
    fi

    # Vérifier les clés
    if echo "$PAYDUNYA_CONFIG" | grep -q '"hasMasterKey":true'; then
        echo -e "${GREEN}✅ Master Key présente${NC}"
    fi
    if echo "$PAYDUNYA_CONFIG" | grep -q '"hasPrivateKey":true'; then
        echo -e "${GREEN}✅ Private Key présente${NC}"
    fi
    if echo "$PAYDUNYA_CONFIG" | grep -q '"hasToken":true'; then
        echo -e "${GREEN}✅ Token présent${NC}"
    fi
else
    echo -e "${RED}❌ PayDunya mal configuré${NC}"
    echo "Réponse: $PAYDUNYA_CONFIG"
fi
echo ""

# =====================================================
# Test 3: Vérifier le frontend
# =====================================================
echo "🌐 Test 3: Accessibilité du frontend..."
if curl -s --head --request GET "$FRONTEND_URL" | grep "200\|301\|302" > /dev/null; then
   echo -e "${GREEN}✅ Frontend accessible${NC}"
else
   echo -e "${RED}❌ Frontend inaccessible${NC}"
fi
echo ""

# =====================================================
# Test 4: Test de connectivité PayDunya
# =====================================================
echo "🌍 Test 4: Connectivité PayDunya API..."
NETWORK_TEST=$(curl -s "$BACKEND_URL/paydunya/network-test")

if echo "$NETWORK_TEST" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Connexion à PayDunya OK${NC}"

    # Afficher le temps de réponse
    RESPONSE_TIME=$(echo "$NETWORK_TEST" | grep -o '"responseTime":[0-9]*' | cut -d':' -f2)
    if [ ! -z "$RESPONSE_TIME" ]; then
        echo "   Temps de réponse: ${RESPONSE_TIME}ms"
    fi
else
    echo -e "${RED}❌ Impossible de se connecter à PayDunya${NC}"
    echo "Réponse: $NETWORK_TEST"
fi
echo ""

# =====================================================
# Test 5: Vérifier les endpoints principaux
# =====================================================
echo "🔍 Test 5: Endpoints principaux..."

# Test API docs
if curl -s --head "$BACKEND_URL/api-docs" | grep "200\|301\|302" > /dev/null; then
   echo -e "${GREEN}✅ Swagger docs accessible${NC}"
else
   echo -e "${YELLOW}⚠️  Swagger docs non accessible${NC}"
fi

echo ""

# =====================================================
# Résumé
# =====================================================
echo "=============================================="
echo "📊 Résumé des tests"
echo "=============================================="
echo ""
echo "URLs configurées:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "Pour tester manuellement:"
echo "  1. Configuration PayDunya: $BACKEND_URL/paydunya/test-config"
echo "  2. Documentation API: $BACKEND_URL/api-docs"
echo "  3. Frontend: $FRONTEND_URL"
echo ""
echo "Pour voir les logs en direct:"
echo "  1. Backend: https://dashboard.render.com → printalma-back-dep → Logs"
echo "  2. Frontend: Console du navigateur (F12)"
echo ""
