#!/bin/bash

echo "🔍 Test de statut Paydunya pour commande ORD-1762289363759"
echo "=========================================================="

# Attendre que le serveur soit prêt
echo "⏳ Attente du serveur..."
sleep 5

# Vérifier si le serveur répond
echo ""
echo "1️⃣ Vérification du serveur :"
curl -s "http://localhost:3004/" | head -c 50
echo "..."

# Vérifier le statut de la commande par ID
echo ""
echo "2️⃣ Statut de la commande (ID: 41) :"
curl -s "http://localhost:3004/orders/41" | jq -c '{id, orderNumber, status, paymentStatus, paymentMethod, totalAmount}' 2>/dev/null || echo "❌ Erreur de récupération"

# Vérifier le statut Paydunya par token
echo ""
echo "3️⃣ Statut Paydunya (token: test_sO5Gl3IcYL) :"
curl -s "http://localhost:3004/paydunya/status/test_sO5Gl3IcYL" | jq -c '.data | {response_code, response_text, order_number, payment_status}' 2>/dev/null || echo "❌ Erreur de récupération"

echo ""
echo "=========================================================="
echo "✅ Test terminé"