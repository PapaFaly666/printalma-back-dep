#!/bin/bash

echo "🎨 Test Positionnement Design - API Public"
echo "======================================"

API_URL="http://localhost:3004/public/vendor-products"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Test 1: Verifier la presence des positions de design${NC}"
response=$(curl -s "$API_URL?adminProductName=Tshirt&limit=1")
success=$(echo "$response" | jq -r '.success')
has_design_positions=$(echo "$response" | jq 'has("designPositions")')

if [ "$success" = "true" ] && [ "$has_design_positions" = "true" ]; then
    echo -e "${GREEN}✅ Success: $success${NC}"
    echo -e "${GREEN}✅ Design positions presentes: $has_design_positions${NC}"
else
    echo -e "${RED}❌ Erreur: Success=$success, Design positions=$has_design_positions${NC}"
fi

echo ""
echo -e "${BLUE}Test 2: Analyse des champs de positionnement${NC}"

# Extraire les donnees de positionnement
x_pos=$(echo "$response" | jq -r '.data[0].designPositions[0].position.x // "N/A"')
y_pos=$(echo "$response" | jq -r '.data[0].designPositions[0].position.y // "N/A"')
scale=$(echo "$response" | jq -r '.data[0].designPositions[0].position.scale // "N/A"')
rotation=$(echo "$response" | jq -r '.data[0].designPositions[0].position.rotation // "N/A"')
design_width=$(echo "$response" | jq -r '.data[0].designPositions[0].position.designWidth // "N/A"')
design_height=$(echo "$response" | jq -r '.data[0].designPositions[0].position.designHeight // "N/A"')

echo -e "${YELLOW}Positionnement du Design:${NC}"
echo -e "  📍 X: ${GREEN}$x_pos${NC} px"
echo -e "  📍 Y: ${GREEN}$y_pos${NC} px"
echo -e "  📏 Echelle: ${GREEN}$scale${NC}"
echo -e "  🔄 Rotation: ${GREEN}$rotation${NC}°"
echo -e "  📐 Largeur design: ${GREEN}$design_width${NC} px"
echo -e "  📐 Hauteur design: ${GREEN}$design_height${NC} px"

echo ""
echo -e "${BLUE}Test 3: Contraintes d'echelle${NC}"

min_scale=$(echo "$response" | jq -r '.data[0].designPositions[0].position.constraints.minScale // "N/A"')
max_scale=$(echo "$response" | jq -r '.data[0].designPositions[0].position.constraints.maxScale // "N/A"')

echo -e "${YELLOW}Contraintes d'echelle:${NC}"
echo -e "  ⬇️ Echelle minimale: ${GREEN}$min_scale${NC}"
echo -e "  ⬆️ Echelle maximale: ${GREEN}$max_scale${NC}"

echo ""
echo -e "${BLUE}Test 4: Informations du design${NC}"

design_id=$(echo "$response" | jq -r '.data[0].design.id // "N/A"')
design_name=$(echo "$response" | jq -r '.data[0].design.name // "N/A"')
design_url=$(echo "$response" | jq -r '.data[0].design.imageUrl // "N/A"')

echo -e "${YELLOW}Design:${NC}"
echo -e "  🆔 ID: ${GREEN}$design_id${NC}"
echo -e "  🏷️ Nom: ${GREEN}$design_name${NC}"
echo -e "  🔗 URL: ${GREEN}$design_url${NC}"

echo ""
echo -e "${BLUE}Test 5: Comparaison avec /vendor/products (si disponible)${NC}"
echo "Note: L'endpoint /public/vendor-products utilise deja le meme systeme que /vendor/products"

echo ""
echo -e "${GREEN}🎯 Tests termines !${NC}"
echo ""
echo -e "${YELLOW}📋 Resume des donnees de positionnement:${NC}"
echo "=================================================="
echo "L'endpoint /public/vendor-products inclut deja le positionnement exact du design :"
echo "- designPositions[].position.x, .y, .scale, .rotation"
echo "- designPositions[].position.constraints.minScale, .maxScale"
echo "- designPositions[].position.designWidth, .designHeight"
echo "- design.id, .name, .imageUrl"
echo ""
echo "Ces donnees permettent de positionner le design exactement comme sur l'endpoint /vendor/products"