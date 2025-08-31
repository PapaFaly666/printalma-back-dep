# 🏆 Guide Frontend - Affichage des Meilleures Ventes

## 📋 Vue d'ensemble

Ce guide explique comment intégrer et afficher les meilleures ventes dans votre application frontend en utilisant l'API backend Printalma.

## 🚀 Endpoint Principal

```
GET /public/best-sellers
```

**URL de base :** `http://localhost:3004/public/best-sellers`

## 🔧 Paramètres de Requête

| Paramètre | Type | Requis | Description | Défaut |
|-----------|------|--------|-------------|---------|
| `limit` | number | ❌ | Nombre de produits à récupérer | 10 |
| `vendorId` | number | ❌ | Filtrer par vendeur spécifique | Tous |
| `category` | string | ❌ | Filtrer par catégorie | Toutes |
| `minSales` | number | ❌ | Ventes minimum requises | 1 |

## 📊 Structure de la Réponse

### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Meilleures ventes récupérées",
  "data": {
    "bestSellers": [
      {
        "id": 1,
        "vendorName": "Nom du Produit",
        "price": 2500,
        "status": "PUBLISHED",
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 45,
          "totalRevenue": 112500
        },
        "bestSellerRank": 1,
        "adminProduct": {
          "id": 1,
          "name": "T-shirt Basique",
          "genre": "UNISEX",
          "categories": [
            {
              "id": 1,
              "name": "Vêtements"
            }
          ]
        },
        "vendor": {
          "id": 1,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "businessName": "Boutique John"
        }
      }
    ],
    "total": 3
  }
}
```

### Réponse Erreur (4xx/5xx)
```json
{
  "success": false,
  "message": "Message d'erreur",
  "error": "Détails de l'erreur"
}
```

## 🎯 Cas d'Usage Frontend

### 1. Affichage Simple des Meilleures Ventes
```typescript
// Récupération des 10 meilleures ventes
const fetchBestSellers = async () => {
  try {
    const response = await fetch('http://localhost:3004/public/best-sellers');
    const data = await response.json();
    
    if (data.success) {
      return data.data.bestSellers;
    }
  } catch (error) {
    console.error('Erreur récupération meilleures ventes:', error);
  }
};
```

### 2. Affichage avec Pagination
```typescript
// Récupération avec limite et offset
const fetchBestSellersPaginated = async (limit: number = 10, offset: number = 0) => {
  try {
    const url = `http://localhost:3004/public/best-sellers?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return {
        products: data.data.bestSellers,
        pagination: data.data.pagination
      };
    }
  } catch (error) {
    console.error('Erreur récupération meilleures ventes:', error);
  }
};
```

### 3. Filtrage par Vendeur
```typescript
// Récupération des meilleures ventes d'un vendeur spécifique
const fetchBestSellersByVendor = async (vendorId: number) => {
  try {
    const url = `http://localhost:3004/public/best-sellers?vendorId=${vendorId}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data.bestSellers;
    }
  } catch (error) {
    console.error('Erreur récupération meilleures ventes:', error);
  }
};
```

### 4. Filtrage par Catégorie
```typescript
// Récupération des meilleures ventes d'une catégorie
const fetchBestSellersByCategory = async (category: string) => {
  try {
    const url = `http://localhost:3004/public/best-sellers?category=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data.bestSellers;
    }
  } catch (error) {
    console.error('Erreur récupération meilleures ventes:', error);
  }
};
```

## 🎨 Composants Frontend Recommandés

### 1. Composant BestSellersList
```typescript
interface BestSellerProduct {
  id: number;
  vendorName: string;
  price: number;
  bestSeller: {
    isBestSeller: boolean;
    salesCount: number;
    totalRevenue: number;
  };
  bestSellerRank: number;
  adminProduct: {
    name: string;
    categories: Array<{ name: string }>;
  };
  designApplication: {
    hasDesign: boolean;
    designUrl?: string;
  };
  vendor: {
    firstName: string;
    lastName: string;
    businessName?: string;
  };
}

const BestSellersList: React.FC = () => {
  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      const products = await fetchBestSellers();
      setBestSellers(products);
    } catch (err) {
      setError('Erreur lors du chargement des meilleures ventes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement des meilleures ventes...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="best-sellers-container">
      <h2>🏆 Meilleures Ventes</h2>
      <div className="best-sellers-grid">
        {bestSellers.map((product) => (
          <BestSellerCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

### 2. Composant BestSellerCard
```typescript
const BestSellerCard: React.FC<{ product: BestSellerProduct }> = ({ product }) => {
  return (
    <div className="best-seller-card">
      {/* Badge de rang */}
      <div className="rank-badge rank-{product.bestSellerRank}">
        #{product.bestSellerRank}
      </div>
      
      {/* Image du produit */}
      <div className="product-image">
        {product.designApplication.hasDesign ? (
          <img 
            src={product.designApplication.designUrl} 
            alt={product.vendorName}
            className="design-preview"
          />
        ) : (
          <div className="no-design-placeholder">
            {product.adminProduct.name}
          </div>
        )}
      </div>
      
      {/* Informations du produit */}
      <div className="product-info">
        <h3 className="product-name">{product.vendorName}</h3>
        <p className="product-category">
          {product.adminProduct.categories.map(cat => cat.name).join(', ')}
        </p>
        <p className="product-price">{product.price} FCFA</p>
        
        {/* Statistiques de vente */}
        <div className="sales-stats">
          <span className="sales-count">
            📦 {product.bestSeller.salesCount} ventes
          </span>
          <span className="revenue">
            💰 {product.bestSeller.totalRevenue} FCFA
          </span>
        </div>
        
        {/* Informations vendeur */}
        <div className="vendor-info">
          <span className="vendor-name">
            {product.vendor.firstName} {product.vendor.lastName}
          </span>
          {product.vendor.businessName && (
            <span className="business-name">
              {product.vendor.businessName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

## 🎨 Styles CSS Recommandés

### 1. Container Principal
```css
.best-sellers-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.best-sellers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
```

### 2. Carte de Produit
```css
.best-seller-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.best-seller-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.rank-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  z-index: 10;
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ffb347); }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #a8a8a8); }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #b8860b); }
```

### 3. Image et Informations
```css
.product-image {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.design-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-design-placeholder {
  color: #6c757d;
  font-size: 1.1rem;
  text-align: center;
}

.product-info {
  padding: 1.5rem;
}

.product-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.product-category {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.product-price {
  font-size: 1.3rem;
  font-weight: 700;
  color: #e74c3c;
  margin: 0 0 1rem 0;
}
```

### 4. Statistiques et Vendeur
```css
.sales-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.sales-count, .revenue {
  background: #f8f9fa;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #495057;
}

.vendor-info {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
  text-align: center;
}

.vendor-name {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.business-name {
  display: block;
  font-size: 0.9rem;
  color: #6c757d;
}
```

## 🔄 Gestion des États

### 1. État de Chargement
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
```

### 2. Gestion des Erreurs
```typescript
const handleError = (error: any) => {
  console.error('Erreur API:', error);
  
  if (error.response?.status === 404) {
    setError('Aucune meilleure vente trouvée');
  } else if (error.response?.status === 500) {
    setError('Erreur serveur, veuillez réessayer');
  } else {
    setError('Erreur de connexion');
  }
};
```

### 3. Rafraîchissement des Données
```typescript
const refreshData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const products = await fetchBestSellers();
    setBestSellers(products);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
};
```

## 📱 Responsive Design

### 1. Breakpoints CSS
```css
/* Mobile */
@media (max-width: 768px) {
  .best-sellers-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .best-sellers-container {
    padding: 1rem;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .best-sellers-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .best-sellers-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }
}
```

## 🚀 Optimisations Recommandées

### 1. Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const BestSellerCard = lazy(() => import('./BestSellerCard'));

// Dans le composant principal
<Suspense fallback={<div>Chargement...</div>}>
  {bestSellers.map((product) => (
    <BestSellerCard key={product.id} product={product} />
  ))}
</Suspense>
```

### 2. Mise en Cache
```typescript
const useBestSellers = () => {
  const [data, setData] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = localStorage.getItem('bestSellers');
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    }
    
    fetchBestSellers().then(products => {
      setData(products);
      localStorage.setItem('bestSellers', JSON.stringify(products));
      setLoading(false);
    });
  }, []);
  
  return { data, loading };
};
```

### 3. Debounce pour la Recherche
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce((query: string) => {
  // Logique de recherche
}, 300);
```

## 🧪 Tests et Debugging

### 1. Console Logs
```typescript
useEffect(() => {
  console.log('🏆 Meilleures ventes chargées:', bestSellers);
  console.log('📊 Total:', bestSellers.length);
}, [bestSellers]);
```

### 2. Validation des Données
```typescript
const validateProduct = (product: any): product is BestSellerProduct => {
  return (
    product.id &&
    product.vendorName &&
    product.price &&
    product.bestSeller?.isBestSeller !== undefined
  );
};

const validProducts = bestSellers.filter(validateProduct);
```

## 📚 Ressources Supplémentaires

- **Documentation API Swagger :** `http://localhost:3004/api-docs`
- **Schéma Prisma :** `prisma/schema.prisma`
- **Tests API :** Utilisez Postman ou Insomnia pour tester les endpoints

## 🆘 Support et Dépannage

### Problèmes Courants

1. **CORS :** Vérifiez que le backend autorise les requêtes depuis votre domaine frontend
2. **Authentification :** L'endpoint `/public/best-sellers` est public, aucune authentification requise
3. **Format des Données :** Vérifiez que les données correspondent à l'interface `BestSellerProduct`

### Logs Backend
```bash
# Vérifier les logs du service
tail -f logs/best-sellers.log

# Vérifier les requêtes API
tail -f logs/api.log
```

---

**🎯 Objectif :** Créer une expérience utilisateur fluide et attrayante pour afficher les meilleures ventes avec des composants réactifs et un design moderne.

**📝 Note :** Ce guide couvre les fonctionnalités principales. Adaptez le code selon vos besoins spécifiques et votre framework frontend (React, Vue, Angular, etc.). 