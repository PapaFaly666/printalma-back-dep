#!/bin/bash

# Script de test des endpoints de personnalisation
# Usage: ./test-customization.sh

BASE_URL="http://localhost:3004"

echo "=========================================="
echo "Test 1: Créer une personnalisation (guest)"
echo "=========================================="

curl -X POST "${BASE_URL}/customizations" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Hello World",
        "fontSize": 24,
        "baseFontSize": 24,
        "baseWidth": 200,
        "fontFamily": "Arial",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sessionId": "guest-test-1234567890"
  }' | jq '.'

echo -e "\n\n=========================================="
echo "Test 2: Récupérer les personnalisations d'une session"
echo "=========================================="

curl -X GET "${BASE_URL}/customizations/session/guest-test-1234567890" | jq '.'

echo -e "\n\n=========================================="
echo "Test 3: Créer une personnalisation avec sélection de taille"
echo "=========================================="

curl -X POST "${BASE_URL}/customizations" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-2",
        "type": "text",
        "x": 0.5,
        "y": 0.3,
        "width": 300,
        "height": 60,
        "rotation": 0,
        "zIndex": 1,
        "text": "Custom Design",
        "fontSize": 32,
        "baseFontSize": 32,
        "baseWidth": 300,
        "fontFamily": "Helvetica",
        "color": "#FF0000",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sizeSelections": [
      {
        "size": "M",
        "quantity": 2
      },
      {
        "size": "L",
        "quantity": 1
      }
    ],
    "sessionId": "guest-test-1234567890"
  }' | jq '.'

echo -e "\n\nTests terminés!"
