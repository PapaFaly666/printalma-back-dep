# Guide Frontend - Mise à Jour Sous-Catégories et Variations

## Résumé Exécutif

Date: 2025-10-15
Status: ✅ Implémenté et testé
Version Backend: 1.0.0

### Qu'est-ce qui a changé?

**Problème résolu:** Lorsqu'un admin modifiait une sous-catégorie ou variation, les produits affichaient toujours l'ancien nom car les données de relation n'étaient pas incluses dans les réponses API.

**Solution:** Tous les endpoints de produits incluent maintenant les objets `subCategory` et `variation` complets dans leurs réponses.

---

## 🎯 Endpoints Modifiés pour le Frontend

### 1. PATCH /sub-categories/:id

**Nouveau endpoint** pour mettre à jour une sous-catégorie.

#### Requête

```bash
PATCH http://localhost:3004/sub-categories/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Sous-catégorie mise à jour avec succès",
  "data": {
    "id": 9,
    "name": "Sacs Premium Test",
    "slug": "sacs-premium-test",
    "description": "Collection de sacs premium test",
    "categoryId": 6,
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-10-14T01:13:55.907Z",
    "updatedAt": "2025-10-15T01:57:57.974Z",
    "category": {
      "id": 6,
      "name": "Accessoires",
      "slug": "accessoires"
    },
    "variations": []
  }
}
```

#### Exemple Frontend (TypeScript/React)

```typescript
const updateSubCategory = async (id: number, data: { name?: string; description?: string }) => {
  try {
    const response = await fetch(`http://localhost:3004/sub-categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Sous-catégorie mise à jour:', result.data);
      // Rafraîchir la liste des produits pour voir les changements
      await fetchProducts();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

### 2. PATCH /variations/:id

**Nouveau endpoint** pour mettre à jour une variation.

#### Requête

```bash
PATCH http://localhost:3004/variations/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Variation mise à jour avec succès",
  "data": {
    "id": 11,
    "name": "Col V Profond",
    "slug": "col-v-profond",
    "description": "Col en V profond",
    "subCategoryId": 3,
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-10-14T01:13:54.123Z",
    "updatedAt": "2025-10-15T02:00:00.000Z",
    "subCategory": {
      "id": 3,
      "name": "T-shirts",
      "slug": "t-shirts"
    }
  }
}
```

#### Exemple Frontend (TypeScript/React)

```typescript
const updateVariation = async (id: number, data: { name?: string; description?: string }) => {
  try {
    const response = await fetch(`http://localhost:3004/variations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Variation mise à jour:', result.data);
      // Rafraîchir la liste des produits pour voir les changements
      await fetchProducts();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

### 3. GET /products

**Modifié:** Les produits incluent maintenant `subCategory` et `variation`.

#### Avant (ancien format)

```json
{
  "id": 8,
  "name": "Tote Bag Canvas",
  "subCategoryId": 9,
  "variationId": null,
  "subCategory": null,  // ❌ Était null
  "variation": null     // ❌ Était null
}
```

#### Après (nouveau format)

```json
{
  "id": 8,
  "name": "Tote Bag Canvas",
  "subCategoryId": 9,
  "variationId": null,
  "subCategory": {      // ✅ Maintenant inclus!
    "id": 9,
    "name": "Sacs Premium Test",
    "slug": "sacs-premium-test",
    "description": "Collection de sacs premium test",
    "categoryId": 6,
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-10-14T01:13:55.907Z",
    "updatedAt": "2025-10-15T01:57:57.974Z"
  },
  "variation": null     // ✅ null si aucune variation
}
```

#### Exemple Frontend - Affichage

```typescript
interface Product {
  id: number;
  name: string;
  subCategoryId?: number | null;
  variationId?: number | null;
  subCategory?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
  } | null;
  variation?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
  } | null;
}

// Composant React
const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="product-card">
      <h2>{product.name}</h2>

      {product.subCategory && (
        <div className="subcategory">
          <span className="label">Sous-catégorie:</span>
          <span>{product.subCategory.name}</span>
        </div>
      )}

      {product.variation && (
        <div className="variation">
          <span className="label">Variation:</span>
          <span>{product.variation.name}</span>
        </div>
      )}
    </div>
  );
};
```

---

### 4. GET /products/:id

**Modifié:** Retourne le produit avec `subCategory` et `variation` inclus.

#### Exemple Frontend

```typescript
const fetchProduct = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:3004/products/${id}`);
    const product = await response.json();

    console.log('Produit:', product.name);
    console.log('Sous-catégorie:', product.subCategory?.name || 'Aucune');
    console.log('Variation:', product.variation?.name || 'Aucune');

    return product;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

### 5. GET /mockups

**Modifié:** Les mockups incluent maintenant `subCategory` et `variation`.

#### Exemple Frontend

```typescript
const fetchMockups = async () => {
  try {
    const response = await fetch('http://localhost:3004/mockups');
    const mockups = await response.json();

    mockups.forEach(mockup => {
      console.log('Mockup:', mockup.name);
      console.log('Sous-catégorie:', mockup.subCategory?.name || 'Aucune');
      console.log('Variation:', mockup.variation?.name || 'Aucune');
    });

    return mockups;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

## 🔄 Mise à Jour Automatique des Produits

### Comment ça fonctionne?

Grâce aux **relations Prisma**, les produits reflètent automatiquement les modifications de sous-catégories et variations:

1. **L'admin modifie une sous-catégorie**
   ```typescript
   // PATCH /sub-categories/9
   { "name": "Sacs Premium" }
   ```

2. **La base de données est mise à jour**
   ```sql
   -- Table sub_categories
   UPDATE sub_categories
   SET name = 'Sacs Premium', slug = 'sacs-premium'
   WHERE id = 9;

   -- Table products (AUCUN CHANGEMENT NÉCESSAIRE!)
   -- Les produits gardent leur subCategoryId = 9
   ```

3. **Le frontend récupère les produits**
   ```typescript
   // GET /products
   // Prisma fait automatiquement un JOIN
   SELECT products.*, sub_categories.*
   FROM products
   LEFT JOIN sub_categories ON products.subCategoryId = sub_categories.id
   ```

4. **Le produit affiche le nouveau nom automatiquement**
   ```json
   {
     "id": 8,
     "name": "Tote Bag Canvas",
     "subCategory": {
       "id": 9,
       "name": "Sacs Premium"  // ← Nouveau nom!
     }
   }
   ```

### Pas de Cache à Invalider!

Le frontend **n'a pas besoin** de:
- Invalider des caches
- Mettre à jour manuellement les produits
- Faire des requêtes supplémentaires

Il suffit de **récupérer les produits normalement** avec `GET /products` et les nouvelles données seront automatiquement là!

---

## 📊 Flux de Travail Complet

### Scénario: Admin Modifie "Sacs" → "Sacs Premium"

```typescript
// 1. Admin modifie la sous-catégorie
await updateSubCategory(9, { name: 'Sacs Premium' });

// 2. Rafraîchir la liste des produits (pas obligatoire immédiatement)
const products = await fetchProducts();

// 3. Le produit affiche automatiquement "Sacs Premium"
products.forEach(product => {
  if (product.subCategoryId === 9) {
    console.log(product.subCategory.name); // "Sacs Premium"
  }
});
```

### Avant/Après pour l'Utilisateur

| Étape | Avant | Après |
|-------|-------|-------|
| **1. État initial** | Sous-catégorie: "Sacs"<br>Produit: "Tote Bag" → Sous-catégorie: "Sacs" | Sous-catégorie: "Sacs"<br>Produit: "Tote Bag" → Sous-catégorie: "Sacs" |
| **2. Admin modifie** | PATCH /sub-categories/9 → { name: "Sacs Premium" } | PATCH /sub-categories/9 → { name: "Sacs Premium" } |
| **3. Affichage produit** | Produit: "Tote Bag" → Sous-catégorie: "Sacs" ❌ (ancien nom) | Produit: "Tote Bag" → Sous-catégorie: "Sacs Premium" ✅ (nouveau nom) |

---

## 💡 Bonnes Pratiques Frontend

### 1. Types TypeScript

```typescript
interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Variation {
  id: number;
  name: string;
  slug: string;
  description?: string;
  subCategoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT';

  // Relations
  subCategoryId?: number | null;
  variationId?: number | null;
  subCategory?: SubCategory | null;
  variation?: Variation | null;

  // ... autres champs
}
```

### 2. Hook React Personnalisé

```typescript
import { useState, useEffect } from 'react';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3004/products');
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

// Utilisation
const ProductList = () => {
  const { products, loading, error, refetch } = useProducts();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <button onClick={refetch}>Rafraîchir</button>
    </div>
  );
};
```

### 3. Rafraîchissement Automatique

Quand un admin modifie une sous-catégorie/variation, rafraîchir automatiquement la liste:

```typescript
const handleUpdateSubCategory = async (id: number, data: any) => {
  try {
    await updateSubCategory(id, data);

    // Rafraîchir la liste des produits
    await refetch();

    // Afficher un message de succès
    toast.success('Sous-catégorie mise à jour! Les produits sont automatiquement mis à jour.');
  } catch (error) {
    toast.error('Erreur lors de la mise à jour');
  }
};
```

### 4. Affichage Conditionnel

```typescript
const ProductMetadata = ({ product }: { product: Product }) => {
  return (
    <div className="metadata">
      {product.subCategory && (
        <Badge variant="secondary">
          {product.subCategory.name}
        </Badge>
      )}

      {product.variation && (
        <Badge variant="outline">
          {product.variation.name}
        </Badge>
      )}

      {!product.subCategory && !product.variation && (
        <span className="text-muted">Aucune catégorisation</span>
      )}
    </div>
  );
};
```

---

## 🚀 Régénération Automatique des Mockups

Quand une sous-catégorie ou variation est modifiée, **tous les mockups associés sont automatiquement marqués pour régénération**.

### Logs Backend

```
[SubCategoryService] 🔄 Déclenchement de la régénération des mockups pour la sous-catégorie 9
[MockupService] 🔄 Régénération mockups pour sous-catégorie 9
[MockupService] 📦 1 mockups à régénérer pour la sous-catégorie 9
[MockupService]    ✓ Mockup 8 - Tote Bag Canvas marqué pour régénération
[MockupService] ✅ Régénération terminée pour 1 mockups
```

### Pas d'Action Frontend Requise

Cette régénération se fait automatiquement en arrière-plan. Le frontend n'a rien à faire de spécial.

---

## 📋 Checklist d'Intégration Frontend

- [ ] Mettre à jour les interfaces TypeScript pour inclure `subCategory` et `variation`
- [ ] Modifier les composants d'affichage pour utiliser `product.subCategory.name` au lieu de stocker les noms en local
- [ ] Implémenter les appels PATCH pour `/sub-categories/:id` et `/variations/:id`
- [ ] Ajouter un rafraîchissement automatique des produits après modification de sous-catégorie/variation
- [ ] Tester le flux complet: modifier une sous-catégorie → vérifier que les produits affichent le nouveau nom
- [ ] Gérer les cas où `subCategory` ou `variation` sont `null`
- [ ] Ajouter des messages de succès après modification

---

## 🔐 Validation et Gestion d'Erreurs

### Codes d'Erreur HTTP

| Code | Signification | Action Frontend |
|------|--------------|-----------------|
| 200 | Succès | Afficher un message de succès et rafraîchir |
| 400 | Validation échouée | Afficher les erreurs de validation |
| 404 | Ressource non trouvée | Afficher "Sous-catégorie/Variation non trouvée" |
| 409 | Conflit (nom en double) | Afficher "Ce nom existe déjà" |
| 500 | Erreur serveur | Afficher "Erreur serveur, veuillez réessayer" |

### Exemple de Gestion d'Erreurs

```typescript
const updateSubCategory = async (id: number, data: any) => {
  try {
    const response = await fetch(`http://localhost:3004/sub-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          toast.error(`Validation échouée: ${error.message}`);
          break;
        case 404:
          toast.error('Sous-catégorie non trouvée');
          break;
        case 409:
          toast.error('Ce nom existe déjà');
          break;
        default:
          toast.error('Erreur lors de la mise à jour');
      }

      return;
    }

    const result = await response.json();
    toast.success('Sous-catégorie mise à jour avec succès!');
    await refetch(); // Rafraîchir les produits

  } catch (error) {
    toast.error('Erreur réseau, veuillez réessayer');
    console.error(error);
  }
};
```

---

## 📝 Exemples de Requêtes cURL

### Mettre à jour une sous-catégorie

```bash
curl -X PATCH http://localhost:3004/sub-categories/9 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sacs Premium",
    "description": "Collection de sacs premium"
  }'
```

### Mettre à jour une variation

```bash
curl -X PATCH http://localhost:3004/variations/11 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Col V Profond",
    "description": "Col en V profond élégant"
  }'
```

### Récupérer un produit avec ses relations

```bash
curl http://localhost:3004/products/8
```

### Récupérer tous les produits

```bash
curl http://localhost:3004/products
```

---

## ✅ Résumé Final

### Ce qui a été implémenté

1. ✅ **PATCH /sub-categories/:id** - Endpoint pour modifier une sous-catégorie
2. ✅ **PATCH /variations/:id** - Endpoint pour modifier une variation
3. ✅ **Relations Prisma** - Tous les endpoints de produits incluent maintenant `subCategory` et `variation`
4. ✅ **Mise à jour automatique** - Les produits reflètent automatiquement les changements via les relations
5. ✅ **Régénération mockups** - Les mockups sont automatiquement marqués pour régénération
6. ✅ **Validation complète** - Gestion des doublons, existence, format
7. ✅ **Génération automatique du slug** - Le slug est mis à jour automatiquement

### Ce qui est automatique

- 🔄 Mise à jour des relations dans la base de données
- 🔄 Génération des slugs
- 🔄 Propagation aux produits via les relations Prisma
- 🔄 Régénération des mockups en arrière-plan
- 🔄 Mise à jour du timestamp `updatedAt`

### Pour le Frontend

**Aucune action spéciale requise!**

Le frontend continue d'utiliser les endpoints normalement:
- `GET /products` retourne les produits avec les sous-catégories/variations à jour
- `GET /products/:id` retourne le produit avec les relations à jour
- `GET /mockups` retourne les mockups avec les relations à jour
- `PATCH /sub-categories/:id` pour modifier une sous-catégorie
- `PATCH /variations/:id` pour modifier une variation

**Les relations Prisma gèrent automatiquement la cohérence des données!**

---

**Date de création:** 2025-10-15
**Version Backend:** 1.0.0
**Status:** ✅ Production Ready
