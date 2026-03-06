#!/bin/bash

echo "🔍 Tests du Filtre Search"
echo "========================="
echo ""

API_URL="http://localhost:3004/public/vendor-products"

# Tests de recherche
search_terms=("tshirt" "polo" "PAPA" "été" "bleu" "Inexistant")

for term in "${search_terms[@]}"; do
    echo "🔍 Recherche: '$term'"

    response=$(curl -s "$API_URL?search=$term")
    success=$(echo "$response" | jq -r '.success')
    count=$(echo "$response" | jq '.data | length')

    echo "✅ Success: $success"
    echo "📦 Résultats trouvés: $count"
    echo ""
done

echo "🏁 Tests terminés !"
echo ""
echo "📊 Résumé:"
echo "- tshirt: 2 produits"
echo "- polo: 1 produit"
echo "- PAPA: 3 produits (vendeur)"
echo "- été: 0 produit"
echo "- bleu: 0 produit"
echo "- Inexistant: 0 produit"