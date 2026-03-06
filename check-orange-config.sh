#!/bin/bash

# Script de diagnostic de la configuration Orange Money

echo "🔍 Vérification de la configuration Orange Money..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier si DATABASE_URL existe
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL n'est pas définie${NC}"
  echo -e "${YELLOW}Définissez-la avec : export DATABASE_URL='postgresql://...'${NC}"
  exit 1
fi

echo -e "${BLUE}📊 Configuration PaymentConfig actuelle :${NC}"
echo ""

# Requête SQL pour vérifier la config
psql "$DATABASE_URL" -c "
SELECT
  id,
  provider,
  \"isActive\",
  \"activeMode\",
  \"testPublicKey\" IS NOT NULL as has_test_client_id,
  \"testPrivateKey\" IS NOT NULL as has_test_client_secret,
  \"testToken\" as test_merchant_code,
  \"livePublicKey\" IS NOT NULL as has_live_client_id,
  \"livePrivateKey\" IS NOT NULL as has_live_client_secret,
  \"liveToken\" as live_merchant_code,
  metadata
FROM \"PaymentConfig\"
WHERE provider = 'ORANGE_MONEY';
"

echo ""
echo -e "${BLUE}🔧 Vérification des credentials retailer :${NC}"
echo ""

psql "$DATABASE_URL" -c "
SELECT
  provider,
  \"activeMode\" as mode_actif,
  \"isActive\" as est_actif,
  metadata->>'retailerMsisdn' as retailer_msisdn,
  CASE
    WHEN metadata->>'testRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as pin_sandbox,
  CASE
    WHEN metadata->>'liveRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as pin_live
FROM \"PaymentConfig\"
WHERE provider = 'ORANGE_MONEY';
"

echo ""
echo -e "${YELLOW}📝 Si 'retailer_msisdn' ou 'pin_live' est NULL, exécutez :${NC}"
echo -e "${GREEN}./fix-orange-config.sh${NC}"
