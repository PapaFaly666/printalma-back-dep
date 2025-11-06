#!/bin/bash

# Script pour surveiller le cron job PayDunya en temps réel

echo "🔍 Surveillance du cron job PayDunya"
echo "═════════════════════════════════════════════════════════"
echo ""

# 1. Vérifier si l'application tourne
echo "📊 1. Vérification du processus NestJS..."
if pgrep -f "node.*dist/src/main" > /dev/null; then
    echo "✅ Application NestJS en cours d'exécution"
else
    echo "❌ Application NestJS non trouvée"
    exit 1
fi

# 2. Compter les commandes en attente
echo ""
echo "📊 2. Commandes PayDunya en attente:"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

prisma.order.count({
  where: {
    paymentMethod: 'PAYDUNYA',
    paymentStatus: 'PENDING',
    status: 'PENDING',
    createdAt: { gte: twentyFourHoursAgo }
  }
}).then(count => {
  console.log('   • En attente (24h):', count);
  prisma.\$disconnect();
});
"

# 3. Vérifier les logs récents (si disponibles)
echo ""
echo "📊 3. Logs récents du cron job:"
if [ -f "logs/app.log" ]; then
    echo "   Derniers logs (10 min):"
    tail -n 50 logs/app.log 2>/dev/null | grep -i "paydunya\|cron" | tail -n 5 || echo "   Aucun log récent trouvé"
else
    echo "   Fichier de logs non trouvé"
fi

# 4. Test de disponibilité de l'API
echo ""
echo "📊 4. Test de l'API PayDunya:"
curl -s -o /dev/null -w "   • Status API: %{http_code} (temps: %{time_total}s)\n" \
    http://localhost:3004/paydunya/status/test_invalid_token || echo "   • API inaccessible"

echo ""
echo "✅ Surveillance terminée"
echo ""
echo "💡 Le cron job s'exécute automatiquement toutes les 5 minutes"
echo "   Aucune action manuelle requise"