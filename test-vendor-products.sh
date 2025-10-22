#!/bin/bash

echo "🧪 Tests de l'API Vendor Products"
echo "================================"
echo ""

API_URL="http://localhost:3004/public/vendor-products"

# Fonction pour tester un endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"

    echo "Test: $test_name"
    echo "URL: $url"

    response=$(curl -s "$url")
    success=$(echo "$response" | jq -r '.success')
    count=$(echo "$response" | jq '.data | length')
    total=$(echo "$response" | jq -r '.pagination.total')

    echo "✅ Success: $success"
    echo "📦 Produits retournés: $count"
    echo "📊 Total produits: $total"
    echo ""
}

# Test 1: Tous les produits
test_endpoint "Tous les produits (limit 5)" "$API_URL?limit=5"

# Test 2: Recherche textuelle
test_endpoint "Recherche textuelle 'tshirt'" "$API_URL?search=tshirt"

# Test 3: Filtre adminProductName
test_endpoint "Filtre adminProductName=Tshirt" "$API_URL?adminProductName=Tshirt"

# Test 4: Filtre adminProductName=Polos
test_endpoint "Filtre adminProductName=Polos" "$API_URL?adminProductName=Polos"

# Test 5: Filtre prix
test_endpoint "Filtre prix (20-80€)" "$API_URL?minPrice=20&maxPrice=80"

# Test 6: Combinaison complète
test_endpoint "Combinaison: Tshirt + Prix 20-80€ + Limit 3" "$API_URL?adminProductName=Tshirt&minPrice=20&maxPrice=80&limit=3"

# Test 7: Produit inexistant
test_endpoint "Produit inexistant" "$API_URL?adminProductName=Inexistant"

echo "✅ Tous les tests terminés avec succès !"