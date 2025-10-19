# Tests Manuels - Système de Protection de Suppression de Catégories

Ce document explique comment tester manuellement le système de protection contre la suppression de catégories.

## Prérequis

- Serveur backend démarré (`npm run start:dev`)
- Outil pour tester les API (Postman, Thunder Client, ou curl)
- Base de données accessible

## Scénario de Test Complet

### Étape 1: Créer une Catégorie

**Requête:**
```http
POST http://localhost:3000/categories
Content-Type: application/json

{
  "name": "Test Vêtements",
  "description": "Catégorie de test",
  "displayOrder": 999
}
```

**Résultat attendu:**
- Status: 201 Created
- Réponse contient l'ID de la catégorie créée

**Noter l'ID de la catégorie** (exemple: `categoryId = 10`)

---

### Étape 2: Créer une Sous-Catégorie

**Requête:**
```http
POST http://localhost:3000/categories/subcategory
Content-Type: application/json

{
  "name": "Test T-Shirts",
  "description": "Sous-catégorie de test",
  "categoryId": 10,
  "level": 1
}
```

**Résultat attendu:**
- Status: 201 Created
- Réponse contient l'ID de la sous-catégorie

**Noter l'ID de la sous-catégorie** (exemple: `subCategoryId = 15`)

---

### Étape 3: Créer une Variation

**Requête:**
```http
POST http://localhost:3000/categories/variations/batch
Content-Type: application/json

{
  "variations": [
    {
      "name": "Test Col V",
      "description": "Variation de test",
      "parentId": 15
    }
  ]
}
```

**Résultat attendu:**
- Status: 201 Created
- Réponse contient l'ID de la variation dans `data.created[0].id`

**Noter l'ID de la variation** (exemple: `variationId = 20`)

---

### Étape 4: Créer un Produit Utilisant Cette Hiérarchie

**Requête:**
```http
POST http://localhost:3000/products
Content-Type: application/json

{
  "name": "Test Produit",
  "description": "Produit de test pour protection",
  "price": 29.99,
  "stock": 100,
  "categoryId": 10,
  "subCategoryId": 15,
  "variationId": 20,
  "genre": "UNISEXE"
}
```

**Résultat attendu:**
- Status: 201 Created
- Produit créé avec succès

**Noter l'ID du produit** (exemple: `productId = 50`)

---

## Tests de Protection

### Test 5: Vérifier si la Variation Peut Être Supprimée

**Requête:**
```http
GET http://localhost:3000/categories/variation/20/can-delete
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "variationId": 20,
    "variationName": "Test Col V",
    "subCategoryName": "Test T-Shirts",
    "categoryName": "Test Vêtements",
    "blockers": {
      "productsCount": 1
    },
    "message": "Cette variation ne peut pas être supprimée car 1 produit(s) l'utilise(nt)"
  }
}
```

✅ **Vérification:** `canDelete` doit être `false` et `productsCount` doit être `1`

---

### Test 6: Vérifier si la Sous-Catégorie Peut Être Supprimée

**Requête:**
```http
GET http://localhost:3000/categories/subcategory/15/can-delete
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "subCategoryId": 15,
    "subCategoryName": "Test T-Shirts",
    "categoryName": "Test Vêtements",
    "blockers": {
      "directProducts": 0,
      "variationProducts": 1,
      "total": 1
    },
    "message": "Cette sous-catégorie ne peut pas être supprimée car 1 produit(s) l'utilise(nt)"
  }
}
```

✅ **Vérification:** `canDelete` doit être `false` et `variationProducts` doit être `1`

---

### Test 7: Vérifier si la Catégorie Peut Être Supprimée

**Requête:**
```http
GET http://localhost:3000/categories/10/can-delete
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "categoryId": 10,
    "categoryName": "Test Vêtements",
    "blockers": {
      "directProducts": 0,
      "subCategoryProducts": 0,
      "variationProducts": 1,
      "total": 1
    },
    "message": "Cette catégorie ne peut pas être supprimée car 1 produit(s) l'utilise(nt)"
  }
}
```

✅ **Vérification:** `canDelete` doit être `false` et `total` doit être `1`

---

### Test 8: Tenter de Supprimer la Variation (Doit Échouer)

**Requête:**
```http
DELETE http://localhost:3000/categories/variation/20
```

**Résultat attendu:**
- Status: 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette variation car 1 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre variation.",
  "error": "Conflict",
  "code": "VariationInUse",
  "details": {
    "variationId": 20,
    "variationName": "Test Col V",
    "subCategoryName": "Test T-Shirts",
    "categoryName": "Test Vêtements",
    "productsCount": 1,
    "suggestedAction": "Déplacez les produits vers une autre variation avant de la supprimer."
  }
}
```

✅ **Vérification:**
- Status Code doit être `409`
- Message doit indiquer qu'un produit utilise cette variation
- `suggestedAction` doit proposer de déplacer les produits

---

### Test 9: Tenter de Supprimer la Sous-Catégorie (Doit Échouer)

**Requête:**
```http
DELETE http://localhost:3000/categories/subcategory/15
```

**Résultat attendu:**
- Status: 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette sous-catégorie car 1 produit(s) utilise(nt) ses variations. Veuillez d'abord déplacer les produits.",
  "error": "Conflict",
  "code": "SubCategoryInUse",
  "details": {
    "subCategoryId": 15,
    "subCategoryName": "Test T-Shirts",
    "variationProductsCount": 1,
    "suggestedAction": "Déplacez les produits des variations avant de supprimer la sous-catégorie."
  }
}
```

✅ **Vérification:**
- Status Code doit être `409`
- Message doit indiquer que des produits utilisent les variations

---

### Test 10: Tenter de Supprimer la Catégorie (Doit Échouer)

**Requête:**
```http
DELETE http://localhost:3000/categories/10
```

**Résultat attendu:**
- Status: 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette catégorie car 1 produit(s) utilise(nt) ses sous-catégories. Veuillez d'abord déplacer les produits.",
  "error": "Conflict",
  "code": "CategoryInUse",
  "details": {
    "categoryId": 10,
    "categoryName": "Test Vêtements",
    "subCategoryProductsCount": 1,
    "suggestedAction": "Déplacez les produits des sous-catégories avant de supprimer la catégorie principale."
  }
}
```

✅ **Vérification:**
- Status Code doit être `409`
- Message doit indiquer que des produits utilisent les sous-catégories

---

## Tests de Suppression Réussie

### Test 11: Supprimer le Produit

**Requête:**
```http
DELETE http://localhost:3000/products/50
```

**Résultat attendu:**
- Status: 200 OK ou 204 No Content
- Produit supprimé avec succès

---

### Test 12: Vérifier à Nouveau si la Variation Peut Être Supprimée

**Requête:**
```http
GET http://localhost:3000/categories/variation/20/can-delete
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "canDelete": true,
    "variationId": 20,
    "variationName": "Test Col V",
    "blockers": {
      "productsCount": 0
    },
    "message": "Cette variation peut être supprimée"
  }
}
```

✅ **Vérification:** `canDelete` doit maintenant être `true` et `productsCount` doit être `0`

---

### Test 13: Supprimer la Variation (Doit Réussir)

**Requête:**
```http
DELETE http://localhost:3000/categories/variation/20
```

**Résultat attendu:**
- Status: 200 OK

```json
{
  "success": true,
  "message": "Variation supprimée avec succès"
}
```

✅ **Vérification:** Suppression réussie

---

### Test 14: Supprimer la Sous-Catégorie (Doit Réussir)

**Requête:**
```http
DELETE http://localhost:3000/categories/subcategory/15
```

**Résultat attendu:**
- Status: 200 OK

```json
{
  "success": true,
  "message": "Sous-catégorie supprimée avec succès"
}
```

✅ **Vérification:** Suppression réussie

---

### Test 15: Supprimer la Catégorie (Doit Réussir)

**Requête:**
```http
DELETE http://localhost:3000/categories/10
```

**Résultat attendu:**
- Status: 200 OK ou 204 No Content

```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

✅ **Vérification:** Suppression réussie

---

## Résumé des Tests

| Test | Description | Résultat Attendu |
|------|-------------|------------------|
| 1-4 | Création de la hiérarchie et du produit | Tous créés avec succès |
| 5-7 | Vérifications `can-delete` | Toutes retournent `canDelete: false` |
| 8-10 | Tentatives de suppression | Toutes échouent avec 409 Conflict |
| 11 | Suppression du produit | Réussite (200/204) |
| 12 | Vérification `can-delete` après suppression | `canDelete: true` |
| 13-15 | Suppressions en cascade | Toutes réussissent |

---

## Points Clés à Vérifier

1. **Protection Active:** Les suppressions sont bloquées quand des produits utilisent les catégories
2. **Messages Clairs:** Les erreurs 409 contiennent des messages explicites et des suggestions
3. **Vérifications Préalables:** Les endpoints `can-delete` fonctionnent correctement
4. **Nettoyage Possible:** Après suppression des produits, les catégories peuvent être supprimées
5. **Intégrité des Données:** La hiérarchie complète est vérifiée (catégorie → sous-catégorie → variation)

---

## Notes

- Les IDs utilisés dans les exemples (10, 15, 20, 50) sont à remplacer par les IDs réels retournés par vos requêtes
- Tous les tests peuvent être exécutés dans Postman ou avec `curl`
- En cas d'échec, vérifier les logs du serveur pour plus de détails
- La protection fonctionne également au niveau de la base de données grâce aux contraintes `onDelete: Restrict` dans Prisma
