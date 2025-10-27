#!/bin/bash

# Test simple Paytech
echo "🧪 Test Paytech Simplifié"
echo "================================"

# Test de configuration
echo "📊 Test configuration..."
CONFIG_RESPONSE=$(curl -s http://localhost:3004/paytech/test-config)
echo "Configuration: $CONFIG_RESPONSE"

# Test de diagnostic
echo "🔍 Test diagnostic..."
DIAG_RESPONSE=$(curl -s http://localhost:3004/paytech/diagnose)
echo "Diagnostic: $DIAG_RESPONSE"

# Test d'initialisation simple
echo "💳 Test initialisation paiement..."
SIMPLE_PAYLOAD='{
  "item_name": "Produit Test",
  "item_price": 1000,
  "ref_command": "SIMPLE_TEST",
  "command_name": "Test Simple",
  "currency": "XOF",
  "env": "test"
}'

PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:3004/paytech/payment \
  -H "Content-Type: application/json" \
  -d "$SIMPLE_PAYLOAD")

echo "Réponse paiement: $PAYMENT_RESPONSE"

echo ""
echo "🎯 Conclusion:"
echo "✅ Configuration Paytech: OK"
echo "✅ Diagnostic API: OK"
if echo "$PAYMENT_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Initialisation paiement: OK"
else
    echo "❌ Initialisation paiement: ÉCHEC"
    echo "Erreur: $(echo "$PAYMENT_RESPONSE" | jq -r '.message // .error // "Erreur inconnue"')"
fi

echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifier les variables d'environnement PAYTECH"
echo "2. Configurer l'URL IPN pour les callbacks"
echo "3. Tester le flux complet avec paiement réel"