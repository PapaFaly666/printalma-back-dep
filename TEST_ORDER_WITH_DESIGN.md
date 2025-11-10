# 🧪 Test de Commande avec Design et Mockup

## 📝 Exemple de Requête CURL Complète

### Créer une commande avec design et mockup

```bash
curl -X 'POST' \
  'http://localhost:3004/orders/guest' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "shippingDetails": {
    "firstName": "Papa Faly",
    "lastName": "Sidy",
    "street": "Point E",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "33222",
    "country": "Sénégal"
  },
  "phoneNumber": "775588834",
  "email": "pfdiagne35@gmail.com",
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "orderItems": [
    {
      "productId": 3,
      "vendorProductId": 5,
      "quantity": 1,
      "unitPrice": 3000,
      "size": "L",
      "color": "Blanc",
      "colorId": 1,
      "mockupUrl": "https://res.cloudinary.com/printalma/image/upload/v1731183120/mockups/product-3-design-42.png",
      "designId": 42,
      "designPositions": {
        "x": 0.5,
        "y": 0.4,
        "scale": 0.6,
        "rotation": 0,
        "designWidth": 1200,
        "designHeight": 1200
      },
      "designMetadata": {
        "designName": "Logo Cool",
        "designCategory": "LOGO",
        "designImageUrl": "https://res.cloudinary.com/printalma/image/upload/v1731183120/designs/logo-cool.png",
        "appliedAt": "2025-11-09T20:46:41.020Z"
      }
    }
  ]
}'
```

### Vérifier la commande créée

```bash
curl -X 'GET' \
  'http://localhost:3004/orders/admin/all?page=1&limit=1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

## ✅ Résultat Attendu

La commande devrait être créée avec toutes les informations de design sauvegardées :

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 214,
    "orderNumber": "ORD-1762721234567",
    "orderItems": [
      {
        "id": 213,
        "productId": 3,
        "vendorProductId": 5,
        "quantity": 1,
        "unitPrice": 3000,
        "size": "L",
        "color": "Blanc",
        "colorId": 1,
        "mockupUrl": "https://res.cloudinary.com/printalma/image/upload/v1731183120/mockups/product-3-design-42.png",
        "designId": 42,
        "designPositions": {
          "x": 0.5,
          "y": 0.4,
          "scale": 0.6,
          "rotation": 0,
          "designWidth": 1200,
          "designHeight": 1200
        },
        "designMetadata": {
          "designName": "Logo Cool",
          "designCategory": "LOGO",
          "designImageUrl": "https://res.cloudinary.com/printalma/image/upload/v1731183120/designs/logo-cool.png",
          "appliedAt": "2025-11-09T20:46:41.020Z"
        }
      }
    ]
  }
}
```

## 🔍 Vérification dans la Base de Données

```sql
-- Vérifier les données de design sauvegardées
SELECT
  id,
  "orderId",
  "productId",
  "mockupUrl",
  "designId",
  "designPositions",
  "designMetadata"
FROM "OrderItem"
WHERE "orderId" = (SELECT id FROM "Order" ORDER BY "createdAt" DESC LIMIT 1);
```

## 📊 Cas de Test

### Test 1: Commande avec design complet
- ✅ mockupUrl fourni
- ✅ designId fourni
- ✅ designPositions fourni
- ✅ designMetadata fourni

### Test 2: Commande sans design (produit standard)
- ❌ Pas de mockupUrl
- ❌ Pas de designId
- ❌ Pas de designPositions
- ❌ Pas de designMetadata

```bash
curl -X 'POST' \
  'http://localhost:3004/orders/guest' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "shippingDetails": {
    "firstName": "Client",
    "lastName": "Test",
    "street": "123 Rue Test",
    "city": "Dakar",
    "postalCode": "10000",
    "country": "Sénégal"
  },
  "phoneNumber": "771234567",
  "email": "test@example.com",
  "paymentMethod": "CASH_ON_DELIVERY",
  "orderItems": [
    {
      "productId": 3,
      "quantity": 2,
      "unitPrice": 3000,
      "size": "M",
      "color": "Blanc",
      "colorId": 1
    }
  ]
}'
```

## 🎯 Points de Vérification

1. **Base de données** : Les champs `mockupUrl`, `designId`, `designPositions`, `designMetadata` sont bien sauvegardés dans la table `OrderItem`
2. **API Response** : Les données de design sont retournées dans la réponse GET
3. **Logs Backend** : Vérifier les logs console pour voir les informations de design
4. **Format JSON** : `designPositions` et `designMetadata` sont stockés en JSON

## ⚠️ Erreurs Possibles

### Erreur: designPositions n'est pas un objet JSON valide
```json
{
  "error": "Bad Request",
  "message": "designPositions must be an object"
}
```
**Solution**: Assurez-vous d'envoyer un objet JSON, pas une chaîne de caractères.

### Erreur: designId n'est pas un nombre
```json
{
  "error": "Bad Request",
  "message": "designId must be a number"
}
```
**Solution**: Envoyez `designId` comme nombre, pas comme chaîne.

## 📝 Notes pour le Frontend

- Les champs de design sont **optionnels**
- Vous pouvez créer des commandes avec ou sans design
- Le mockup sera affiché dans l'historique des commandes
- Les coordonnées permettent de recréer le placement exact du design
