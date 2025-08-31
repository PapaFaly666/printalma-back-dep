# Guide Frontend - Modification des Produits Prêts

## 🎯 **Objectif**

Permettre aux administrateurs de modifier les produits prêts (isReadyProduct = true) via l'interface frontend avec support des images et des variations de couleur.

## 📋 **Prérequis**

### 1. Vérifier que le serveur fonctionne
```bash
# Démarrer le serveur backend
npm run start:dev

# Tester l'endpoint de modification
curl -X PATCH http://localhost:3004/products/ready/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "productData={\"name\":\"Test Updated\"}"
```

### 2. Configuration API Helper
```javascript
// apiHelpers.ts
const BASE_URL = 'http://localhost:3004'; // Port 3004

export const apiPatch = async (endpoint: string, formData: FormData, token?: string) => {
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};
```

## 🎨 **Composants React**

### 1. Page de modification de produit prêt
```jsx
// pages/EditReadyProductPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readyProductsService, ReadyProduct } from '../services/readyProductsService';
import EditReadyProductForm from '../components/EditReadyProductForm';

const EditReadyProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ReadyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productData = await readyProductsService.getReadyProduct(parseInt(id));
      setProduct(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProduct = await readyProductsService.updateReadyProduct(parseInt(id), formData);
      
      // Rediriger vers la liste des produits prêts
      navigate('/admin/ready-products', { 
        state: { message: 'Produit modifié avec succès' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
      console.error('Erreur:', err);
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erreur:</strong> {error}
        <button 
          onClick={fetchProduct}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Produit non trouvé</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Modifier le Produit Prêt
        </h1>
        <button 
          onClick={() => navigate('/admin/ready-products')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Retour
        </button>
      </div>

      <EditReadyProductForm 
        product={product}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/ready-products')}
        loading={loading}
      />
    </div>
  );
};

export default EditReadyProductPage;
```

### 2. Formulaire de modification
```jsx
// components/EditReadyProductForm.tsx
import React, { useState, useEffect } from 'react';
import { ReadyProduct } from '../services/readyProductsService';

interface EditReadyProductFormProps {
  product: ReadyProduct;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const EditReadyProductForm: React.FC<EditReadyProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    price: (product.price / 100).toString(), // Convertir de centimes
    stock: product.stock.toString(),
    status: product.status.toLowerCase(),
    categories: product.categories.map(c => c.name).join(', '),
    sizes: product.sizes.map(s => s.name).join(', '),
    isReadyProduct: true, // Toujours true pour les produits prêts
    colorVariations: product.colorVariations.map(cv => ({
      id: cv.id,
      name: cv.name,
      colorCode: cv.colorCode,
      images: cv.images.map(img => ({
        id: img.id,
        url: img.url,
        view: img.view,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        // Pas de fileId pour les images existantes
      }))
    }))
  });

  const [newImages, setNewImages] = useState<Map<string, File>>(new Map());
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Données du produit
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) * 100, // Convertir en centimes
        stock: parseInt(formData.stock),
        status: formData.status,
        categories: formData.categories.split(',').map(c => c.trim()).filter(c => c),
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
        isReadyProduct: true, // Toujours true pour les produits prêts
        colorVariations: formData.colorVariations.map(cv => ({
          name: cv.name,
          colorCode: cv.colorCode,
          images: cv.images
            .filter(img => !removedImages.has(`${cv.id}-${img.id}`)) // Filtrer les images supprimées
            .map(img => ({
              ...img,
              // Ajouter fileId seulement pour les nouvelles images
              ...(newImages.has(`${cv.id}-${img.id}`) && {
                fileId: `${cv.id}-${img.id}`
              })
            }))
        }))
      };

      formDataToSend.append('productData', JSON.stringify(productData));

      // Ajouter les nouvelles images
      newImages.forEach((file, key) => {
        formDataToSend.append(`file_${key}`, file);
      });

      await onSubmit(formDataToSend);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleImageChange = (colorVarId: number, imageId: number, file: File) => {
    const key = `${colorVarId}-${imageId}`;
    setNewImages(prev => new Map(prev.set(key, file)));
  };

  const handleImageRemove = (colorVarId: number, imageId: number) => {
    const key = `${colorVarId}-${imageId}`;
    setRemovedImages(prev => new Set([...prev, key]));
  };

  const handleAddImage = (colorVarId: number) => {
    const newImageId = Date.now(); // ID temporaire
    const newImage = {
      id: newImageId,
      url: '',
      view: 'Front',
      naturalWidth: 0,
      naturalHeight: 0,
      isNew: true
    };

    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(cv => 
        cv.id === colorVarId 
          ? { ...cv, images: [...cv.images, newImage] }
          : cv
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (€) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      {/* Catégories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégories (séparées par des virgules) *
        </label>
        <input
          type="text"
          value={formData.categories}
          onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="T-shirts, Vêtements éco-responsables"
          required
        />
      </div>

      {/* Tailles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tailles (séparées par des virgules)
        </label>
        <input
          type="text"
          value={formData.sizes}
          onChange={(e) => setFormData(prev => ({ ...prev, sizes: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="S, M, L, XL"
        />
      </div>

      {/* Variations de couleur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Variations de couleur
        </label>
        {formData.colorVariations.map((colorVar, colorIndex) => (
          <div key={colorVar.id} className="border border-gray-200 rounded p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la couleur
                </label>
                <input
                  type="text"
                  value={colorVar.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      colorVariations: prev.colorVariations.map((cv, index) =>
                        index === colorIndex ? { ...cv, name: e.target.value } : cv
                      )
                    }));
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code couleur
                </label>
                <input
                  type="color"
                  value={colorVar.colorCode}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      colorVariations: prev.colorVariations.map((cv, index) =>
                        index === colorIndex ? { ...cv, colorCode: e.target.value } : cv
                      )
                    }));
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Images pour cette couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images ({colorVar.images.filter(img => !removedImages.has(`${colorVar.id}-${img.id}`)).length})
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {colorVar.images
                  .filter(img => !removedImages.has(`${colorVar.id}-${img.id}`))
                  .map((image, imageIndex) => (
                    <div key={image.id} className="relative">
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`${colorVar.name} - ${image.view}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Nouvelle image</span>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleImageRemove(colorVar.id, image.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      
                      <div className="mt-2">
                        <select
                          value={image.view}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              colorVariations: prev.colorVariations.map((cv, cvIndex) =>
                                cvIndex === colorIndex 
                                  ? {
                                      ...cv,
                                      images: cv.images.map((img, imgIndex) =>
                                        imgIndex === imageIndex ? { ...img, view: e.target.value } : img
                                      )
                                    }
                                  : cv
                              )
                            }));
                          }}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="Front">Front</option>
                          <option value="Back">Back</option>
                          <option value="Left">Left</option>
                          <option value="Right">Right</option>
                          <option value="Top">Top</option>
                          <option value="Bottom">Bottom</option>
                          <option value="Detail">Detail</option>
                        </select>
                      </div>
                      
                      {/* Upload de nouvelle image */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageChange(colorVar.id, image.id, file);
                          }
                        }}
                        className="mt-2 w-full text-xs"
                      />
                    </div>
                  ))}
              </div>
              
              <button
                type="button"
                onClick={() => handleAddImage(colorVar.id)}
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
              >
                + Ajouter une image
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Modification...' : 'Modifier le produit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default EditReadyProductForm;
```

### 3. Service mis à jour
```javascript
// services/readyProductsService.ts
export const readyProductsService = {
  // ... méthodes existantes

  // Modifier un produit prêt
  async updateReadyProduct(id: number, formData: FormData): Promise<ReadyProduct> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/products/ready/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  },

  // Récupérer un produit prêt spécifique
  async getReadyProduct(id: number): Promise<ReadyProduct> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/products/ready/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }
};
```

## 🔧 **Configuration des Routes**

```jsx
// App.tsx ou router.tsx
import EditReadyProductPage from './pages/EditReadyProductPage';

// Dans votre configuration de routes
{
  path: '/admin/ready-products/:id/edit',
  element: <EditReadyProductPage />,
  requireAuth: true,
  requireRole: ['ADMIN', 'SUPERADMIN']
}
```

## 🧪 **Tests de Validation**

### Test 1: Modification basique
```javascript
// Test de modification sans images
const updateData = {
  name: "T-Shirt Prêt Modifié",
  description: "Description mise à jour",
  price: 3000,
  stock: 150,
  status: "published",
  categories: ["T-shirts", "Vêtements éco-responsables"],
  sizes: ["S", "M", "L", "XL"],
  isReadyProduct: true,
  colorVariations: [
    {
      name: "Rouge",
      colorCode: "#FF0000",
      images: [
        {
          url: "https://res.cloudinary.com/example/image.jpg",
          view: "Front"
        }
      ]
    }
  ]
};
```

### Test 2: Modification avec nouvelles images
```javascript
// Test avec upload de nouvelles images
const formData = new FormData();
formData.append('productData', JSON.stringify(updateData));
formData.append('file_color_1_img_1', newFile1);
formData.append('file_color_1_img_2', newFile2);
```

## 📋 **Logs de Débogage Attendus**

### Logs dans la console du serveur :
```
🔍 updateReadyProduct - Request body: { productData: '{"name":"Test Modifié",...}' }
🔍 updateReadyProduct - productDataString: {"name":"Test Modifié",...}
🔍 updateReadyProduct - Files count: 2
🔍 updateReadyProduct - Parsed productDto: {"name":"Test Modifié",...}
🔍 updateReadyProduct - isReadyProduct: true
🔍 updateReadyProduct - Type isReadyProduct: boolean
✅ Produit prêt détecté - isReadyProduct = true
💾 Produit modifié avec isReadyProduct: true
```

## 🎯 **Résultat Attendu**

Après modification, le produit doit être mis à jour avec :

```javascript
// ✅ PRODUIT MODIFIÉ
{
  "id": 123,
  "name": "T-Shirt Prêt Modifié",
  "description": "Description mise à jour",
  "price": 3000,
  "stock": 150,
  "status": "PUBLISHED",
  "isReadyProduct": true, // ← DOIT RESTER TRUE
  "categories": ["T-shirts", "Vêtements éco-responsables"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [...]
}
```

## 🚀 **Prochaines Étapes**

1. **Implémenter les composants** selon le guide
2. **Tester la modification** d'un produit prêt existant
3. **Vérifier les logs** dans la console du serveur
4. **Confirmer** que `isReadyProduct = true` est préservé

Le système de modification des produits prêts est maintenant complet ! 🎉 