# Guide API - Gestion des Produits dans les Thèmes

## Vue d'ensemble

Ce guide documente les endpoints pour gérer les produits dans les thèmes. Ces endpoints permettent d'ajouter, récupérer et supprimer des produits prêts à des thèmes.

## Endpoints Disponibles

### 1. Ajouter des Produits à un Thème

**Endpoint:** `POST /api/themes/:id/products`

**Description:** Ajoute des produits à un thème spécifique.

**Paramètres de chemin:**
- `id` (number): ID du thème

**Corps de la requête:**
```json
{
  "productIds": [1, 2, 3],
  "productStatus": "READY",
  "category": "tshirt"
}
```

**Paramètres:**
- `productIds` (number[]): Liste des IDs des produits à ajouter
- `productStatus` (string, optionnel): Filtrer par statut des produits ('DRAFT', 'PUBLISHED', 'READY')
- `category` (string, optionnel): Filtrer par catégorie de produits

**Réponse de succès (200):**
```json
{
  "success": true,
  "message": "Produits ajoutés au thème avec succès",
  "data": {
    "added": 2,
    "alreadyExists": 1,
    "total": 3,
    "themeId": 4,
    "productCount": 15
  }
}
```

**Codes d'erreur:**
- `404`: Thème non trouvé
- `400`: Données invalides ou aucun produit trouvé

### 2. Récupérer les Produits Disponibles pour un Thème

**Endpoint:** `GET /api/themes/:id/available-products`

**Description:** Récupère la liste des produits disponibles pour être ajoutés à un thème (exclut les produits déjà dans le thème).

**Paramètres de chemin:**
- `id` (number): ID du thème

**Paramètres de requête:**
- `status` (string, optionnel): Filtrer par statut ('DRAFT', 'PUBLISHED', 'READY')
- `category` (string, optionnel): Filtrer par catégorie
- `search` (string, optionnel): Rechercher par nom de produit
- `limit` (number, optionnel): Nombre de produits à retourner (défaut: 20)
- `offset` (number, optionnel): Offset pour la pagination (défaut: 0)

**Exemple de requête:**
```
GET /api/themes/4/available-products?status=READY&limit=10&offset=0
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirt Basic",
      "price": 25.99,
      "status": "READY",
      "isReadyProduct": true,
      "description": "T-shirt en coton de qualité",
      "categories": ["tshirt", "vetements"],
      "mainImage": "https://res.cloudinary.com/...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Codes d'erreur:**
- `404`: Thème non trouvé

### 3. Récupérer les Produits d'un Thème

**Endpoint:** `GET /api/themes/:id/products`

**Description:** Récupère la liste des produits d'un thème avec filtres et tri.

**Paramètres de chemin:**
- `id` (number): ID du thème

**Paramètres de requête:**
- `status` (string, optionnel): Filtrer par statut ('DRAFT', 'PUBLISHED', 'READY')
- `category` (string, optionnel): Filtrer par catégorie
- `search` (string, optionnel): Rechercher par nom de produit
- `limit` (number, optionnel): Nombre de produits à retourner (défaut: 20)
- `offset` (number, optionnel): Offset pour la pagination (défaut: 0)
- `sort` (string, optionnel): Trier par champ ('name', 'price', 'createdAt')
- `order` (string, optionnel): Ordre de tri ('asc', 'desc')

**Exemple de requête:**
```
GET /api/themes/4/products?status=READY&sort=name&order=asc&limit=10
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirt Basic",
      "price": 25.99,
      "status": "READY",
      "isReadyProduct": true,
      "description": "T-shirt en coton de qualité",
      "categories": ["tshirt", "vetements"],
      "mainImage": "https://res.cloudinary.com/...",
      "addedToThemeAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "theme": {
    "id": 4,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas",
    "coverImage": "https://res.cloudinary.com/...",
    "category": "anime",
    "status": "active",
    "featured": false
  }
}
```

**Codes d'erreur:**
- `404`: Thème non trouvé

### 4. Supprimer des Produits d'un Thème

**Endpoint:** `DELETE /api/themes/:id/products`

**Description:** Supprime des produits d'un thème spécifique.

**Paramètres de chemin:**
- `id` (number): ID du thème

**Corps de la requête:**
```json
{
  "productIds": [1, 2, 3]
}
```

**Paramètres:**
- `productIds` (number[]): Liste des IDs des produits à supprimer du thème

**Réponse de succès (200):**
```json
{
  "success": true,
  "message": "Produits supprimés du thème avec succès",
  "data": {
    "removed": 2,
    "notFound": 1,
    "total": 3,
    "themeId": 4,
    "productCount": 13
  }
}
```

**Codes d'erreur:**
- `404`: Thème non trouvé
- `400`: Données invalides

## Cas d'Usage

### 1. Gestion Complète des Produits de Thème

```javascript
// 1. Récupérer les produits disponibles
const availableProducts = await fetch('/api/themes/4/available-products?status=READY');

// 2. Ajouter des produits au thème
const addResponse = await fetch('/api/themes/4/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productIds: [1, 2, 3],
    productStatus: 'READY'
  })
});

// 3. Récupérer les produits du thème
const themeProducts = await fetch('/api/themes/4/products?sort=name&order=asc');

// 4. Supprimer des produits du thème
const removeResponse = await fetch('/api/themes/4/products', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productIds: [1, 2]
  })
});
```

### 2. Interface de Sélection de Produits

```javascript
// Récupérer les produits disponibles avec filtres
const getAvailableProducts = async (themeId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/themes/${themeId}/available-products?${params}`);
  return response.json();
};

// Ajouter des produits sélectionnés
const addSelectedProducts = async (themeId, productIds) => {
  const response = await fetch(`/api/themes/${themeId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productIds,
      productStatus: 'READY'
    })
  });
  return response.json();
};
```

### 3. Gestion des Produits de Thème avec Tri et Filtres

```javascript
// Récupérer les produits du thème avec tri
const getThemeProducts = async (themeId, options = {}) => {
  const params = new URLSearchParams({
    sort: options.sort || 'createdAt',
    order: options.order || 'desc',
    limit: options.limit || 20,
    offset: options.offset || 0,
    ...options.filters
  });
  
  const response = await fetch(`/api/themes/${themeId}/products?${params}`);
  return response.json();
};
```

## Validation et Sécurité

### Validation des Données

- Les produits doivent exister dans la base de données
- Les produits supprimés (soft delete) sont automatiquement exclus
- Les produits déjà dans le thème sont ignorés lors de l'ajout (pas d'erreur)
- Les produits non trouvés dans le thème sont ignorés lors de la suppression

### Gestion des Erreurs

- **Produits non trouvés:** Retourne une erreur 400 si aucun produit correspond aux critères
- **Thème inexistant:** Retourne une erreur 404
- **Données invalides:** Retourne une erreur 400 avec les détails

### Performance

- Utilisation de `createMany` et `deleteMany` pour les opérations en lot
- Index sur les relations pour optimiser les requêtes
- Pagination pour éviter les surcharges mémoire
- Tri et filtres optimisés au niveau de la base de données

## Tests

Un script de test complet est disponible : `test-theme-products.js`

```bash
node test-theme-products.js
```

Ce script teste :
1. La récupération des détails d'un thème
2. La récupération des produits disponibles
3. L'ajout de produits au thème
4. La récupération des produits du thème
5. La suppression de produits du thème

## Migration et Compatibilité

### Changements dans la Base de Données

Aucune migration requise - les tables `Theme` et `ThemeProduct` existent déjà.

### Compatibilité API

- Les endpoints existants restent inchangés
- Nouveaux endpoints ajoutés sans impact sur l'existant
- Format de réponse cohérent avec l'API existante

## Exemples Frontend

### React/JavaScript

```javascript
// Hook personnalisé pour gérer les produits de thème
const useThemeProducts = (themeId) => {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [themeProducts, setThemeProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableProducts = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/themes/${themeId}/available-products?${params}`);
      const data = await response.json();
      setAvailableProducts(data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeProducts = async (options = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(options);
      const response = await fetch(`/api/themes/${themeId}/products?${params}`);
      const data = await response.json();
      setThemeProducts(data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits du thème:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProductsToTheme = async (productIds) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          productStatus: 'READY'
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      throw error;
    }
  };

  const removeProductsFromTheme = async (productIds) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression des produits:', error);
      throw error;
    }
  };

  return {
    availableProducts,
    themeProducts,
    loading,
    fetchAvailableProducts,
    fetchThemeProducts,
    addProductsToTheme,
    removeProductsFromTheme
  };
};
```

### Vue.js

```javascript
// Composable pour Vue 3
export const useThemeProducts = (themeId) => {
  const availableProducts = ref([]);
  const themeProducts = ref([]);
  const loading = ref(false);

  const fetchAvailableProducts = async (filters = {}) => {
    loading.value = true;
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/themes/${themeId}/available-products?${params}`);
      const data = await response.json();
      availableProducts.value = data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchThemeProducts = async (options = {}) => {
    loading.value = true;
    try {
      const params = new URLSearchParams(options);
      const response = await fetch(`/api/themes/${themeId}/products?${params}`);
      const data = await response.json();
      themeProducts.value = data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits du thème:', error);
    } finally {
      loading.value = false;
    }
  };

  const addProductsToTheme = async (productIds) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          productStatus: 'READY'
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      throw error;
    }
  };

  const removeProductsFromTheme = async (productIds) => {
    try {
      const response = await fetch(`/api/themes/${themeId}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression des produits:', error);
      throw error;
    }
  };

  return {
    availableProducts: readonly(availableProducts),
    themeProducts: readonly(themeProducts),
    loading: readonly(loading),
    fetchAvailableProducts,
    fetchThemeProducts,
    addProductsToTheme,
    removeProductsFromTheme
  };
};
```

## Support et Maintenance

### Logs et Monitoring

- Toutes les opérations sont loggées
- Métriques de performance disponibles
- Alertes en cas d'erreurs répétées

### Mise à Jour

- Les nouveaux endpoints sont rétrocompatibles
- Aucune modification requise pour les clients existants
- Documentation mise à jour automatiquement via Swagger

### Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Utiliser le script de test pour diagnostiquer
3. Consulter la documentation Swagger à `/api/docs` 