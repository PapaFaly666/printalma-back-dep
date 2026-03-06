#!/bin/bash

# Script complet pour tester le flux de commande
# 1. Vérifie les données de la commande
# 2. Génère les mockups si nécessaire
# 3. Met à jour le statut à PAID
# 4. Envoie l'email
#
# Usage: ./test-complete-order-flow.sh <ORDER_NUMBER>

ORDER_NUMBER=$1

if [ -z "$ORDER_NUMBER" ]; then
  echo "❌ Usage: ./test-complete-order-flow.sh <ORDER_NUMBER>"
  echo "   Exemple: ./test-complete-order-flow.sh ORD-1772504166847"
  exit 1
fi

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST COMPLET DU FLUX DE COMMANDE                          ║"
echo "║  Commande: $ORDER_NUMBER"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ÉTAPE 1: Vérifier le statut
echo "📊 ÉTAPE 1: Vérification du statut de la commande"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS_RESPONSE=$(curl -s http://localhost:3004/orders/$ORDER_NUMBER/debug-status)

if [ $? -ne 0 ]; then
  echo "❌ Impossible de contacter le serveur"
  exit 1
fi

EMAIL=$(echo "$STATUS_RESPONSE" | jq -r '.data.email // "AUCUN"')
PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.paymentStatus // "UNKNOWN"')

echo "   📧 Email: $EMAIL"
echo "   💳 Statut de paiement: $PAYMENT_STATUS"
echo ""

if [ "$EMAIL" = "AUCUN" ] || [ "$EMAIL" = "null" ]; then
  echo "❌ PROBLÈME: Cette commande n'a pas d'email!"
  echo "   L'email ne pourra pas être envoyé."
  exit 1
fi

# ÉTAPE 2: Générer les mockups
echo "🎨 ÉTAPE 2: Génération des mockups"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MOCKUP_RESPONSE=$(curl -s -X POST http://localhost:3004/orders/$ORDER_NUMBER/generate-mockups \
  -H "Content-Type: application/json")

MOCKUP_SUCCESS=$(echo "$MOCKUP_RESPONSE" | jq -r '.success // false')

if [ "$MOCKUP_SUCCESS" = "true" ]; then
  echo "   ✅ Mockups générés avec succès"

  # Compter les mockups générés
  SUCCESS_COUNT=$(echo "$MOCKUP_RESPONSE" | jq '[.results[] | select(.status == "success")] | length')
  SKIP_COUNT=$(echo "$MOCKUP_RESPONSE" | jq '[.results[] | select(.status == "skipped")] | length')
  ERROR_COUNT=$(echo "$MOCKUP_RESPONSE" | jq '[.results[] | select(.status == "error")] | length')

  echo "   📊 Résumé: $SUCCESS_COUNT généré(s), $SKIP_COUNT ignoré(s), $ERROR_COUNT erreur(s)"
else
  echo "   ⚠️  Problème lors de la génération des mockups"
fi
echo ""

# ÉTAPE 3: Mettre à jour le statut à PAID
if [ "$PAYMENT_STATUS" != "PAID" ]; then
  echo "💳 ÉTAPE 3: Mise à jour du statut de paiement à PAID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3004/orders/$ORDER_NUMBER/payment-status \
    -H "Content-Type: application/json" \
    -d "{\"paymentStatus\": \"PAID\", \"transactionId\": \"manual-test-$(date +%s)\"}")

  UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success // false')

  if [ "$UPDATE_SUCCESS" = "true" ]; then
    echo "   ✅ Statut mis à jour à PAID"
    echo "   📧 L'email devrait avoir été envoyé automatiquement"
  else
    echo "   ❌ Erreur lors de la mise à jour du statut"
    echo "$UPDATE_RESPONSE" | jq '.'
    exit 1
  fi
else
  echo "💳 ÉTAPE 3: Statut de paiement déjà PAID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   ⏭️  Envoi manuel de l'email..."

  # Envoyer l'email manuellement
  EMAIL_RESPONSE=$(curl -s -X POST http://localhost:3004/orders/$ORDER_NUMBER/send-invoice)

  EMAIL_SUCCESS=$(echo "$EMAIL_RESPONSE" | jq -r '.success // false')

  if [ "$EMAIL_SUCCESS" = "true" ]; then
    echo "   ✅ Email envoyé à $EMAIL"
  else
    echo "   ❌ Erreur lors de l'envoi de l'email"
    echo "$EMAIL_RESPONSE" | jq '.'
  fi
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ TEST TERMINÉ                                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📧 Vérifiez votre boîte email: $EMAIL"
echo "   (N'oubliez pas de vérifier les spams!)"
echo ""
echo "💡 Si vous ne recevez pas l'email, vérifiez les logs du serveur backend"
echo "   pour voir les erreurs SMTP"
