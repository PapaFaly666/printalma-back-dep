# 📊 Guide Frontend - Affichage des Données Vendeur

## 🎯 Vue d'ensemble

Ce guide détaille l'affichage des données vendeur côté frontend, incluant tous les endpoints, structures de réponse et exemples d'implémentation pour les opérations liées aux vendeurs.

---

## 🔗 Endpoints Vendeur Disponibles

### 1. 📋 Liste des Produits Vendeur
```http
GET /vendor/products
```

**Headers requis :**
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

**Réponse :**
```json
{
  "success": true,
  "products": [
    {
      "id": 123,
      "vendorName": "T-shirt Dragon Rouge Premium",
      "vendorDescription": "T-shirt premium avec design dragon exclusif",
      "vendorPrice": 25000,
      "vendorStock": 100,
      "status": "PUBLISHED",
      "createdAt": "2024-01-20T10:30:00Z",
      "adminProduct": {
        "id": 4,
        "name": "T-shirt Basique",
        "description": "T-shirt en coton 100% de qualité premium",
        "price": 19000,
        "images": {
          "colorVariations": [
            {
              "id": 12,
              "name": "Rouge",
              "colorCode": "#ff0000",
              "images": [
                {
                  "id": 1,
                  "url": "https://res.cloudinary.com/.../tshirt-front-red.jpg",
                  "viewType": "FRONT",
                  "delimitations": [
                    {
                      "x": 100,
                      "y": 80,
                      "width": 200,
                      "height": 150,
                      "coordinateType": "ABSOLUTE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "sizes": [
          { "id": 1, "sizeName": "S" },
          { "id": 2, "sizeName": "M" },
          { "id": 3, "sizeName": "L" }
        ]
      },
      "designApplication": {
        "designUrl": "https://res.cloudinary.com/.../vendor_9_design.png",
        "positioning": "CENTER",
        "scale": 0.6
      },
      "selectedColors": [
        { "id": 30, "name": "Noir", "colorCode": "#000000" },
        { "id": 12, "name": "Rouge", "colorCode": "#ff0000" }
      ],
      "selectedSizes": [
        { "id": 1, "sizeName": "S" },
        { "id": 2, "sizeName": "M" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### 2. 🔍 Détails d'un Produit Vendeur
```http
GET /vendor/products/:id
```

**Réponse identique** à un élément de la liste ci-dessus, mais pour un seul produit.

### 3. 🚀 Publication d'un Produit
```http
POST /vendor/publish
```

**Corps de la requête :**
```json
{
  "baseProductId": 4,
  "productStructure": {
    "adminProduct": {
      "id": 4,
      "name": "T-shirt Basique",
      "description": "T-shirt en coton 100% de qualité premium",
      "price": 19000,
      "images": { "colorVariations": [...] },
      "sizes": [...]
    },
    "designApplication": {
      "designBase64": "data:image/png;base64,iVBORw0K...",
      "positioning": "CENTER",
      "scale": 0.6
    }
  },
  "vendorPrice": 25000,
  "vendorName": "T-shirt Dragon Rouge Premium",
  "vendorDescription": "T-shirt premium avec design dragon exclusif",
  "vendorStock": 100,
  "selectedColors": [
    { "id": 30, "name": "Noir", "colorCode": "#000000" }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S" }
  ],
  "finalImagesBase64": {
    "design": "data:image/png;base64,iVBOR..."
  },
  "forcedStatus": "DRAFT"
}
```

**Réponse :**
```json
{
  "success": true,
  "productId": 123,
  "message": "Produit créé avec architecture admin + design Cloudinary",
  "status": "DRAFT",
  "needsValidation": false,
  "imagesProcessed": 1,
  "structure": "admin_product_preserved",
  "designUrl": "https://res.cloudinary.com/.../vendor_9_design.png"
}
```

### 4. ✏️ Modification d'un Produit
```http
PUT /vendor/products/:id
```

**Corps de la requête :** Même structure que POST /vendor/publish

### 5. 🗑️ Suppression d'un Produit
```http
DELETE /vendor/products/:id
```

**Réponse :**
```json
{
  "success": true,
  "message": "Produit supprimé avec succès"
}
```

---

## 🎨 Exemples d'Implémentation Frontend

### 1. 📦 Service Vendor (TypeScript)

```typescript
// src/services/VendorService.ts
export class VendorService {
  private baseUrl = 'http://localhost:3004/vendor';
  
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('vendorToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Récupérer tous les produits vendeur
  async getProducts(page = 1, limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/products?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Récupérer un produit spécifique
  async getProduct(productId: number) {
    const response = await fetch(`${this.baseUrl}/products/${productId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Publier un nouveau produit
  async publishProduct(productData: any) {
    const response = await fetch(`${this.baseUrl}/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Modifier un produit existant
  async updateProduct(productId: number, productData: any) {
    const response = await fetch(`${this.baseUrl}/products/${productId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Supprimer un produit
  async deleteProduct(productId: number) {
    const response = await fetch(`${this.baseUrl}/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export default new VendorService();
```

### 2. 📄 Composant Liste des Produits (React)

```tsx
// src/components/VendorProductsList.tsx
import React, { useState, useEffect } from 'react';
import VendorService from '../services/VendorService';

interface VendorProduct {
  id: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  status: string;
  createdAt: string;
  adminProduct: {
    name: string;
    description: string;
    price: number;
  };
  designApplication: {
    designUrl: string;
    positioning: string;
    scale: number;
  };
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
}

const VendorProductsList: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await VendorService.getProducts(pagination.page, pagination.limit);
      
      if (response.success) {
        setProducts(response.products);
        setPagination({
          ...pagination,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await VendorService.deleteProduct(productId);
      await loadProducts(); // Recharger la liste
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PUBLISHED: 'bg-green-100 text-green-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>Erreur :</strong> {error}
        </div>
        <button 
          onClick={loadProducts}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mes Produits</h2>
        <button 
          onClick={() => window.location.href = '/vendor/products/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nouveau Produit
        </button>
      </div>

      {/* Liste des produits */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image du design */}
            <div className="h-48 bg-gray-200 relative">
              {product.designApplication?.designUrl ? (
                <img 
                  src={product.designApplication.designUrl}
                  alt={product.vendorName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Aucune image
                </div>
              )}
              
              {/* Badge statut */}
              <div className="absolute top-2 right-2">
                {getStatusBadge(product.status)}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {product.vendorName}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.vendorDescription}
              </p>

              {/* Prix et stock */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-green-600">
                  {(product.vendorPrice / 100).toFixed(2)} €
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.vendorStock}
                </span>
              </div>

              {/* Couleurs sélectionnées */}
              <div className="mb-3">
                <span className="text-xs text-gray-500 block mb-1">Couleurs:</span>
                <div className="flex space-x-1">
                  {product.selectedColors.map((color) => (
                    <div
                      key={color.id}
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Tailles sélectionnées */}
              <div className="mb-4">
                <span className="text-xs text-gray-500 block mb-1">Tailles:</span>
                <div className="flex space-x-1">
                  {product.selectedSizes.map((size) => (
                    <span 
                      key={size.id}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {size.sizeName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = `/vendor/products/${product.id}`}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Voir
                </button>
                <button 
                  onClick={() => window.location.href = `/vendor/products/${product.id}/edit`}
                  className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                >
                  Modifier
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
            disabled={pagination.page === 1}
            className="px-3 py-2 rounded bg-gray-200 text-gray-600 disabled:opacity-50"
          >
            Précédent
          </button>
          
          <span className="px-4 py-2">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 rounded bg-gray-200 text-gray-600 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorProductsList;
```

### 3. 📱 Composant Détails Produit (React)

```tsx
// src/components/VendorProductDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VendorService from '../services/VendorService';

const VendorProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct(parseInt(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await VendorService.getProduct(productId);
      
      if (response.success) {
        setProduct(response.product);
      } else {
        setError('Produit non trouvé');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          <strong>Erreur :</strong> {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return <div>Produit non trouvé</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{product.vendorName}</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => window.location.href = `/vendor/products/${product.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Modifier
          </button>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {/* Design principal */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Design Appliqué</h3>
            {product.designApplication?.designUrl ? (
              <img 
                src={product.designApplication.designUrl}
                alt="Design appliqué"
                className="w-full h-64 object-contain rounded"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                Aucun design
              </div>
            )}
          </div>

          {/* Images produit par couleur */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Aperçus par Couleur</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.adminProduct?.images?.colorVariations?.map((color: any) => (
                <div key={color.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <span className="text-sm font-medium">{color.name}</span>
                  </div>
                  {color.images.map((image: any) => (
                    <img 
                      key={image.id}
                      src={image.url}
                      alt={`${color.name} - ${image.viewType}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nom Vendeur</label>
                <p className="text-gray-900">{product.vendorName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{product.vendorDescription}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Prix Vendeur</label>
                  <p className="text-xl font-bold text-green-600">
                    {(product.vendorPrice / 100).toFixed(2)} €
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p className="text-gray-900">{product.vendorStock} unités</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    product.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Produit de base */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Produit de Base</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nom</label>
                <p className="text-gray-900">{product.adminProduct.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{product.adminProduct.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Prix de Base</label>
                <p className="text-gray-900">{(product.adminProduct.price / 100).toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Sélections */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Couleurs & Tailles Sélectionnées</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Couleurs</label>
                <div className="flex flex-wrap gap-2">
                  {product.selectedColors.map((color: any) => (
                    <div key={color.id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-2">Tailles</label>
                <div className="flex flex-wrap gap-2">
                  {product.selectedSizes.map((size: any) => (
                    <span 
                      key={size.id}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {size.sizeName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration design */}
          {product.designApplication && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Configuration du Design</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Positionnement</label>
                  <p className="text-gray-900">{product.designApplication.positioning}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Échelle</label>
                  <p className="text-gray-900">{(product.designApplication.scale * 100).toFixed(0)}%</p>
                </div>
                
                {product.designApplication.designUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">URL Cloudinary</label>
                    <p className="text-blue-600 text-xs break-all">
                      <a 
                        href={product.designApplication.designUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {product.designApplication.designUrl}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorProductDetail;
```

### 4. 🎨 Service de Gestion d'Images avec Cloudinary

```typescript
// src/services/ImageService.ts
export class ImageService {
  // Générer une URL Cloudinary avec transformations
  static getTransformedUrl(
    cloudinaryUrl: string, 
    transformations: Record<string, any> = {}
  ): string {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return cloudinaryUrl;
    }

    // Extraire le public_id de l'URL
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      return cloudinaryUrl;
    }

    // Construire les transformations
    const transformParams = [];
    
    if (transformations.width) transformParams.push(`w_${transformations.width}`);
    if (transformations.height) transformParams.push(`h_${transformations.height}`);
    if (transformations.crop) transformParams.push(`c_${transformations.crop}`);
    if (transformations.quality) transformParams.push(`q_${transformations.quality}`);
    if (transformations.format) transformParams.push(`f_${transformations.format}`);

    if (transformParams.length === 0) {
      return cloudinaryUrl;
    }

    // Insérer les transformations dans l'URL
    const beforeUpload = urlParts.slice(0, uploadIndex + 1);
    const afterUpload = urlParts.slice(uploadIndex + 1);
    
    return [...beforeUpload, transformParams.join(','), ...afterUpload].join('/');
  }

  // Précharger une image
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  // Optimiser les images pour l'affichage
  static getOptimizedImageUrl(
    originalUrl: string,
    context: 'thumbnail' | 'card' | 'detail' | 'full'
  ): string {
    const transformations = {
      thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
      card: { width: 400, height: 300, crop: 'fill', quality: 'auto' },
      detail: { width: 800, height: 600, crop: 'fit', quality: 'auto' },
      full: { quality: 'auto', format: 'auto' }
    };

    return this.getTransformedUrl(originalUrl, transformations[context]);
  }
}

export default ImageService;
```

### 5. 🎯 Hook React pour les Données Vendeur

```typescript
// src/hooks/useVendorProducts.ts
import { useState, useEffect, useCallback } from 'react';
import VendorService from '../services/VendorService';

interface UseVendorProductsOptions {
  page?: number;
  limit?: number;
  autoLoad?: boolean;
}

export const useVendorProducts = (options: UseVendorProductsOptions = {}) => {
  const { page = 1, limit = 10, autoLoad = true } = options;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0
  });

  const loadProducts = useCallback(async (pageNumber = pagination.page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await VendorService.getProducts(pageNumber, pagination.limit);
      
      if (response.success) {
        setProducts(response.products);
        setPagination(prev => ({
          ...prev,
          page: pageNumber,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }));
      } else {
        throw new Error('Erreur lors du chargement des produits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const deleteProduct = useCallback(async (productId: number) => {
    try {
      await VendorService.deleteProduct(productId);
      await loadProducts(); // Recharger après suppression
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  }, [loadProducts]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      loadProducts(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, loadProducts]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      loadProducts(pagination.page - 1);
    }
  }, [pagination.page, loadProducts]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      loadProducts(pageNumber);
    }
  }, [pagination.totalPages, loadProducts]);

  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    loadProducts,
    deleteProduct,
    nextPage,
    prevPage,
    goToPage,
    refetch: loadProducts
  };
};
```

---

## 🎨 Styles CSS Recommandés

```css
/* src/styles/vendor-products.css */

/* Cards produits */
.product-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105;
}

.product-card-image {
  @apply w-full h-48 object-cover;
}

.product-card-content {
  @apply p-4;
}

/* Status badges */
.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.status-published {
  @apply bg-green-100 text-green-800;
}

.status-draft {
  @apply bg-yellow-100 text-yellow-800;
}

.status-pending {
  @apply bg-blue-100 text-blue-800;
}

.status-rejected {
  @apply bg-red-100 text-red-800;
}

/* Color dots */
.color-dot {
  @apply w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0;
}

/* Size badges */
.size-badge {
  @apply bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs;
}

/* Loading spinner */
.loading-spinner {
  @apply animate-spin rounded-full border-b-2 border-blue-600;
}

/* Responsive grid */
.products-grid {
  @apply grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

/* Image gallery */
.image-gallery {
  @apply grid grid-cols-2 gap-2;
}

/* Action buttons */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors;
}

.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors;
}
```

---

## 🔧 Configuration et Authentification

### 1. Configuration de Base

```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  VENDOR_ENDPOINTS: {
    PRODUCTS: '/vendor/products',
    PUBLISH: '/vendor/publish',
    PRODUCT_DETAIL: '/vendor/products/:id'
  },
  CLOUDINARY: {
    CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
    BASE_URL: 'https://res.cloudinary.com'
  }
};
```

### 2. Gestion de l'Authentification

```typescript
// src/services/AuthService.ts
export class AuthService {
  private static TOKEN_KEY = 'vendorToken';
  
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
  
  private static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
```

---

## 🚀 Démarrage Rapide

### 1. Installation

```bash
# Créer le service
mkdir -p src/services
touch src/services/VendorService.ts

# Créer les composants
mkdir -p src/components/vendor
touch src/components/vendor/VendorProductsList.tsx
touch src/components/vendor/VendorProductDetail.tsx

# Créer les hooks
mkdir -p src/hooks
touch src/hooks/useVendorProducts.ts
```

### 2. Intégration dans votre App

```tsx
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VendorProductsList from './components/vendor/VendorProductsList';
import VendorProductDetail from './components/vendor/VendorProductDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/vendor/products" element={<VendorProductsList />} />
        <Route path="/vendor/products/:id" element={<VendorProductDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### 3. Test Rapide

```typescript
// Test des endpoints
import VendorService from './services/VendorService';

// Tester la connexion
VendorService.getProducts()
  .then(response => console.log('✅ Produits chargés:', response))
  .catch(error => console.error('❌ Erreur:', error));
```

---

## 📋 Points Importants

### ✅ Bonnes Pratiques

1. **Gestion d'erreurs** : Toujours wrapper les appels API dans try/catch
2. **Loading states** : Afficher des indicateurs de chargement
3. **Images optimisées** : Utiliser les transformations Cloudinary
4. **Cache local** : Considérer l'utilisation de React Query ou SWR
5. **Responsive design** : Adapter l'affichage aux différentes tailles d'écran

### ⚠️ Points d'Attention

1. **Authentification** : Vérifier la validité du token avant chaque requête
2. **Validation** : Valider les données côté frontend avant envoi
3. **Performance** : Pagination et lazy loading pour les grandes listes
4. **SEO** : Utiliser des meta tags appropriés pour les pages produits
5. **Accessibilité** : Ajouter les attributs ARIA et alt appropriés

---

## 🎯 Prochaines Étapes

1. Implémenter la création/modification de produits
2. Ajouter la gestion des notifications en temps réel
3. Intégrer un système de cache intelligent
4. Créer des tests unitaires et d'intégration
5. Optimiser les performances avec React.memo et useMemo

Ce guide vous donne une base solide pour afficher et gérer les données vendeur dans votre application frontend ! 