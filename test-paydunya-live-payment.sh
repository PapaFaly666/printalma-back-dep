#!/bin/bash

# =====================================================
# Script de test pour créer un paiement PayDunya LIVE
# =====================================================
# ATTENTION: Ce script crée un VRAI paiement !
# Mode LIVE = Argent réel
# =====================================================

echo "🧪 Test de paiement PayDunya LIVE"
echo "====================================="
echo "⚠️  ATTENTION: Mode LIVE activé !"
echo "💰 Montant du test: 1000 FCFA"
echo ""

BACKEND_URL="https://printalma-back-dep.onrender.com"
TEST_AMOUNT=1000
ORDER_NUMBER="TEST-$(date +%s)"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}📦 Création de la facture PayDunya...${NC}"
echo ""

# Créer la requête JSON
PAYLOAD=$(cat <<EOF
{
  "invoice": {
    "total_amount": ${TEST_AMOUNT},
    "description": "Test de paiement PrintAlma - Commande ${ORDER_NUMBER}"
  },
  "store": {
    "name": "PrintAlma",
    "tagline": "Impression personnalisée",
    "phone": "773838585",
    "postal_address": "Dakar, Sénégal",
    "logo_url": "https://printalma-website-dep.onrender.com/logo.png"
  },
  "custom_data": {
    "order_number": "${ORDER_NUMBER}",
    "order_id": 999999,
    "test": true
  },
  "actions": {
    "callback_url": "https://printalma-back-dep.onrender.com/paydunya/webhook",
    "return_url": "https://printalma-website-dep.onrender.com/order-confirmation",
    "cancel_url": "https://printalma-website-dep.onrender.com/order-confirmation"
  }
}
EOF
)

echo "📡 Envoi de la requête à: ${BACKEND_URL}/paydunya/payment"
echo ""

# Envoyer la requête
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/paydunya/payment" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Vérifier si la réponse contient "success"
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PAIEMENT CRÉÉ AVEC SUCCÈS !${NC}"
    echo "====================================="
    echo ""

    # Extraire le token et l'URL de paiement
    TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    PAYMENT_URL=$(echo "$RESPONSE" | grep -o '"payment_url":"[^"]*"' | cut -d'"' -f4)

    if [ -z "$PAYMENT_URL" ]; then
        PAYMENT_URL=$(echo "$RESPONSE" | grep -o '"redirect_url":"[^"]*"' | cut -d'"' -f4)
    fi

    echo "📝 Numéro de commande test: ${ORDER_NUMBER}"
    echo "📝 Token de paiement: ${TOKEN}"
    echo ""
    echo -e "${BLUE}💳 URL DE PAIEMENT (COPIEZ ET OUVREZ DANS LE NAVIGATEUR):${NC}"
    echo -e "${GREEN}${PAYMENT_URL}${NC}"
    echo ""
    echo "⚠️  RAPPEL: Ceci est un VRAI paiement en mode LIVE !"
    echo "💰 Montant: ${TEST_AMOUNT} FCFA"
    echo ""
    echo "📋 Étapes suivantes:"
    echo "   1. Copiez l'URL ci-dessus"
    echo "   2. Ouvrez-la dans votre navigateur"
    echo "   3. Effectuez le paiement avec Orange Money, Wave, etc."
    echo "   4. Vérifiez la redirection vers order-confirmation"
    echo ""
    echo "🔍 Pour vérifier le statut du paiement:"
    echo "   ${BACKEND_URL}/paydunya/status/${TOKEN}"
    echo ""

    # Sauvegarder les infos dans un fichier
    echo "💾 Sauvegarde des informations dans paydunya-test-info.txt..."
    cat > paydunya-test-info.txt <<ENDFILE
Test de paiement PayDunya LIVE
Date: $(date)
Numéro de commande: ${ORDER_NUMBER}
Token: ${TOKEN}
URL de paiement: ${PAYMENT_URL}
Montant: ${TEST_AMOUNT} FCFA

Pour vérifier le statut:
${BACKEND_URL}/paydunya/status/${TOKEN}
ENDFILE
    echo -e "${GREEN}✅ Informations sauvegardées dans paydunya-test-info.txt${NC}"
    echo ""

else
    echo -e "${RED}❌ ERREUR: Échec de création du paiement${NC}"
    echo "====================================="
    echo ""
    echo "Réponse du serveur:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "💡 Causes possibles:"
    echo "   - Variables PayDunya mal configurées sur Render"
    echo "   - Le backend n'est pas démarré"
    echo "   - Problème de connexion à PayDunya"
    echo ""
    echo "🔧 Solutions:"
    echo "   1. Vérifiez la configuration PayDunya:"
    echo "      ${BACKEND_URL}/paydunya/test-config"
    echo "   2. Consultez les logs Render"
    echo "   3. Vérifiez que toutes les variables sont configurées"
    echo ""
fi
