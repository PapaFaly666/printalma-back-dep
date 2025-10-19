# Système de Protection contre la Suppression de Catégories

## Vue d'ensemble

Ce système empêche la suppression accidentelle de catégories, sous-catégories et variations qui sont utilisées par des produits existants. Il garantit l'intégrité des données en vérifiant les dépendances avant toute suppression.

## Fonctionnalités

### 1. Protection au niveau du schéma Prisma

Les contraintes suivantes ont été ajoutées dans `prisma/schema.prisma` :

```prisma
// Product model
category      Category?    @relation("ProductCategory", fields: [categoryId], references: [id], onDelete: Restrict)
subCategory   SubCategory? @relation("ProductSubCategory", fields: [subCategoryId], references: [id], onDelete: Restrict)
variation     Variation?   @relation("ProductVariation", fields: [variationId], references: [id], onDelete: Restrict)

// Variation model
subCategory   SubCategory @relation("SubCategoryVariations", fields: [subCategoryId], references: [id], onDelete: Restrict)
```

**`onDelete: Restrict`** empêche PostgreSQL de supprimer une catégorie/sous-catégorie/variation si elle est référencée par au moins un produit.

### 2. Protection au niveau applicatif

Le service `CategoryService` implémente des vérifications complètes avant suppression :

#### A. Suppression de catégorie (`remove`)
- Vérifie les produits liés directement à la catégorie
- Vérifie les produits liés aux sous-catégories de cette catégorie
- Vérifie les produits liés aux variations des sous-catégories
- Bloque la suppression si au moins un produit est trouvé

#### B. Suppression de sous-catégorie (`removeSubCategory`)
- Vérifie les produits liés directement à la sous-catégorie
- Vérifie les produits liés aux variations de cette sous-catégorie
- Bloque la suppression si au moins un produit est trouvé

#### C. Suppression de variation (`removeVariation`)
- Vérifie les produits utilisant cette variation
- Bloque la suppression si au moins un produit est trouvé

### 3. Endpoints API disponibles

#### Routes de suppression protégées

```
DELETE /categories/:id
Supprime une catégorie principale (avec protection)

DELETE /categories/subcategory/:id
Supprime une sous-catégorie (avec protection)

DELETE /categories/variation/:id
Supprime une variation (avec protection)
```

#### Routes de vérification avant suppression

Ces endpoints permettent de vérifier si une suppression est possible AVANT de l'effectuer :

```
GET /categories/:id/can-delete
Vérifie si une catégorie peut être supprimée

GET /categories/subcategory/:id/can-delete
Vérifie si une sous-catégorie peut être supprimée

GET /categories/variation/:id/can-delete
Vérifie si une variation peut être supprimée
```

## Exemples d'utilisation

### 1. Vérifier si une catégorie peut être supprimée

```bash
GET /categories/1/can-delete
```

**Réponse en cas d'échec :**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "categoryId": 1,
    "categoryName": "Vêtements",
    "blockers": {
      "directProducts": 5,
      "subCategoryProducts": 12,
      "variationProducts": 8,
      "total": 25
    },
    "message": "Cette catégorie ne peut pas être supprimée car 25 produit(s) l'utilise(nt)"
  }
}
```

**Réponse en cas de succès :**
```json
{
  "success": true,
  "data": {
    "canDelete": true,
    "categoryId": 1,
    "categoryName": "Accessoires",
    "blockers": {
      "directProducts": 0,
      "subCategoryProducts": 0,
      "variationProducts": 0,
      "total": 0
    },
    "message": "Cette catégorie peut être supprimée"
  }
}
```

### 2. Tenter de supprimer une catégorie utilisée

```bash
DELETE /categories/1
```

**Réponse d'erreur (409 Conflict) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette catégorie car 5 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre catégorie.",
  "error": "Conflict",
  "code": "CategoryInUse",
  "details": {
    "categoryId": 1,
    "categoryName": "Vêtements",
    "directProductsCount": 5,
    "suggestedAction": "Déplacez les produits vers une autre catégorie avant de supprimer celle-ci."
  }
}
```

### 3. Tenter de supprimer une sous-catégorie utilisée

```bash
DELETE /categories/subcategory/3
```

**Réponse d'erreur (409 Conflict) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette sous-catégorie car 12 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre sous-catégorie.",
  "error": "Conflict",
  "code": "SubCategoryInUse",
  "details": {
    "subCategoryId": 3,
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "directProductsCount": 12,
    "suggestedAction": "Déplacez les produits vers une autre sous-catégorie avant de la supprimer."
  }
}
```

### 4. Tenter de supprimer une variation utilisée

```bash
DELETE /categories/variation/7
```

**Réponse d'erreur (409 Conflict) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette variation car 8 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre variation.",
  "error": "Conflict",
  "code": "VariationInUse",
  "details": {
    "variationId": 7,
    "variationName": "Col V",
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "productsCount": 8,
    "suggestedAction": "Déplacez les produits vers une autre variation avant de la supprimer."
  }
}
```

## Workflow recommandé pour la suppression

### Workflow Frontend

```javascript
// 1. Vérifier si la catégorie peut être supprimée
const checkResponse = await fetch(`/api/categories/${categoryId}/can-delete`);
const { data } = await checkResponse.json();

if (!data.canDelete) {
  // Afficher un message d'avertissement à l'utilisateur
  alert(`Impossible de supprimer: ${data.blockers.total} produit(s) utilise(nt) cette catégorie`);

  // Proposer de déplacer les produits
  showProductMigrationDialog(categoryId, data.blockers);

} else {
  // Demander confirmation
  if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
    // Procéder à la suppression
    await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
  }
}
```

### Workflow Backend (déjà implémenté)

1. L'utilisateur tente de supprimer une catégorie/sous-catégorie/variation
2. Le système vérifie s'il existe des produits qui l'utilisent
3. Si oui : retourne une erreur 409 avec les détails
4. Si non : procède à la suppression

## Migration des produits

Pour supprimer une catégorie utilisée, il faut d'abord déplacer les produits :

```javascript
// Exemple: Déplacer les produits de la catégorie 1 vers la catégorie 2
await Promise.all(
  productIds.map(productId =>
    fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        categoryId: 2,
        subCategoryId: newSubCategoryId,
        variationId: newVariationId
      })
    })
  )
);

// Maintenant vous pouvez supprimer la catégorie 1
await fetch('/api/categories/1', { method: 'DELETE' });
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| `CategoryInUse` | La catégorie est utilisée par au moins un produit |
| `SubCategoryInUse` | La sous-catégorie est utilisée par au moins un produit |
| `VariationInUse` | La variation est utilisée par au moins un produit |

## Sécurité et intégrité des données

### Protection à plusieurs niveaux

1. **Base de données** : Contraintes `RESTRICT` au niveau PostgreSQL
2. **Application** : Vérifications dans le service avant suppression
3. **Soft delete** : Les produits utilisent `isDelete: false` pour filtrer les suppressions logiques

### Avantages

- Empêche la perte accidentelle de données
- Maintient l'intégrité référentielle
- Fournit des messages d'erreur clairs et exploitables
- Permet une migration contrôlée des produits

## Tests recommandés

### Test 1 : Suppression bloquée
```bash
# Créer une catégorie
POST /categories { "name": "Test Category" }

# Créer un produit avec cette catégorie
POST /products { "name": "Test Product", "categoryId": X }

# Tenter de supprimer la catégorie (doit échouer)
DELETE /categories/X
# Attendu: 409 Conflict
```

### Test 2 : Suppression réussie
```bash
# Créer une catégorie
POST /categories { "name": "Empty Category" }

# Vérifier qu'elle peut être supprimée
GET /categories/X/can-delete
# Attendu: canDelete: true

# Supprimer la catégorie
DELETE /categories/X
# Attendu: 200 OK
```

### Test 3 : Cascade de vérification
```bash
# Créer: Catégorie > Sous-catégorie > Variation > Produit

# Tenter de supprimer la catégorie (doit détecter le produit via variation)
DELETE /categories/X
# Attendu: 409 avec détails sur variationProducts
```

## Support et maintenance

Pour toute question ou amélioration, consulter :
- Code source : `src/category/category.service.ts`
- Schéma : `prisma/schema.prisma`
- Contrôleur : `src/category/category.controller.ts`
