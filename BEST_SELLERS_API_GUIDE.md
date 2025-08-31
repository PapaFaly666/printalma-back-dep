# 🏆 Guide API Best Sellers - Documentation Frontend

## 📋 **Vue d'ensemble**

L'API Best Sellers permet de récupérer les meilleurs vendeurs avec toutes les informations nécessaires pour afficher les produits avec leurs designs, délimitations, couleurs, et métadonnées vendeur.

**Base URL:** `http://localhost:3004`

---

## 🎯 **1. ENDPOINT PRINCIPAL**

### **Récupérer les Best Sellers**
```http
GET /public/best-sellers
```

### **Paramètres de Query (Tous optionnels)**

| Paramètre | Type | Valeurs | Description |
|-----------|------|---------|-------------|
| `limit` | number | `1-100` | Nombre de produits à retourner (défaut: 20) |
| `offset` | number | `≥0` | Offset pour pagination (défaut: 0) |
| `category` | string | ex: `"T-shirts"` | Filtrer par catégorie |
| `vendorId` | number | ex: `1` | Filtrer par vendeur spécifique |
| `minSales` | number | `≥1` | Minimum de ventes requises (défaut: 1) |

### **Exemples d'Utilisation**

#### **1. Top 10 best-sellers**
```javascript
const response = await fetch('/public/best-sellers?limit=10');
```

#### **2. Best-sellers d'une catégorie**
```javascript
const response = await fetch('/public/best-sellers?category=T-shirts&limit=5');
```

#### **3. Best-sellers d'un vendeur**
```javascript
const response = await fetch('/public/best-sellers?vendorId=1');
```

#### **4. Pagination**
```javascript
const response = await fetch('/public/best-sellers?limit=20&offset=40');
```

### **Réponse Complète**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Premium avec Design Personnalisé",
      "description": "Un magnifique t-shirt avec design unique",
      "price": 2500,
      "salesCount": 45,
      "totalRevenue": 112500,
      "bestSellerRank": 1,
      "averageRating": 4.8,
      "viewsCount": 1250,
      
      // 🎨 INFORMATIONS DESIGN COMPLÈTES
      "designCloudinaryUrl": "https://res.cloudinary.com/example/design.png",
      "designWidth": 800,
      "designHeight": 600,
      "designFormat": "PNG",
      "designScale": 0.6,
      "designPositioning": "CENTER",
      
      // 📦 PRODUIT DE BASE AVEC DÉLIMITATIONS
      "baseProduct": {
        "id": 10,
        "name": "T-shirt Premium",
        "genre": "HOMME",
        "categories": [
          {
            "id": 1,
            "name": "T-shirts"
          }
        ],
        "colorVariations": [
          {
            "id": 1,
            "name": "Noir",
            "colorCode": "#000000",
            "images": [
              {
                "id": 1,
                "url": "https://res.cloudinary.com/example/tshirt.jpg",
                "view": "Front",
                "naturalWidth": 1000,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 1,
                    "name": "Zone Poitrine",
                    "x": 30,
                    "y": 40,
                    "width": 40,
                    "height": 20
                  }
                ]
              }
            ]
          }
        ]
      },
      
      // 🏪 INFORMATIONS VENDEUR
      "vendor": {
        "id": 5,
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com",
        "profilePhotoUrl": "https://example.com/photo.jpg",
        "businessName": "Designs by Jean"
      },
      
      // 📅 MÉTADONNÉES
      "createdAt": "2024-01-15T10:30:00Z",
      "lastSaleDate": "2024-01-20T14:22:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalBestSellers": 150,
    "categoriesCount": 8,
    "vendorsCount": 45
  }
}
```

---

## 📊 **2. ENDPOINTS STATISTIQUES**

### **2.1 Statistiques Générales**
```http
GET /public/best-sellers/stats
```

**Réponse:**
```json
{
  "success": true,
  "stats": {
    "totalBestSellers": 150,
    "categoriesCount": 8,
    "vendorsCount": 45
  }
}
```

### **2.2 Best-sellers par Vendeur**
```http
GET /public/best-sellers/vendor/:vendorId
```

**Exemple:**
```javascript
const response = await fetch('/public/best-sellers/vendor/1?limit=10');
```

### **2.3 Best-sellers par Catégorie**
```http
GET /public/best-sellers/category/:category
```

**Exemple:**
```javascript
const response = await fetch('/public/best-sellers/category/T-shirts?limit=10');
```

### **2.4 Incrémenter les Vues**
```http
GET /public/best-sellers/product/:productId/view
```

**Réponse:**
```json
{
  "success": true,
  "message": "Vues incrémentées avec succès"
}
```

---

## 🎨 **3. AFFICHAGE DU DESIGN SUR LE PRODUIT**

### **Informations Nécessaires pour Afficher le Design**

Pour afficher correctement un produit avec son design, vous avez besoin de :

#### **3.1 Image du Produit de Base**
```javascript
const baseImage = product.baseProduct.colorVariations[0].images[0];
// URL: baseImage.url
// Dimensions: baseImage.naturalWidth x baseImage.naturalHeight
```

#### **3.2 Design à Superposer**
```javascript
const design = {
  url: product.designCloudinaryUrl,
  width: product.designWidth,
  height: product.designHeight,
  scale: product.designScale,
  positioning: product.designPositioning
};
```

#### **3.3 Zones de Délimitation**
```javascript
const delimitations = baseImage.delimitations;
// Chaque délimitation a: x, y, width, height (en pourcentages)
```

### **Exemple d'Affichage HTML/CSS**
```html
<div class="product-preview" style="position: relative; width: 400px; height: 480px;">
  <!-- Image de base du produit -->
  <img src="{{baseImage.url}}" 
       style="width: 100%; height: 100%; object-fit: cover;" />
  
  <!-- Design superposé -->
  <img src="{{product.designCloudinaryUrl}}" 
       style="position: absolute; 
              left: {{delimitation.x}}%; 
              top: {{delimitation.y}}%; 
              width: {{delimitation.width}}%; 
              height: {{delimitation.height}}%;
              transform: scale({{product.designScale}});" />
  
  <!-- Délimitations (optionnel, pour debug) -->
  <div class="delimitation-overlay" 
       style="position: absolute; 
              left: {{delimitation.x}}%; 
              top: {{delimitation.y}}%; 
              width: {{delimitation.width}}%; 
              height: {{delimitation.height}}%;
              border: 2px dashed rgba(255,0,0,0.5);"></div>
</div>
```

---

## 🔧 **4. INTÉGRATION FRONTEND**

### **4.1 Hook React pour Best Sellers**
```javascript
import { useState, useEffect } from 'react';

function useBestSellers(filters = {}) {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchBestSellers = async () => {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      try {
        const response = await fetch(`/public/best-sellers?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setBestSellers(data.data);
          setStats(data.stats);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Erreur best-sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [filters]);

  return { bestSellers, loading, stats, pagination };
}
```

### **4.2 Composant Produit Best-Seller**
```jsx
function BestSellerProduct({ product, onView }) {
  const handleView = () => {
    // Incrémenter les vues
    fetch(`/public/best-sellers/product/${product.id}/view`);
    if (onView) onView(product);
  };

  return (
    <div className="best-seller-card" onClick={handleView}>
      <div className="rank-badge">#{product.bestSellerRank}</div>
      
      <div className="product-preview">
        <ProductWithDesign product={product} />
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">{product.price}€</p>
        
        <div className="stats">
          <span>💰 {product.salesCount} ventes</span>
          <span>👀 {product.viewsCount} vues</span>
          <span>⭐ {product.averageRating}/5</span>
        </div>
        
        <div className="vendor">
          Par {product.vendor.firstName} {product.vendor.lastName}
        </div>
      </div>
    </div>
  );
}
```

### **4.3 Composant d'Affichage Produit + Design**
```jsx
function ProductWithDesign({ product }) {
  const baseImage = product.baseProduct.colorVariations[0]?.images[0];
  const delimitation = baseImage?.delimitations[0];
  
  if (!baseImage || !product.designCloudinaryUrl) {
    return <img src={baseImage?.url} alt={product.name} />;
  }

  return (
    <div className="product-with-design" style={{ position: 'relative' }}>
      {/* Image de base */}
      <img 
        src={baseImage.url} 
        alt={product.baseProduct.name}
        style={{ width: '100%', height: 'auto' }}
      />
      
      {/* Design superposé */}
      {delimitation && (
        <img 
          src={product.designCloudinaryUrl}
          alt="Design personnalisé"
          style={{
            position: 'absolute',
            left: `${delimitation.x}%`,
            top: `${delimitation.y}%`,
            width: `${delimitation.width}%`,
            height: `${delimitation.height}%`,
            transform: `scale(${product.designScale || 0.6})`,
            transformOrigin: 'center center'
          }}
        />
      )}
    </div>
  );
}
```

---

## 📱 **5. EXEMPLES D'UTILISATION MOBILE**

### **5.1 Carrousel Best Sellers**
```jsx
function BestSellersCarousel() {
  const { bestSellers, loading } = useBestSellers({ limit: 10 });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="best-sellers-carousel">
      <h2>🏆 Nos Best Sellers</h2>
      <div className="carousel-container">
        {bestSellers.map(product => (
          <BestSellerProduct 
            key={product.id} 
            product={product}
            onView={(product) => {
              // Navigation vers la page produit
              navigate(`/product/${product.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### **5.2 Page Landing Best Sellers**
```jsx
function BestSellersLanding() {
  const [filters, setFilters] = useState({ limit: 20, offset: 0 });
  const { bestSellers, loading, stats, pagination } = useBestSellers(filters);

  return (
    <div className="best-sellers-page">
      <header className="hero">
        <h1>🏆 Nos Meilleurs Vendeurs</h1>
        <div className="stats">
          <span>{stats.totalBestSellers} Best Sellers</span>
          <span>{stats.vendorsCount} Vendeurs</span>
          <span>{stats.categoriesCount} Catégories</span>
        </div>
      </header>

      <div className="filters">
        <CategoryFilter onChange={(cat) => setFilters({...filters, category: cat})} />
        <VendorFilter onChange={(vendor) => setFilters({...filters, vendorId: vendor})} />
      </div>

      <div className="products-grid">
        {bestSellers.map(product => (
          <BestSellerProduct key={product.id} product={product} />
        ))}
      </div>

      <Pagination 
        pagination={pagination}
        onPageChange={(offset) => setFilters({...filters, offset})}
      />
    </div>
  );
}
```

---

## 🚀 **6. INITIALISATION DES DONNÉES**

Pour tester l'API, initialisez des données de test :

```bash
# Exécuter le script d'initialisation
node init-best-sellers-data.js

# Ou via l'API (si endpoint admin disponible)
POST /admin/best-sellers/force-update-ranking
```

---

## 🎯 **7. POINTS CLÉS POUR L'AFFICHAGE**

### **✅ Informations Complètes Disponibles**
- ✅ **Design** : URL, dimensions, format, échelle, positionnement
- ✅ **Produit de base** : Images, couleurs, délimitations, genre
- ✅ **Vendeur** : Nom, email, photo, entreprise
- ✅ **Statistiques** : Ventes, CA, vues, notes, rang
- ✅ **Métadonnées** : Dates, catégories

### **🎨 Rendu Visuel Parfait**
- Superposition précise du design sur le produit
- Respect des délimitations et proportions
- Affichage des couleurs disponibles
- Informations vendeur et statistiques

### **📱 Optimisé Mobile**
- Responsive design
- Chargement optimisé
- Pagination fluide
- Interactions tactiles

---

## 🔧 **8. DÉPANNAGE**

### **Problèmes Courants**
| Problème | Solution |
|----------|----------|
| Aucun best-seller | Exécuter `init-best-sellers-data.js` |
| Design mal positionné | Vérifier les délimitations et `designScale` |
| Images manquantes | Vérifier les URLs Cloudinary |
| Pagination cassée | Vérifier `offset` et `limit` |

### **Logs Utiles**
```javascript
console.log('Best-sellers chargés:', bestSellers.length);
console.log('Stats:', stats);
console.log('Design info:', product.designCloudinaryUrl);
console.log('Délimitations:', baseImage.delimitations);
```

---

## 📞 **Support**

**Endpoint de test:** `http://localhost:3004/public/best-sellers`  
**Page de test:** `test-best-sellers.html`  
**Script d'init:** `init-best-sellers-data.js`

L'API est maintenant prête pour afficher parfaitement tous les best-sellers avec leurs designs ! 🏆 