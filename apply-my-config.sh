#!/bin/bash

# Script d'application automatique de votre configuration retailer
# Numéro: 221775588834
# PIN: 6667

echo "🔧 Configuration de votre compte retailer Orange Money..."
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
  echo ""
  echo "Ou exécutez directement le fichier SQL :"
  echo "psql votre_database < setup-my-retailer.sql"
  exit 1
fi

echo -e "${BLUE}📝 Application de la configuration...${NC}"
echo ""

# Exécuter le script SQL
psql "$DATABASE_URL" -f setup-my-retailer.sql

echo ""
echo -e "${GREEN}✅ Configuration appliquée !${NC}"
echo ""
echo -e "${BLUE}🧪 Testez maintenant :${NC}"
echo ""
echo "1. Test de connexion :"
echo "   curl http://localhost:3004/orange-money/test-connection | jq"
echo ""
echo "2. Test Cash In (petit montant) :"
echo "   curl -X POST 'http://localhost:3004/orange-money/cashin' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{
      \"amount\": 100,
      \"customerPhone\": \"221771234567\",
      \"customerName\": \"Test User\",
      \"description\": \"Test\"
    }' | jq"
echo ""
