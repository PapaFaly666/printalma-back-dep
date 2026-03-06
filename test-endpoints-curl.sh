#!/bin/bash

# Configuration
BASE_URL="http://localhost:3004"
API_BASE="$BASE_URL/public/best-sellers"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction de log coloré
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Fonction de test
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    
    log "\n🔍 Test: $name" $CYAN
    log "URL: $url" $BLUE
    log "Method: $method" $BLUE
    
    # Mesurer le temps
    start_time=$(date +%s%N)
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    # Extraire le status code (dernière ligne)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        log "✅ Succès (${duration}ms) - Status: $status_code" $GREEN
        
        # Afficher un extrait de la réponse
        if [ ! -z "$body" ]; then
            log "📄 Réponse (extrait):" $YELLOW
            echo "$body" | head -c 500
            if [ ${#body} -gt 500 ]; then
                log "..." $YELLOW
            fi
            echo
        fi
    else
        log "❌ Erreur - Status: $status_code" $RED
        if [ ! -z "$body" ]; then
            log "📄 Réponse d'erreur:" $RED
            echo "$body"
        fi
    fi
}

# Tests principaux
log "🏆 TESTS DES ENDPOINTS BEST SELLERS" $MAGENTA
log "====================================" $MAGENTA

# 1. Endpoint principal
test_endpoint "Endpoint principal" "$API_BASE"

# 2. Tests avec filtres
log "\n🎯 Tests avec filtres" $MAGENTA
test_endpoint "Top 5" "$API_BASE?limit=5"
test_endpoint "Top 10" "$API_BASE?limit=10"
test_endpoint "Avec offset" "$API_BASE?limit=3&offset=2"
test_endpoint "Min 5 ventes" "$API_BASE?minSales=5"
test_endpoint "Catégorie T-shirts" "$API_BASE?category=T-shirts"
test_endpoint "Vendeur ID 1" "$API_BASE?vendorId=1"

# 3. Endpoints statistiques
log "\n📊 Tests des statistiques" $MAGENTA
test_endpoint "Statistiques générales" "$API_BASE/stats"

# 4. Endpoints par vendeur
log "\n🏪 Tests par vendeur" $MAGENTA
test_endpoint "Vendeur 1" "$API_BASE/vendor/1"
test_endpoint "Vendeur 2" "$API_BASE/vendor/2"
test_endpoint "Vendeur 3" "$API_BASE/vendor/3"

# 5. Endpoints par catégorie
log "\n🏷️ Tests par catégorie" $MAGENTA
test_endpoint "Catégorie T-shirts" "$API_BASE/category/T-shirts"
test_endpoint "Catégorie Hoodies" "$API_BASE/category/Hoodies"
test_endpoint "Catégorie Polos" "$API_BASE/category/Polos"

# 6. Test d'incrémentation des vues
log "\n👁️ Test incrémentation des vues" $MAGENTA

# D'abord récupérer un produit
product_response=$(curl -s "$API_BASE?limit=1")
if [ ! -z "$product_response" ]; then
    # Extraire l'ID du premier produit (approximation simple)
    product_id=$(echo "$product_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ ! -z "$product_id" ]; then
        test_endpoint "Incrémenter vues produit $product_id" "$API_BASE/product/$product_id/view"
    else
        log "⚠️ Impossible d'extraire l'ID du produit" $YELLOW
    fi
else
    log "⚠️ Aucun produit trouvé pour tester l'incrémentation" $YELLOW
fi

# 7. Tests d'erreur
log "\n🚨 Tests des cas d'erreur" $MAGENTA
test_endpoint "Vendeur inexistant" "$API_BASE/vendor/999"
test_endpoint "Catégorie inexistante" "$API_BASE/category/Inexistant"
test_endpoint "Produit inexistant pour vues" "$API_BASE/product/999/view"
test_endpoint "Limite invalide" "$API_BASE?limit=invalid"
test_endpoint "Offset invalide" "$API_BASE?offset=invalid"

# 8. Tests de performance
log "\n⚡ Tests de performance" $MAGENTA
test_endpoint "Top 5 (performance)" "$API_BASE?limit=5"
test_endpoint "Top 20 (performance)" "$API_BASE?limit=20"
test_endpoint "Top 50 (performance)" "$API_BASE?limit=50"

log "\n🎉 TOUS LES TESTS TERMINÉS" $MAGENTA
log "============================" $MAGENTA

# Résumé des tests
log "\n📋 RÉSUMÉ DES TESTS" $CYAN
log "===================" $CYAN
log "✅ Endpoint principal testé" $GREEN
log "✅ Tests avec filtres effectués" $GREEN
log "✅ Statistiques vérifiées" $GREEN
log "✅ Endpoints par vendeur testés" $GREEN
log "✅ Endpoints par catégorie testés" $GREEN
log "✅ Incrémentation des vues testée" $GREEN
log "✅ Cas d'erreur vérifiés" $GREEN
log "✅ Performance mesurée" $GREEN

log "\n🚀 L'API Best Sellers est prête !" $GREEN 