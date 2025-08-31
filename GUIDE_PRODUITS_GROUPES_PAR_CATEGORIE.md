# Guide Système Produits Groupés par Catégorie

## Vue d'ensemble

Ce système permet d'organiser et d'afficher les produits vendeurs groupés par type de produit de base (Tshirt, Casquette, Mug, etc.). Il répond au besoin d'avoir une vue structurée des produits par catégorie avec toutes les informations détaillées.

## Fonctionnalités

### ✅ Backend
- **Endpoint sécurisé** : `GET /api/vendor/products/grouped`
- **Groupement automatique** par `baseProduct.name`
- **Filtrage avancé** : statut, recherche, vendeur spécifique
- **Images organisées** par couleur
- **Statistiques complètes** de répartition
- **Documentation Swagger** intégrée

### ✅ Frontend (Exemple)
- **Interface moderne** avec TailwindCSS
- **Filtres interactifs** en temps réel
- **Aperçu des images** par couleur
- **Statistiques visuelles** des catégories
- **Responsive design** mobile/desktop

## Architecture

### Structure de données

```typescript
{
  success: boolean,
  data: {
    [baseProductName: string]: VendorProduct[]
  },
  statistics: {
    totalProducts: number,
    totalGroups: number,
    groupCounts: Record<string, number>
  }
}
```

### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "Tshirt": [
      {
        "id": 1,
        "vendorName": "T-shirt Rouge Flamme Design",
        "price": 15000,
        "selectedSizes": [
          { "id": 1, "sizeName": "S" },
          { "id": 2, "sizeName": "M" }
        ],
        "selectedColors": [
          { "id": 12, "name": "Rouge", "colorCode": "#ff0000" }
        ],
        "images": {
          "total": 3,
          "colorImages": {
            "Rouge": [
              {
                "id": 101,
                "url": "https://res.cloudinary.com/...",
                "colorName": "Rouge",
                "colorCode": "#ff0000"
              }
            ]
          },
          "primaryImageUrl": "https://res.cloudinary.com/..."
        },
        "vendor": {
          "id": 5,
          "fullName": "Jean Durand",
          "shop_name": "Boutique Design JD"
        }
      }
    ],
    "Casquette": [...]
  },
  "statistics": {
    "totalProducts": 15,
    "totalGroups": 3,
    "groupCounts": {
      "Tshirt": 8,
      "Casquette": 5,
      "Mug": 2
    }
  }
}
```

## Utilisation de l'API

### Endpoint principal

```http
GET /api/vendor/products/grouped
Authorization: Bearer <token>
```

### Paramètres optionnels

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `vendorId` | number | ID du vendeur spécifique | `?vendorId=5` |
| `status` | string | Statut des produits | `?status=PUBLISHED` |
| `search` | string | Terme de recherche | `?search=shirt` |

### Exemples d'appels

```bash
# Tous les produits groupés
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vendor/products/grouped

# Produits publiés uniquement
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/vendor/products/grouped?status=PUBLISHED"

# Produits d'un vendeur spécifique
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/vendor/products/grouped?vendorId=5"

# Recherche dans les produits
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/vendor/products/grouped?search=rouge"
```

## Intégration Frontend

### Installation des dépendances

```bash
npm install axios
# Pour le style (optionnel)
npm install tailwindcss
```

### Service API

```javascript
import axios from 'axios';

export const ProductsAPI = {
  async getGroupedProducts(filters = {}) {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });

    const response = await axios.get(`/api/vendor/products/grouped?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  }
};
```

### Utilisation dans un composant React

```jsx
import React, { useState, useEffect } from 'react';
import { ProductsAPI } from './services/ProductsAPI';

const ProductsPage = () => {
  const [groupedProducts, setGroupedProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await ProductsAPI.getGroupedProducts();
        setGroupedProducts(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {Object.entries(groupedProducts).map(([category, products]) => (
        <div key={category}>
          <h2>{category}s ({products.length})</h2>
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.vendorName}</h3>
              <p>Prix: {product.price.toLocaleString()} FCFA</p>
              <p>Vendeur: {product.vendor.fullName}</p>
              
              {/* Tailles */}
              <div>
                Tailles: {product.selectedSizes.map(s => s.sizeName).join(', ')}
              </div>
              
              {/* Couleurs */}
              <div>
                Couleurs: {product.selectedColors.map(c => c.name).join(', ')}
              </div>
              
              {/* Image principale */}
              {product.images.primaryImageUrl && (
                <img src={product.images.primaryImageUrl} alt={product.vendorName} />
              )}
              
              {/* Images par couleur */}
              <div>
                {Object.entries(product.images.colorImages).map(([colorName, images]) => (
                  <div key={colorName}>
                    <span>{colorName}: {images.length} image(s)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

## Cas d'usage

### 1. Page d'administration des produits

```javascript
// Voir tous les produits groupés par catégorie
const adminDashboard = async () => {
  const products = await ProductsAPI.getGroupedProducts();
  
  console.log('Statistiques:', products.statistics);
  // { totalProducts: 25, totalGroups: 4, groupCounts: {...} }
  
  Object.entries(products.data).forEach(([category, items]) => {
    console.log(`${category}: ${items.length} produits`);
  });
};
```

### 2. Page profil vendeur

```javascript
// Voir uniquement les produits d'un vendeur
const vendorProfile = async (vendorId) => {
  const products = await ProductsAPI.getGroupedProducts({ vendorId });
  
  // Afficher ses produits par catégorie
  return products.data;
};
```

### 3. Catalogue public avec filtres

```javascript
// Recherche et filtrage
const publicCatalog = async (filters) => {
  const products = await ProductsAPI.getGroupedProducts({
    status: 'PUBLISHED',
    search: filters.searchTerm
  });
  
  return products.data;
};
```

## Tests et validation

### Lancer les tests

```bash
# Test de l'API
node test-vendor-products-grouped.js

# Vérifier les endpoints
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vendor/products/grouped
```

### Points de contrôle

✅ **Sécurité** : Authentification JWT requise  
✅ **Performance** : Requête unique avec jointures optimisées  
✅ **Structure** : Données groupées correctement par baseProduct.name  
✅ **Images** : Organisation par couleur fonctionnelle  
✅ **Filtres** : Tous les paramètres de recherche opérationnels  
✅ **Documentation** : Swagger UI intégrée  

## Déploiement

### 1. Vérifier les modifications

```bash
# Vérifier que les nouveaux endpoints sont présents
git diff HEAD~1 src/vendor-product/vendor-publish.controller.ts
git diff HEAD~1 src/vendor-product/vendor-publish.service.ts
```

### 2. Tester en développement

```bash
npm run start:dev
node test-vendor-products-grouped.js
```

### 3. Déployer en production

```bash
npm run build
npm run start:prod
```

## Structure des fichiers créés

```
├── src/vendor-product/
│   ├── vendor-publish.controller.ts    (+ endpoint grouped)
│   └── vendor-publish.service.ts       (+ méthode groupement)
├── test-vendor-products-grouped.js     (tests complets)
├── example-frontend-grouped-products.jsx (exemple React)
└── GUIDE_PRODUITS_GROUPES_PAR_CATEGORIE.md (ce guide)
```

## Avantages du système

### 🎯 **Organisation claire**
- Produits groupés par type de base produit
- Navigation intuitive par catégorie
- Vue d'ensemble des stocks par type

### 🚀 **Performance optimisée**
- Une seule requête pour tous les produits
- Jointures efficaces avec Prisma
- Pas de requêtes N+1

### 🎨 **Images bien organisées**
- Regroupement par couleur automatique
- URL principale pour affichage rapide
- Aperçu multi-couleurs disponible

### 🔍 **Filtrage puissant**
- Par statut de publication
- Par vendeur spécifique
- Recherche textuelle globale

### 📊 **Statistiques utiles**
- Nombre total de produits
- Répartition par catégorie
- Métriques de performance

## Maintenance

### Logs et monitoring

```javascript
// Les logs sont automatiquement générés
console.log('📊 Trouvé 25 produits à grouper');
console.log('✅ Produits groupés avec succès:');
console.log('   📦 Tshirt: 8 produits');
console.log('   📦 Casquette: 5 produits');
```

### Gestion des erreurs

```javascript
try {
  const products = await ProductsAPI.getGroupedProducts();
} catch (error) {
  if (error.response?.status === 401) {
    // Rediriger vers login
  } else if (error.response?.status === 400) {
    // Afficher message d'erreur
  }
}
```

## Support et évolutions

### Version actuelle : 1.0

**Fonctionnalités disponibles :**
- Groupement par baseProduct.name ✅
- Filtrage multi-critères ✅
- Images organisées par couleur ✅
- Documentation Swagger ✅
- Exemple d'intégration frontend ✅

**Évolutions prévues :**
- Tri personnalisé des groupes
- Export des données groupées
- Cache pour améliorer les performances
- Notifications temps réel des nouveaux produits

---

## Contact

Pour questions ou support sur ce système :
- 📧 Email de support du projet
- 📚 Documentation Swagger : `http://localhost:3000/api`
- 🧪 Tests : `node test-vendor-products-grouped.js` 