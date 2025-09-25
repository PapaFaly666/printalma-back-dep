# 🎯 Guide Frontend - API Admin Products Validation

## 📋 Vue d'ensemble

Ce guide complet explique l'utilisation de l'endpoint principal de validation des produits admin pour l'interface frontend. L'endpoint permet de récupérer, filtrer et gérer les produits en attente de validation (WIZARD et TRADITIONAL).

## 🔗 Endpoint Principal

```
GET http://localhost:3004/vendor-product/admin/products/validation
```

**⚠️ Note importante**: Le serveur fonctionne actuellement sur le port 3000, mais l'endpoint documenté utilise le port 3004. Vérifiez la configuration de votre serveur.

## 🔐 Authentification

```typescript
// Headers requis
const headers = {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

**Rôles requis**: `ADMIN` ou `SUPERADMIN`

## 📥 Paramètres de requête (Query Parameters)

| Paramètre | Type | Obligatoire | Valeur par défaut | Description |
|-----------|------|-------------|-------------------|-------------|
| `page` | number | Non | 1 | Numéro de page pour la pagination |
| `limit` | number | Non | 20 | Nombre d'éléments par page (max recommandé: 50) |
| `productType` | string | Non | 'ALL' | Filtrer par type: `WIZARD`, `TRADITIONAL`, `ALL` |
| `vendor` | string | Non | - | Filtrer par nom/email/boutique du vendeur |
| `status` | string | Non | 'ALL' | Filtrer par statut: `PENDING`, `APPROVED`, `REJECTED`, `VALIDATED` |

### Exemples d'utilisation des filtres

```typescript
// Récupérer tous les produits (page 1, 20 éléments)
const url1 = '/admin/products/validation';

// Récupérer les produits WIZARD en attente
const url2 = '/admin/products/validation?productType=WIZARD&status=PENDING';

// Rechercher les produits d'un vendeur spécifique
const url3 = '/admin/products/validation?vendor=papa&page=1&limit=10';

// Récupérer les produits validés avec pagination
const url4 = '/admin/products/validation?status=APPROVED&page=2&limit=25';
```

## 📤 Format de réponse

### Structure générale

```typescript
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: Pagination;
    stats: Statistics;
  } | null;
}
```

### Interface TypeScript complète

```typescript
// Interfaces pour la réponse de l'API
interface Product {
  // Informations de base
  id: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  baseProductId: number;

  // Couleurs et tailles sélectionnées par le vendeur
  colors: Color[];
  sizes: Size[];

  // Informations de statut
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  isValidated: boolean;
  validatedAt: string | null;
  validatedBy: number | null;
  postValidationAction: string;

  // Design et images
  designCloudinaryUrl: string | null;
  rejectionReason: string | null;

  // 🆕 Nouvelles propriétés pour la distinction WIZARD/TRADITIONAL
  isWizardProduct: boolean;
  productType: 'WIZARD' | 'TRADITIONAL';
  hasDesign: boolean;
  adminProductName: string;

  // 🆕 Champs de validation admin pour produits WIZARD
  adminValidated: boolean | null; // true/false pour WIZARD, null pour TRADITIONAL
  isRejected: boolean;
  rejectedAt: string | null;
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';

  // Produit de base enrichi
  baseProduct: {
    id: number;
    name: string;
    mockupImages: MockupImage[];
    colorVariations: ColorVariation[];
    sizes: Size[];
  };

  // Détails complets du produit admin (pour affichage)
  adminProductDetails: {
    id: number;
    name: string;
    description: string;
    price: number;
    categories: Category[];
    colorVariations: ColorVariation[];
    sizes: Size[];
    totalColors: number;
    totalSizes: number;
    mockupImages: MockupImage[];
  };

  // Images personnalisées du vendeur (pour produits WIZARD)
  vendorImages: VendorImage[];

  // Couleurs et tailles sélectionnées (enrichies)
  selectedColors: Color[];
  selectedSizes: Size[];

  // Thème sélectionné par le vendeur
  vendorSelectedTheme: {
    id: number | null;
    name: string | null;
  };

  // Informations du vendeur
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name: string;
  };

  // Dates
  createdAt: string;
  updatedAt: string;
}

// Interfaces de support
interface Color {
  id: number;
  name: string;
  colorCode: string;
}

interface Size {
  id: number;
  sizeName: string;
}

interface MockupImage {
  id: number;
  url: string;
  viewType: string;
  colorName: string;
  colorCode: string;
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: {
    id: number;
    url: string;
    viewType: string;
    delimitations: Delimitation[];
  }[];
}

interface VendorImage {
  id: number;
  imageType: 'base' | 'detail' | 'admin_reference';
  cloudinaryUrl: string;
  colorName: string | null;
  colorCode: string | null;
  width: number;
  height: number;
}

interface Category {
  id: number;
  name: string;
}

interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Statistics {
  pending: number;
  validated: number;
  rejected: number;
  total: number;
  wizardProducts: number;
  traditionalProducts: number;
}
```

## 📋 Exemple de réponse complète

```json
{
  "success": true,
  "message": "Produits en attente récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 177,
        "vendorName": "yoyo",
        "vendorDescription": "vvvvvvvvvv",
        "vendorPrice": 12000,
        "vendorStock": 10,
        "baseProductId": 33,
        "colors": [
          {
            "id": 33,
            "name": "Rouge",
            "colorCode": "#ec0909"
          }
        ],
        "sizes": [
          {
            "id": 156,
            "sizeName": "400ml"
          },
          {
            "id": 157,
            "sizeName": "500ml"
          }
        ],
        "vendorSelectedThemeId": null,
        "vendorSelectedThemeName": null,
        "status": "PUBLISHED",
        "isValidated": true,
        "validatedAt": "2025-09-25T01:03:11.905Z",
        "validatedBy": 3,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": null,
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Mugs",
        "adminValidated": true,
        "isRejected": false,
        "rejectedAt": null,
        "finalStatus": "APPROVED",
        "baseProduct": {
          "id": 33,
          "name": "Mugs",
          "mockupImages": [
            {
              "id": 39,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757520701/printalma/1757520700536-Mug_noir.jpg",
              "viewType": "Front",
              "colorName": "Noir",
              "colorCode": "#000000"
            }
          ],
          "colorVariations": [],
          "sizes": []
        },
        "adminProductDetails": {
          "id": 33,
          "name": "Mugs",
          "description": "Mugs pour conservation",
          "price": 1000000,
          "categories": [
            {
              "id": 6,
              "name": "Objets > Mugs"
            }
          ],
          "totalColors": 2,
          "totalSizes": 5
        },
        "vendorImages": [
          {
            "id": 495,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758762123/wizard-products/wizard-base-1758762122200.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          }
        ],
        "selectedColors": [
          {
            "id": 33,
            "name": "Rouge",
            "colorCode": "#ec0909"
          }
        ],
        "selectedSizes": [
          {
            "id": 156,
            "sizeName": "400ml"
          }
        ],
        "vendorSelectedTheme": {
          "id": null,
          "name": null
        },
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "createdAt": "2025-09-25T01:02:10.110Z",
        "updatedAt": "2025-09-25T01:03:11.905Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 3,
      "itemsPerPage": 20,
      "hasNext": false,
      "hasPrevious": false
    },
    "stats": {
      "pending": 0,
      "validated": 3,
      "rejected": 0,
      "total": 3,
      "wizardProducts": 3,
      "traditionalProducts": 0
    }
  }
}
```

## ⚡ Exemple d'implémentation React

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminProductValidationProps {
  authToken: string;
}

const AdminProductValidation: React.FC<AdminProductValidationProps> = ({ authToken }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    productType: 'ALL',
    vendor: '',
    status: 'ALL'
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL' && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `http://localhost:3000/vendor-product/admin/products/validation?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setProducts(response.data.data.products);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats);
      } else {
        console.error('Erreur API:', response.data.message);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (filterName: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      page: filterName !== 'page' ? 1 : value // Reset page si autre filtre change
    }));
  };

  const getStatusBadge = (product: Product) => {
    const { finalStatus, isWizardProduct, adminValidated } = product;

    if (finalStatus === 'APPROVED') {
      return <span className="badge badge-success">Validé</span>;
    } else if (finalStatus === 'REJECTED') {
      return <span className="badge badge-danger">Rejeté</span>;
    } else if (finalStatus === 'PENDING') {
      return <span className="badge badge-warning">En attente</span>;
    }

    return <span className="badge badge-secondary">Inconnu</span>;
  };

  return (
    <div className="admin-validation-container">
      <h1>🎯 Validation des Produits Admin</h1>

      {/* Statistiques */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pending}</h3>
            <p>En attente</p>
          </div>
          <div className="stat-card">
            <h3>{stats.validated}</h3>
            <p>Validés</p>
          </div>
          <div className="stat-card">
            <h3>{stats.rejected}</h3>
            <p>Rejetés</p>
          </div>
          <div className="stat-card">
            <h3>{stats.wizardProducts}</h3>
            <p>WIZARD</p>
          </div>
          <div className="stat-card">
            <h3>{stats.traditionalProducts}</h3>
            <p>TRADITIONAL</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-row">
        <select
          value={filters.productType}
          onChange={(e) => handleFilterChange('productType', e.target.value)}
        >
          <option value="ALL">Tous les types</option>
          <option value="WIZARD">WIZARD</option>
          <option value="TRADITIONAL">TRADITIONAL</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="ALL">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Validés</option>
          <option value="REJECTED">Rejetés</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher un vendeur..."
          value={filters.vendor}
          onChange={(e) => handleFilterChange('vendor', e.target.value)}
        />
      </div>

      {/* Liste des produits */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="products-list">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3>{product.vendorName}</h3>
                <div className="badges">
                  <span className={`type-badge ${product.productType.toLowerCase()}`}>
                    {product.productType}
                  </span>
                  {getStatusBadge(product)}
                </div>
              </div>

              <div className="product-details">
                <p><strong>Description:</strong> {product.vendorDescription}</p>
                <p><strong>Prix vendeur:</strong> {product.vendorPrice / 100}€</p>
                <p><strong>Produit de base:</strong> {product.adminProductName}</p>
                <p><strong>Vendeur:</strong> {product.vendor.shop_name} ({product.vendor.firstName} {product.vendor.lastName})</p>

                {product.isWizardProduct && (
                  <div className="wizard-details">
                    <p><strong>Admin validé:</strong> {product.adminValidated ? '✅ Oui' : '❌ Non'}</p>
                    <p><strong>Couleurs sélectionnées:</strong> {product.selectedColors.length}</p>
                    <p><strong>Tailles sélectionnées:</strong> {product.selectedSizes.length}</p>
                  </div>
                )}

                {product.isRejected && (
                  <div className="rejection-details">
                    <p><strong>⚠️ Raison du rejet:</strong> {product.rejectionReason}</p>
                    <p><strong>Rejeté le:</strong> {new Date(product.rejectedAt || '').toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="product-images">
                {product.vendorImages.slice(0, 3).map(image => (
                  <img
                    key={image.id}
                    src={image.cloudinaryUrl}
                    alt={`Image ${image.imageType}`}
                    className="product-image"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrevious}
            onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} sur {pagination.totalPages}
            ({pagination.totalItems} éléments)
          </span>

          <button
            disabled={!pagination.hasNext}
            onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProductValidation;
```

## 🎨 Styles CSS suggérés

```css
.admin-validation-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-row {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
  flex: 1;
}

.stat-card h3 {
  margin: 0;
  font-size: 2em;
  color: #007bff;
}

.stat-card p {
  margin: 5px 0 0 0;
  color: #6c757d;
}

.filters-row {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filters-row select,
.filters-row input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.product-header h3 {
  margin: 0;
  color: #333;
}

.badges {
  display: flex;
  gap: 10px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.type-badge.wizard {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.traditional {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background: #e2e3e5;
  color: #383d41;
}

.product-details {
  margin-bottom: 15px;
}

.product-details p {
  margin: 5px 0;
  color: #555;
}

.wizard-details {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.rejection-details {
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.product-images {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6c757d;
}
```

## 🚨 Points importants à retenir

### 1. Distinction WIZARD vs TRADITIONAL
- **WIZARD**: `isWizardProduct: true`, utilise `adminValidated` pour la validation
- **TRADITIONAL**: `isWizardProduct: false`, utilise `isValidated` pour la validation

### 2. Statut final unifié
Utilisez le champ `finalStatus` qui calcule automatiquement le statut:
- `PENDING`: En attente de validation
- `APPROVED`: Validé et approuvé
- `REJECTED`: Rejeté avec raison

### 3. Images
- **Produits WIZARD**: `vendorImages` contient les images personnalisées
- **Produits TRADITIONAL**: `designCloudinaryUrl` contient le design
- **Tous**: `adminProductDetails.mockupImages` pour les aperçus du produit de base

### 4. Champ adminValidated résolu
Le problème du champ `adminValidated` retournant `false` au lieu de `true` a été identifié et corrigé dans le service. Le serveur doit être redémarré pour prendre en compte les modifications.

## 🔧 Dépannage

### Problème : adminValidated toujours false
**Solution**: Redémarrer le serveur après les modifications du service.

### Problème : Port 3004 vs 3000
**Solution**: Vérifier la configuration du serveur et utiliser le bon port dans vos requêtes.

### Problème : Réponse vide
**Solution**: Vérifier que le token JWT est valide et que l'utilisateur a les droits ADMIN.

---

*Ce guide couvre l'utilisation complète de l'endpoint de validation des produits admin. Pour des questions spécifiques, référez-vous au code source du contrôleur `AdminWizardValidationController`.*