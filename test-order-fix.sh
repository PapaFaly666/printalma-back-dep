#!/bin/bash

echo "🧪 Test de création de commande avec la correction..."

# Test data simulating the original request that failed
curl -X POST http://localhost:3000/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pfdiagne35@gmail.com",
    "shippingDetails": {
      "firstName": "Papa",
      "lastName": "Matou Ba",
      "street": "Point E",
      "city": "Dakar",
      "region": "Dakar",
      "postalCode": "12992",
      "country": "Sénégal"
    },
    "phoneNumber": "775588834",
    "orderItems": [
      {
        "productId": 12,
        "vendorProductId": 12,
        "quantity": 1,
        "unitPrice": 35000,
        "size": "Casquette de sport",
        "color": "Blanc",
        "colorId": 1,
        "mockupUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1762532994/printalma/1762532994272-Casquette_blanc.jpg",
        "designId": 3,
        "designPositions": {
          "x": 0.5,
          "y": 0.5,
          "scale": 0.6,
          "rotation": 0,
          "constraints": {
            "minScale": 0.1,
            "maxScale": 2
          },
          "designWidth": 200,
          "designHeight": 200
        },
        "designMetadata": {
          "designName": "Casque",
          "designCategory": "CUSTOM",
          "designImageUrl": "https://res.cloudinary.com/dsxab4qnu/raw/upload/v1762535167/vendor-designs/vendor_3_design_1762535166450.svg",
          "appliedAt": "2025-11-11T20:34:43.838Z"
        }
      }
    ],
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }' \
  -w "\n\n⏱️ Temps de réponse: %{time_total}s\n📊 Code HTTP: %{http_code}\n" \
  -s