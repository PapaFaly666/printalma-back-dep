# Test des nouveaux champs de validation et rejet

## Nouveaux champs ajoutés dans la réponse GET /admin/products/validation

### Champs pour détecter le statut :

1. **`adminValidated`** (boolean|null) - Pour produits WIZARD uniquement
   - `true` : Produit WIZARD validé par l'admin
   - `false` : Produit WIZARD en attente de validation admin
   - `null` : Produit traditionnel (utilise `isValidated`)

2. **`isRejected`** (boolean) - Détecte si le produit est rejeté
   - `true` : Produit rejeté (rejectionReason existe OU status = 'REJECTED')
   - `false` : Produit non rejeté

3. **`rejectionReason`** (string|null) - Raison du rejet
   - `null` : Pas de rejet
   - `string` : Raison du rejet

4. **`rejectedAt`** (string|null) - Date/heure du rejet
   - `null` : Pas rejeté
   - `string` : ISO timestamp du rejet

5. **`finalStatus`** (string) - Statut calculé final
   - `'PENDING'` : En attente de validation
   - `'APPROVED'` : Validé/Approuvé
   - `'REJECTED'` : Rejeté

## Logique de filtrage mise à jour :

### status=PENDING
- Produits WIZARD avec `adminValidated: false`
- Produits traditionnels avec `isValidated: false` et `status: 'PENDING'`

### status=APPROVED ou status=VALIDATED
- Produits WIZARD avec `adminValidated: true`
- Produits traditionnels avec `isValidated: true`

### status=REJECTED
- Produits avec `rejectionReason` défini OU `status: 'REJECTED'`

## Exemples de requêtes :

```bash
# Produits WIZARD en attente de validation admin
curl -X 'GET' 'http://localhost:3004/admin/products/validation?productType=WIZARD&status=PENDING' -H 'Authorization: Bearer TOKEN'

# Produits WIZARD validés par admin
curl -X 'GET' 'http://localhost:3004/admin/products/validation?productType=WIZARD&status=APPROVED' -H 'Authorization: Bearer TOKEN'

# Produits WIZARD rejetés
curl -X 'GET' 'http://localhost:3004/admin/products/validation?productType=WIZARD&status=REJECTED' -H 'Authorization: Bearer TOKEN'

# Valider un produit WIZARD
curl -X 'POST' 'http://localhost:3004/admin/products/34/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"approved": true}'

# Rejeter un produit WIZARD
curl -X 'POST' 'http://localhost:3004/admin/products/34/validate' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"approved": false, "rejectionReason": "Images de mauvaise qualité"}'
```

## Modifications apportées :

### 1. Service (vendor-product-validation.service.ts)
- Ajout du paramètre `status` dans `getPendingProducts()`
- Modification de la logique de filtrage pour utiliser `adminValidated` pour les produits WIZARD
- Changement du statut de rejet de `'PENDING'` vers `'REJECTED'`

### 2. Contrôleur (admin-wizard-validation.controller.ts)
- Ajout des champs `adminValidated`, `isRejected`, `rejectionReason`, `rejectedAt`, `finalStatus`
- Mise à jour de la documentation API

### 3. Logique de validation
- Les produits WIZARD utilisent maintenant `adminValidated` au lieu de `isValidated`
- Les produits rejetés ont maintenant le statut `'REJECTED'` au lieu de rester en `'PENDING'`