#!/bin/bash

echo "🚚 SYSTÈME DE LIVRAISON - SCRIPT DE TEST COMPLET"
echo "==============================================================="
echo ""

# Configuration
BASE_URL="http://localhost:3004"
TEST_RESULTS_FILE="test-delivery-results.log"

# Initialiser le fichier de résultats
echo "📋 RÉSULTATS DES TESTS - $(date)" > $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# Fonctions utilitaires
log_test() {
    echo "[$1] $2" | tee -a $TEST_RESULTS_FILE
}

log_success() {
    echo "✅ $1" | tee -a $TEST_RESULTS_FILE
}

log_error() {
    echo "❌ $1" | tee -a $TEST_RESULTS_FILE
}

log_info() {
    echo "ℹ️  $1" | tee -a $TEST_RESULTS_FILE
}

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4

    echo ""
    log_test "TEST" "Test: $description"
    log_info "ENDPOINT" "$method $endpoint"

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint")

    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')

    if [ "$http_status" -eq "$expected_status" ]; then
        log_success "SUCCÈS: $description (Status: $http_status)"
        echo "Response: $body" | jq . >> $TEST_RESULTS_FILE 2>/dev/null || echo "Response: $body" >> $TEST_RESULTS_FILE
    else
        log_error "ÉCHEC: $description (Status: $http_status, attendu: $expected_status)"
        echo "Response: $body" >> $TEST_RESULTS_FILE
    fi
}

# Fonction pour tester un endpoint avec paramètres
test_endpoint_with_params() {
    local method=$1
    local endpoint=$2
    local description=$3
    local params=$4
    local expected_status=$5

    echo ""
    log_test "TEST" "Test: $description"
    log_info "ENDPOINT" "$method $endpoint$params"

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        "$BASE_URL$endpoint$params")

    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')

    if [ "$http_status" -eq "$expected_status" ]; then
        log_success "SUCCÈS: $description (Status: $http_status)"
        echo "Response: $body" | jq . >> $TEST_RESULTS_FILE 2>/dev/null || echo "Response: $body" >> $TEST_RESULTS_FILE
    else
        log_error "ÉCHEC: $description (Status: $http_status, attendu: $expected_status)"
        echo "Response: $body" >> $TEST_RESULTS_FILE
    fi
}

echo "🏪 VÉRIFICATION DU DÉMARRAGE DU SERVEUR"
echo "======================================="
echo "Vérification que le serveur est démarré..."

# Attendre que le serveur soit prêt
for i in {1..30}; do
    if curl -s "$BASE_URL/auth/test-auth" > /dev/null 2>&1; then
        log_success "Serveur démarré et prêt"
        break
    else
        echo "Attente du serveur... ($i/30)"
        sleep 2
    fi

    if [ $i -eq 30 ]; then
        log_error "Le serveur n'a pas démarré correctement"
        exit 1
    fi
done

echo ""
echo "📍 1. TEST DES ENDPOINTS DE BASE (Villes, Régions, Zones)"
echo "========================================================"

# Test des villes
test_endpoint "GET" "/delivery/cities" "Récupérer toutes les villes" 200

# Test des villes par type
test_endpoint_with_params "GET" "/delivery/cities" "Récupérer les villes de Dakar" "?zoneType=dakar-ville" 200
test_endpoint_with_params "GET" "/delivery/cities" "Récupérer les villes de banlieue" "?zoneType=banlieue" 200

# Test des régions
test_endpoint "GET" "/delivery/regions" "Récupérer toutes les régions" 200

# Test des zones internationales
test_endpoint "GET" "/delivery/international-zones" "Récupérer toutes les zones internationales" 200

# Test des transporteurs
test_endpoint "GET" "/delivery/transporteurs" "Récupérer tous les transporteurs" 200

echo ""
echo "💰 2. TEST DES ENDPOINTS DE TARIFICATION"
echo "=========================================="

# Test des tarifs de zone
test_endpoint "GET" "/delivery/zone-tarifs" "Récupérer tous les tarifs de zone" 200

# Test de calcul des frais de livraison
test_endpoint_with_params "GET" "/delivery/calculate-fee" "Calcul frais pour Dakar" "?cityId=1" 200
test_endpoint_with_params "GET" "/delivery/calculate-fee" "Calcul frais pour région" "?regionId=1" 200
test_endpoint_with_params "GET" "/delivery/calculate-fee" "Calcul frais pour international" "?internationalZoneId=1" 200

echo ""
echo "🚚 3. TEST DES TRANSPORTEURS PAR ZONE (NOUVEAU ENDPOINT)"
echo "============================================================="

# Test transporteurs par ville
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour ville Dakar" "?cityId=1" 200
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour banlieue" "?cityId=2" 200

# Test transporteurs par région
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour région Thiès" "?regionId=1" 200
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour région Kaolack" "?regionId=2" 200

# Test transporteurs par zone internationale
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour zone Europe" "?internationalZoneId=1" 200
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Transporteurs pour zone Amérique" "?internationalZoneId=2" 200

echo ""
echo "🛒 4. TEST DE VALIDATION DES PARAMÈTRES INVALIDES"
echo "=============================================="

# Test sans paramètre
test_endpoint "GET" "/delivery/transporteurs/by-zone" "Appel sans paramètre (devrait échouer)" 400

# Test avec plusieurs paramètres
test_endpoint_with_params "GET" "/delivery/transporteurs/by-zone" "Appel avec plusieurs paramètres (devrait échouer)" "?cityId=1&regionId=1" 400

# Test avec ID invalide
test_endpoint_with_params "GET" "/delivery/calculate-fee" "Calcul frais avec ID invalide" "?cityId=invalid-id" 404

echo ""
echo "📦 5. TEST D'INTÉGRATION COMPLÈTE (CRÉATION COMMANDE)"
echo "===================================================="

echo "Création d'une commande test avec informations de livraison..."

# Créer une commande test complète
order_payload='{
  "shippingDetails": {
    "firstName": "Test",
    "lastName": "Client",
    "street": "123 Rue Test",
    "city": "Dakar",
    "postalCode": "10000",
    "country": "Sénégal"
  },
  "phoneNumber": "+221770000000",
  "email": "test@example.com",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 1,
      "size": "M",
      "color": "Noir",
      "unitPrice": 15000
    }
  ],
  "paymentMethod": "CASH_ON_DELIVERY",
  "initiatePayment": false,
  "deliveryInfo": {
    "deliveryType": "city",
    "cityId": "1",
    "cityName": "Dakar",
    "countryCode": "SN",
    "countryName": "Sénégal",
    "transporteurId": "1",
    "transporteurName": "DHL Express",
    "transporteurLogo": "https://example.com/dhl.png",
    "zoneTarifId": "1",
    "deliveryFee": 3000,
    "deliveryTime": "24-48h",
    "metadata": {
      "selectedAt": "'$(date -Iseconds)'",
      "availableCarriers": [
        {
          "transporteurId": "1",
          "name": "DHL Express",
          "fee": 3000,
          "time": "24-48h"
        }
      ]
    }
  }
}'

echo ""
log_test "TEST" "Test: Création commande avec livraison complète"
log_info "ENDPOINT" "POST /orders/guest"
log_info "PAYLOAD" "Commande avec deliveryInfo complète"

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$order_payload" \
    "$BASE_URL/orders/guest")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')

echo "HTTP Status: $http_status"
echo "Response: $body"

if [ "$http_status" -eq "201" ]; then
    log_success "SUCCÈS: Commande créée avec livraison (Status: $http_status)"

    # Extraire l'ID de la commande pour les tests suivants
    order_id=$(echo $body | jq -r '.data.id // empty' 2>/dev/null)
    if [ ! -z "$order_id" ]; then
        log_info "ORDER_ID" "Commande créée avec ID: $order_id"

        # Test de récupération de la commande avec les infos de livraison
        echo ""
        log_test "TEST" "Test: Récupération commande avec livraison"
        test_endpoint_with_params "GET" "/orders/$order_id" "Récupérer détails commande créée" "" 200

        # Test de récupération de toutes les commandes (admin)
        test_endpoint_with_params "GET" "/orders/admin/all" "Récupérer toutes les commandes admin" "?page=1&limit=10" 200
    else
        log_error "Impossible d'extraire l'ID de la commande"
    fi
else
    log_error "ÉCHEC: Création commande (Status: $http_status, attendu: 201)"
    echo "Response: $body" >> $TEST_RESULTS_FILE
fi

echo ""
echo "📊 6. TEST DES ENDPOINTS ADMIN COMPLETS"
echo "====================================="

# Test de récupération des commandes avec filtres
test_endpoint_with_params "GET" "/orders/admin/all" "Commandes avec statut PENDING" "?page=1&limit=5&status=PENDING" 200
test_endpoint_with_params "GET" "/orders/admin/all" "Commandes avec statut CONFIRMED" "?page=1&limit=5&status=CONFIRMED" 200

# Test de récupération des stats de commandes
test_endpoint "GET" "/orders/admin/test-sample" "Structure de commande exemple" 200

echo ""
echo "🔍 7. VALIDATION DE LA STRUCTURE DES RÉPONSES"
echo "==============================================="

log_info "VALIDATION" "Vérification de la structure des données retournées..."

# Récupérer une commande et valider sa structure
echo "Test de validation de la structure d'une commande..."
structure_response=$(curl -s "$BASE_URL/orders/admin/test-sample")

if command -v jq >/dev/null 2>&1; then
    # Valider la structure avec jq si disponible
    delivery_info_check=$(echo $structure_response | jq '.data.orders[0].deliveryInfo // null')
    if [ "$delivery_info_check" != "null" ]; then
        log_success "Structure deliveryInfo présente dans la réponse admin"

        # Vérifier les champs requis
        delivery_type=$(echo $structure_response | jq -r '.data.orders[0].deliveryInfo.deliveryType // empty')
        transporteur_name=$(echo $structure_response | jq -r '.data.orders[0].deliveryInfo.transporteur.name // empty')
        delivery_fee=$(echo $structure_response | jq -r '.data.orders[0].deliveryFee // 0')

        log_info "VALIDATION" "Type livraison: $delivery_type"
        log_info "VALIDATION" "Transporteur: $transporteur_name"
        log_info "VALIDATION" "Frais livraison: $delivery_fee XOF"

        if [ "$delivery_type" != "empty" ] && [ "$transporteur_name" != "empty" ] && [ "$delivery_fee" != "0" ]; then
            log_success "Structure des données de livraison valide"
        else
            log_error "Structure des données de livraison incomplète"
        fi
    else
        log_error "Structure deliveryInfo absente de la réponse admin"
    fi
else
    log_info "jq non disponible, validation manuelle requise"
fi

echo ""
echo "🧪 8. TEST DE CHARGE ET PERFORMANCE"
echo "================================="

# Test de performance sur les endpoints critiques
log_test "PERF" "Test performance: Récupération transporteurs"
start_time=$(date +%s%N)
curl -s "$BASE_URL/delivery/transporteurs" > /dev/null
end_time=$(date +%s%N)
duration=$((($end_time - $start_time) / 1000000))
log_info "PERFORMANCE" "Transporteurs récupérés en ${duration}ms"

log_test "PERF" "Test performance: Calcul frais livraison"
start_time=$(date +%s%N)
curl -s "$BASE_URL/delivery/calculate-fee?cityId=1" > /dev/null
end_time=$(date +%s%N)
duration=$((($end_time - $start_time) / 1000000))
log_info "PERFORMANCE" "Calcul frais en ${duration}ms"

log_test "PERF" "Test performance: Commandes admin"
start_time=$(date +%s%N)
curl -s "$BASE_URL/orders/admin/all?page=1&limit=20" > /dev/null
end_time=$(date +%s%N)
duration=$((($end_time - $start_time) / 1000000))
log_info "PERFORMANCE" "Commandes admin en ${duration}ms"

echo ""
echo "📋 RÉSUMÉ DES TESTS"
echo "==================="
echo ""

# Compter les succès et échecs
success_count=$(grep -c "✅ SUCCÈS" $TEST_RESULTS_FILE)
error_count=$(grep -c "❌ ÉCHEC" $TEST_RESULTS_FILE)

log_info "RÉSULTATS" "Tests exécutés: $(($success_count + $error_count))"
log_success "Tests réussis: $success_count"
log_error "Tests échoués: $error_count"

if [ $error_count -eq 0 ]; then
    log_success "🎉 TOUS LES TESTS SONT PASSÉS - SYSTÈME DE LIVRAISON FONCTIONNEL"
    exit_code=0
else
    log_error "⚠️ CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFIER LES LOGS"
    exit_code=1
fi

echo ""
echo "📄 Fichier de résultats: $TEST_RESULTS_FILE"
echo ""

exit $exit_code