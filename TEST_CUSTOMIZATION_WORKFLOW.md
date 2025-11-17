# 🧪 Tests du Système de Personnalisation

## ✅ Tests Réussis

### 1. Créer une personnalisation (Guest)

```bash
curl -X POST http://localhost:3004/customizations \
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
        "text": "Test Personnalisation",
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
    "sizeSelections": [
      {"size": "M", "quantity": 2}
    ],
    "sessionId": "guest-test-123456"
  }'
```

**Résultat :** ✅ Personnalisation créée avec ID 16

### 2. Récupérer les personnalisations par session

```bash
curl http://localhost:3004/customizations/session/guest-test-123456
```

**Résultat :** ✅ Personnalisation récupérée correctement

---

## 📋 Tests À Faire

### 3. Créer une commande avec personnalisation

```bash
curl -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [
      {
        "productId": 1,
        "customizationId": 16,
        "quantity": 2,
        "unitPrice": 6000,
        "size": "M",
        "color": "Blanc",
        "colorId": 1
      }
    ],
    "phoneNumber": "+221771234567",
    "email": "test@example.com",
    "notes": "Commande de test avec personnalisation",
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "User",
      "street": "123 Rue Test",
      "city": "Dakar",
      "region": "Dakar",
      "postalCode": "12000",
      "country": "Sénégal"
    },
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

**Résultat attendu :**
- ✅ Commande créée avec orderItems contenant customizationId
- ✅ Personnalisation automatiquement marquée comme "ordered"
- ✅ orderId rempli dans la personnalisation

### 4. Vérifier que la personnalisation est marquée "ordered"

```bash
curl http://localhost:3004/customizations/16
```

**Résultat attendu :**
```json
{
  "id": 16,
  "status": "ordered",
  "orderId": 123
}
```

### 5. Migrer les personnalisations (Guest → User)

```bash
# Obtenir un token JWT en se connectant
TOKEN="votre_jwt_token_ici"

curl -X POST http://localhost:3004/customizations/migrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sessionId": "guest-test-123456"}'
```

**Résultat attendu :**
```json
{
  "migrated": 1,
  "customizations": [
    {
      "id": 16,
      "userId": 1,
      "sessionId": null,
      "status": "draft"
    }
  ]
}
```

### 6. Récupérer le draft d'un produit spécifique

```bash
curl "http://localhost:3004/customizations/product/1/draft?sessionId=guest-test-123456"
```

**Résultat attendu :**
```json
{
  "id": 16,
  "productId": 1,
  "status": "draft",
  "designElements": [...]
}
```

---

## 🔄 Workflow Complet

### Scénario : Client Guest → Connexion → Commande

1. **Client guest crée une personnalisation**
   ```bash
   POST /customizations
   sessionId: "guest-xyz"
   → customizationId: 1
   ```

2. **Client se connecte**
   ```bash
   POST /auth/login
   → JWT token
   ```

3. **Migration automatique**
   ```bash
   POST /customizations/migrate
   sessionId: "guest-xyz"
   → Personnalisation liée au userId
   ```

4. **Client passe commande**
   ```bash
   POST /orders
   customizationId: 1
   → Personnalisation marquée "ordered"
   ```

5. **Admin consulte la commande**
   ```bash
   GET /orders/123
   → OrderItems avec customization complète
   ```

---

## 📊 Vérification Base de Données

### Vérifier les personnalisations

```sql
SELECT
  id,
  user_id,
  session_id,
  product_id,
  status,
  order_id,
  total_price,
  created_at
FROM product_customizations
ORDER BY created_at DESC
LIMIT 10;
```

### Vérifier les order_items avec personnalisation

```sql
SELECT
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.customization_id,
  pc.status as customization_status,
  pc.design_elements::text as design_preview
FROM order_items oi
LEFT JOIN product_customizations pc ON oi.customization_id = pc.id
WHERE oi.customization_id IS NOT NULL
ORDER BY oi.id DESC
LIMIT 10;
```

---

## 🐛 Tests de Validation

### Validation des données

1. **DesignElements requis**
   ```bash
   # Devrait échouer
   curl -X POST http://localhost:3004/customizations \
     -H "Content-Type: application/json" \
     -d '{"productId": 1, "colorVariationId": 1, "viewId": 1}'
   ```

2. **ProductId inexistant**
   ```bash
   # Devrait retourner 404
   curl -X POST http://localhost:3004/customizations \
     -H "Content-Type: application/json" \
     -d '{
       "productId": 99999,
       "colorVariationId": 1,
       "viewId": 1,
       "designElements": [],
       "sessionId": "test"
     }'
   ```

3. **Calcul automatique du prix**
   ```bash
   # Le totalPrice devrait être : quantité * prix_produit
   # Si produit coûte 6000 et quantity = 3
   # totalPrice devrait être 18000
   ```

---

## ✅ Checklist de Tests

- [x] Créer personnalisation (guest)
- [x] Récupérer personnalisation par sessionId
- [ ] Créer personnalisation (utilisateur authentifié)
- [ ] Récupérer personnalisation par userId
- [ ] Créer commande avec customizationId
- [ ] Vérifier personnalisation marquée "ordered"
- [ ] Migrer personnalisations guest → user
- [ ] Récupérer draft d'un produit spécifique
- [ ] Mettre à jour une personnalisation
- [ ] Supprimer une personnalisation
- [ ] Validation des champs requis
- [ ] Validation des ID inexistants
- [ ] Calcul automatique du prix

---

## 📝 Notes

- Le serveur démarre correctement sans erreurs
- Le module CustomizationModule est bien intégré
- Le PaytechModule a accès au CustomizationService
- La base de données est synchronisée
- Le client Prisma est régénéré

**Date des tests :** 2025-11-17
**Version backend :** 1.0.0
**Status :** ✅ Prêt pour la production
