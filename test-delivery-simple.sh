#!/bin/bash

echo "🚚 TEST SIMPLE DU SYSTÈME DE LIVRAISON"
echo "=============================================="

BASE_URL="http://localhost:3004"
TEST_RESULTS_FILE="test-delivery-results.log"

# Initialiser le fichier de résultats
echo "📋 RÉSULTATS DES TESTS - $(date)" > $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# Fonctions utilitaires
log_test() {
    echo "[$1] $2" >> $TEST_RESULTS_FILE
}

log_success() {
    echo "✅ $1" >> $TEST_RESULTS_FILE
}

log_error() {
    echo "❌ $1" >> $TEST_RESULTS_FILE
}

log_info() {
    echo "ℹ️  $1" >> $TEST_RESULTS_FILE
}

# Attendre que le serveur soit prêt
echo "⏳ Attente du démarrage du serveur..."
for i in {1..30}; do
    if curl -s "$BASE_URL/auth/test-auth" > /dev/null 2>&1; then
        log_success "Serveur démarré et prêt"
        break
    else
        echo "⏳ Attente du serveur... ($i/30)" >> $TEST_RESULTS_FILE
        sleep 2
    fi

    if [ $i -eq 30 ]; then
        log_error "Le serveur n'a pas démarré correctement"
        exit 1
    fi
done

echo ""
echo "📍 1. TEST DES ENDPOINTS DE BASE"
echo "=================================="

# Test des villes
log_test "TEST" "Récupérer les villes"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/cities")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Villes récupérées avec succès"
    log_info "ENDPOINT" "GET /delivery/cities"
else
    log_error "Échec récupération villes (Status: $http_status)"
fi

# Test des régions
log_test "TEST" "Récupérer les régions"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/regions")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Régions récupérées avec succès"
    log_info "ENDPOINT" "GET /delivery/regions"
else
    log_error "Échec récupération régions (Status: $http_status)"
fi

# Test des transporteurs
log_test "TEST" "Récupérer les transporteurs"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/transporteurs")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Transporteurs récupérés avec succès"
    log_info "ENDPOINT" "GET /delivery/transporteurs"
else
    log_error "Échec récupération transporteurs (Status: $http_status)"
fi

echo ""
echo "📍 2. TEST DES ENDPOINTS PARAMÉTRÉS"
echo "======================================"

# Test des villes par type
log_test "TEST" "Récupérer les villes de Dakar"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/cities?zoneType=dakar-ville")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Villes de Dakar récupérées avec succès"
    log_info "ENDPOINT" "GET /delivery/cities?zoneType=dakar-ville"
else
    log_error "Échec récupération villes Dakar (Status: $http_status)"
fi

# Test des transporteurs par zone
log_test "TEST" "Récupérer les transporteurs pour une ville"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/transporteurs/by-zone?cityId=1")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Transporteurs pour ville récupérés avec succès"
    log_info "ENDPOINT" "GET /delivery/transporteurs/by-zone?cityId=1"
else
    log_error "Échec récupération transporteurs par ville (Status: $http_status)"
fi

echo ""
echo "📍 3. TEST DE CALCUL DES FRAIS"
echo "==============================="

# Test calcul frais pour ville
log_test "TEST" "Calculer frais pour Dakar"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/calculate-fee?cityId=1")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Calcul frais pour Dakar réussi"
    log_info "ENDPOINT" "GET /delivery/calculate-fee?cityId=1"
    echo "Response: $response" >> $TEST_RESULTS_FILE
else
    log_error "Échec calcul frais Dakar (Status: $http_status)"
fi

# Test calcul frais pour région
log_test "TEST" "Calculer frais pour Thiès"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/calculate-fee?regionId=1")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "200" ]; then
    log_success "Calcul frais pour Thiès réussi"
    log_info "ENDPOINT" "GET /delivery/calculate-fee?regionId=1"
    echo "Response: $response" >> $TEST_RESULTS_FILE
else
    log_error "Échec calcul frais Thiès (Status: $http_status)"
fi

echo ""
echo "📍 4. TEST DE CRÉATION DE COMMANDE"
echo "=================================="

# Créer une commande test avec livraison
log_test "TEST" "Créer commande avec livraison"
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
    "transporteurName": "Test Transporteur",
    "zoneTarifId": "1",
    "deliveryFee": 3000,
    "deliveryTime": "24-48h"
  }
}'

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$order_payload" \
    "$BASE_URL/orders/guest")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "201" ]; then
    log_success "Commande avec livraison créée avec succès"
    log_info "ENDPOINT" "POST /orders/guest"
    echo "Response: $response" >> $TEST_RESULTS_FILE
else
    log_error "Échec création commande (Status: $http_status)"
    echo "Response: $response" >> $TEST_RESULTS_FILE
fi

echo ""
echo "📍 5. TEST DE VALIDATION"
echo "=========================="

# Test sans paramètres
log_test "TEST" "Calcul frais sans paramètres"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/calculate-fee")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "400" ]; then
    log_success "Validation sans paramètres correcte (Status 400)"
else
    log_error "Échec validation sans paramètres (Status: $http_status)"
fi

# Test avec plusieurs paramètres
log_test "TEST" "Calcul frais avec plusieurs paramètres"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/delivery/calculate-fee?cityId=1&regionId=1")

http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$http_status" = "400" ]; then
    log_success "Validation plusieurs paramètres correcte (Status 400)"
else
    log_error "Échec validation plusieurs paramètres (Status: $http_status)"
fi

echo ""
echo "📊 RÉSUMÉ DES TESTS"
echo "=================="

# Compter les succès et échecs
success_count=$(grep -c "✅" $TEST_RESULTS_FILE)
error_count=$(grep -c "❌" $TEST_RESULTS_FILE)

log_info "RÉSULTATS" "Tests exécutés: $(($success_count + $error_count))"
log_success "Tests réussis" "$success_count"
log_error "Tests échoués" "$error_count"

if [ $error_count -eq 0 ]; then
    log_success "CONCLUSION" "🎉 TOUS LES TESTS SONT PASSÉS - SYSTÈME DE LIVRAISON FONCTIONNEL"
    exit_code=0
else
    log_error "CONCLUSION" "⚠️ CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFIER LES LOGS"
    exit_code=1
fi

echo ""
echo "📄 Fichier de résultats: $TEST_RESULTS_FILE"
echo ""

exit $exit_code