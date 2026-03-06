#!/bin/bash

# Script automatique pour configurer les credentials Orange Money Retailer

echo "🔧 Configuration automatique des credentials Orange Money Retailer"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL n'est pas définie${NC}"
  echo ""
  echo "Définissez-la avec :"
  echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
  exit 1
fi

echo -e "${YELLOW}⚠️  Vous allez configurer les credentials du compte RETAILER Orange Money${NC}"
echo -e "${YELLOW}   (Le compte qui envoie l'argent aux vendeurs)${NC}"
echo ""

# Demander les credentials
read -p "Entrez le MSISDN du retailer (ex: 221781234567): " MSISDN
if [ -z "$MSISDN" ]; then
  echo -e "${RED}❌ MSISDN requis${NC}"
  exit 1
fi

read -sp "Entrez le PIN du retailer (4 chiffres): " PIN
echo ""
if [ -z "$PIN" ]; then
  echo -e "${RED}❌ PIN requis${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}📝 Configuration des credentials...${NC}"

# Mise à jour SQL
psql "$DATABASE_URL" << EOF
-- Ajouter le MSISDN
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"$MSISDN"'
)
WHERE provider = 'ORANGE_MONEY';

-- Ajouter le PIN pour test et live
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  jsonb_set(
    metadata,
    '{testRetailerPin}',
    '"$PIN"'
  ),
  '{liveRetailerPin}',
  '"$PIN"'
)
WHERE provider = 'ORANGE_MONEY';

-- Vérification
SELECT
  provider,
  "activeMode",
  metadata->>'retailerMsisdn' as msisdn,
  CASE
    WHEN metadata->>'testRetailerPin' IS NOT NULL THEN '✅'
    ELSE '❌'
  END as pin_test,
  CASE
    WHEN metadata->>'liveRetailerPin' IS NOT NULL THEN '✅'
    ELSE '❌'
  END as pin_live
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';
EOF

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes :${NC}"
echo "1. Testez la connexion : curl http://localhost:3004/orange-money/test-connection"
echo "2. Testez un Cash In avec un petit montant"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT pour la PRODUCTION :${NC}"
echo "   Le PIN doit être crypté avec la clé publique RSA d'Orange Money !"
echo "   Voir : CONFIGURATION_ORANGE_RETAILER.md"
