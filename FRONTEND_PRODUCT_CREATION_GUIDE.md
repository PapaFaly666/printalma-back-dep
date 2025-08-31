# Guide Frontend React - Création de Produits

## 📋 Vue d'ensemble

Ce guide vous explique comment intégrer l'API de création de produits dans votre frontend React avec authentification par cookies HTTP. Cette version est maintenant conforme au guide backend officiel.

## 🔌 Endpoint API

```
POST /api/products
Content-Type: multipart/form-data
```

## 📊 Structure des données

### 1. Champ `productData` (JSON string)

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt en coton bio de haute qualité",
  "price": 29.99,
  "stock": 100,
  "status": "published", // ou "draft"
  "categories": ["Vêtements", "T-shirts"],
  "sizes": ["S", "M", "L", "XL"], // NOUVEAU: Gestion des tailles
  "colorVariations": [
    {
      "name": "Rouge",
      "colorCode": "#FF0000",
      "images": [
        {
          "fileId": "1678886400001",
          "view": "Front",
          "delimitations": [
            {
              "x": 50,
              "y": 100,
              "width": 200,
              "height": 150,
              "rotation": 0
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Fichiers images

- Nom des champs : `file_<fileId>`
- Exemple : `file_1678886400001`

## 🛠 Service React

Créez un service pour gérer l'API :

```javascript
// services/productService.js
const API_BASE_URL = 'http://localhost:3004/api';

export class ProductService {
  static async createProduct(productData, files) {
    try {
      const formData = new FormData();
      
      // Ajouter les données du produit en JSON
      formData.append('productData', JSON.stringify(productData));
      
      // Ajouter les fichiers avec les bons noms
      files.forEach(file => {
        formData.append(`file_${file.fileId}`, file.file);
      });

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        credentials: 'include', // Important pour les cookies HTTP
        body: formData
        // Note: Ne pas définir Content-Type, le navigateur le fera automatiquement
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du produit');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur ProductService.createProduct:', error);
      throw error;
    }
  }

  static async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur ProductService.getProducts:', error);
      throw error;
    }
  }
}
```

## 🎨 Composant React - Formulaire de création

```jsx
// components/ProductForm.jsx
import React, { useState } from 'react';
import { ProductService } from '../services/productService';

export const ProductForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    status: 'draft',
    categories: [''],
    sizes: ['']  // NOUVEAU: Gestion des tailles
  });
  
  const [colorVariations, setColorVariations] = useState([{
    name: '',
    colorCode: '#000000',
    images: []
  }]);
  
  const [loading, setLoading] = useState(false);

  // Prédéfinition des tailles disponibles
  const PREDEFINED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  
  // Prédéfinition des catégories disponibles
  const PREDEFINED_CATEGORIES = [
    'T-shirts', 'Polos', 'Sweats', 'Hoodies', 'Casquettes', 
    'Tote bags', 'Mugs', 'Stickers', 'Cartes de visite', 'Flyers'
  ];

  // Gérer les changements des champs basiques
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gérer les catégories
  const handleCategoryChange = (index, value) => {
    const newCategories = [...formData.categories];
    newCategories[index] = value;
    setFormData(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, '']
    }));
  };

  const removeCategory = (index) => {
    if (formData.categories.length > 1) {
      const newCategories = formData.categories.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        categories: newCategories
      }));
    }
  };

  // NOUVEAU: Gérer les tailles
  const handleSizeChange = (index, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData(prev => ({
      ...prev,
      sizes: newSizes
    }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };

  const removeSize = (index) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        sizes: newSizes
      }));
    }
  };

  // Gérer les variations de couleur
  const handleColorVariationChange = (index, field, value) => {
    const newVariations = [...colorVariations];
    newVariations[index][field] = value;
    setColorVariations(newVariations);
  };

  const addColorVariation = () => {
    setColorVariations(prev => [...prev, {
      name: '',
      colorCode: '#000000',
      images: []
    }]);
  };

  const removeColorVariation = (index) => {
    if (colorVariations.length > 1) {
      setColorVariations(colorVariations.filter((_, i) => i !== index));
    }
  };

  // Gérer les images
  const handleImageUpload = (colorIndex, files) => {
    const newVariations = [...colorVariations];
    const newImages = Array.from(files).map((file, index) => ({
      fileId: `${Date.now()}_${colorIndex}_${index}`,
      file: file,
      view: 'Front',
      delimitations: []
    }));
    
    newVariations[colorIndex].images = [
      ...newVariations[colorIndex].images,
      ...newImages
    ];
    
    setColorVariations(newVariations);
  };

  const removeImage = (colorIndex, imageIndex) => {
    const newVariations = [...colorVariations];
    newVariations[colorIndex].images = newVariations[colorIndex].images.filter((_, i) => i !== imageIndex);
    setColorVariations(newVariations);
  };

  // Ajouter une délimitation
  const addDelimitation = (colorIndex, imageIndex) => {
    const newVariations = [...colorVariations];
    newVariations[colorIndex].images[imageIndex].delimitations.push({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0
    });
    setColorVariations(newVariations);
  };

  const removeDelimitation = (colorIndex, imageIndex, delimIndex) => {
    const newVariations = [...colorVariations];
    newVariations[colorIndex].images[imageIndex].delimitations = 
      newVariations[colorIndex].images[imageIndex].delimitations.filter((_, i) => i !== delimIndex);
    setColorVariations(newVariations);
  };

  // Validation des données
  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim() || formData.name.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!formData.description.trim() || formData.description.length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      errors.push('Le stock ne peut pas être négatif');
    }
    
    const validCategories = formData.categories.filter(cat => cat.trim() !== '');
    if (validCategories.length === 0) {
      errors.push('Au moins une catégorie est requise');
    }
    
    if (colorVariations.length === 0) {
      errors.push('Au moins une variation de couleur est requise');
    }
    
    colorVariations.forEach((variation, index) => {
      if (!variation.name.trim()) {
        errors.push(`Le nom de la couleur ${index + 1} est requis`);
      }
      
      if (!/^#[0-9A-Fa-f]{6}$/.test(variation.colorCode)) {
        errors.push(`Le code couleur ${index + 1} doit être au format #RRGGBB`);
      }
      
      if (variation.images.length === 0) {
        errors.push(`Au moins une image est requise pour la couleur ${index + 1}`);
      }
    });
    
    return errors;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      onError?.(validationErrors.join('\n'));
      return;
    }
    
    setLoading(true);

    try {
      // Préparer les données du produit
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categories: formData.categories.filter(cat => cat.trim() !== ''),
        sizes: formData.sizes.filter(size => size.trim() !== ''), // NOUVEAU
        colorVariations: colorVariations.map(variation => ({
          name: variation.name,
          colorCode: variation.colorCode.toUpperCase(),
          images: variation.images.map(img => ({
            fileId: img.fileId,
            view: img.view,
            delimitations: img.delimitations
          }))
        }))
      };

      // Préparer les fichiers
      const files = [];
      colorVariations.forEach(variation => {
        variation.images.forEach(img => {
          if (img.file) {
            files.push({
              fileId: img.fileId,
              file: img.file
            });
          }
        });
      });

      // Envoyer à l'API
      const result = await ProductService.createProduct(productData, files);
      
      onSuccess?.(result);
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        status: 'draft',
        categories: [''],
        sizes: ['']
      });
      setColorVariations([{
        name: '',
        colorCode: '#000000',
        images: []
      }]);

    } catch (error) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>Créer un nouveau produit</h2>
      
      {/* Informations de base */}
      <div className="form-section">
        <h3>Informations générales</h3>
        
        <div className="form-group">
          <label htmlFor="name">Nom du produit *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: T-shirt Premium en Coton Bio"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Description détaillée du produit..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Prix (FCFA) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="8500"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock *</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              placeholder="150"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Statut</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>

      {/* Catégories */}
      <div className="form-section">
        <h3>Catégories</h3>
        {formData.categories.map((category, index) => (
          <div key={index} className="form-group-with-controls">
            <div className="form-row">
              <div className="form-group flex-grow">
                <label>Catégorie {index + 1}</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  placeholder="Nom de la catégorie ou choisissez ci-dessous"
                  list={`categories-${index}`}
                />
                <datalist id={`categories-${index}`}>
                  {PREDEFINED_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              {formData.categories.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeCategory(index)}
                  className="btn-remove"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addCategory} className="btn-add">
          Ajouter une catégorie
        </button>
      </div>

      {/* NOUVEAU: Tailles */}
      <div className="form-section">
        <h3>Tailles disponibles</h3>
        <p className="help-text">Optionnel - Laissez vide si non applicable</p>
        {formData.sizes.map((size, index) => (
          <div key={index} className="form-group-with-controls">
            <div className="form-row">
              <div className="form-group flex-grow">
                <label>Taille {index + 1}</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => handleSizeChange(index, e.target.value)}
                  placeholder="Ex: M, Large, 4 ans..."
                  list={`sizes-${index}`}
                />
                <datalist id={`sizes-${index}`}>
                  {PREDEFINED_SIZES.map(size => (
                    <option key={size} value={size} />
                  ))}
                </datalist>
              </div>
              {formData.sizes.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeSize(index)}
                  className="btn-remove"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addSize} className="btn-add">
          Ajouter une taille
        </button>
      </div>

      {/* Variations de couleur */}
      <div className="form-section">
        <h3>Variations de couleur</h3>
        {colorVariations.map((variation, colorIndex) => (
          <div key={colorIndex} className="color-variation">
            <div className="color-variation-header">
              <h4>Couleur {colorIndex + 1}</h4>
              {colorVariations.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeColorVariation(colorIndex)}
                  className="btn-remove"
                >
                  Supprimer cette couleur
                </button>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nom de la couleur *</label>
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) => handleColorVariationChange(colorIndex, 'name', e.target.value)}
                  placeholder="Ex: Rouge Vif"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Code couleur *</label>
                <input
                  type="color"
                  value={variation.colorCode}
                  onChange={(e) => handleColorVariationChange(colorIndex, 'colorCode', e.target.value)}
                  required
                />
                <small>Code: {variation.colorCode}</small>
              </div>
            </div>

            {/* Images pour cette couleur */}
            <div className="images-section">
              <label>Images *</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(colorIndex, e.target.files)}
              />
              
              {variation.images.map((image, imageIndex) => (
                <div key={imageIndex} className="image-item">
                  <div className="image-header">
                    <span>Image {imageIndex + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(colorIndex, imageIndex)}
                      className="btn-remove-small"
                    >
                      Supprimer
                    </button>
                  </div>
                  
                  <select
                    value={image.view}
                    onChange={(e) => {
                      const newVariations = [...colorVariations];
                      newVariations[colorIndex].images[imageIndex].view = e.target.value;
                      setColorVariations(newVariations);
                    }}
                  >
                    <option value="Front">Face</option>
                    <option value="Back">Dos</option>
                    <option value="Left">Gauche</option>
                    <option value="Right">Droite</option>
                    <option value="Top">Dessus</option>
                    <option value="Bottom">Dessous</option>
                    <option value="Detail">Détail</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => addDelimitation(colorIndex, imageIndex)}
                    className="btn-add-small"
                  >
                    Ajouter zone d'impression
                  </button>
                  
                  {image.delimitations.map((delim, delimIndex) => (
                    <div key={delimIndex} className="delimitation">
                      <div className="delimitation-header">
                        <span>Zone {delimIndex + 1}:</span>
                        <button
                          type="button"
                          onClick={() => removeDelimitation(colorIndex, imageIndex, delimIndex)}
                          className="btn-remove-small"
                        >
                          ×
                        </button>
                      </div>
                      <div className="delimitation-inputs">
                        <input
                          type="number"
                          placeholder="X"
                          value={delim.x}
                          onChange={(e) => {
                            const newVariations = [...colorVariations];
                            newVariations[colorIndex].images[imageIndex].delimitations[delimIndex].x = parseFloat(e.target.value) || 0;
                            setColorVariations(newVariations);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Y"
                          value={delim.y}
                          onChange={(e) => {
                            const newVariations = [...colorVariations];
                            newVariations[colorIndex].images[imageIndex].delimitations[delimIndex].y = parseFloat(e.target.value) || 0;
                            setColorVariations(newVariations);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Largeur"
                          value={delim.width}
                          onChange={(e) => {
                            const newVariations = [...colorVariations];
                            newVariations[colorIndex].images[imageIndex].delimitations[delimIndex].width = parseFloat(e.target.value) || 0;
                            setColorVariations(newVariations);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Hauteur"
                          value={delim.height}
                          onChange={(e) => {
                            const newVariations = [...colorVariations];
                            newVariations[colorIndex].images[imageIndex].delimitations[delimIndex].height = parseFloat(e.target.value) || 0;
                            setColorVariations(newVariations);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="Rotation"
                          value={delim.rotation}
                          onChange={(e) => {
                            const newVariations = [...colorVariations];
                            newVariations[colorIndex].images[imageIndex].delimitations[delimIndex].rotation = parseFloat(e.target.value) || 0;
                            setColorVariations(newVariations);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <button type="button" onClick={addColorVariation} className="btn-add">
          Ajouter une couleur
        </button>
      </div>

      {/* Bouton de soumission */}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </div>
    </form>
  );
};
```

## 🎯 Composant principal avec gestion d'erreurs

```jsx
// components/ProductManager.jsx
import React, { useState } from 'react';
import { ProductForm } from './ProductForm';

export const ProductManager = () => {
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success'); // 'success' ou 'error'

  const handleSuccess = (result) => {
    setMessage(`Produit "${result.name}" créé avec succès !`);
    setMessageType('success');
    
    // Effacer le message après 5 secondes
    setTimeout(() => setMessage(null), 5000);
  };

  const handleError = (error) => {
    setMessage(`Erreur: ${error}`);
    setMessageType('error');
    
    // Effacer le message après 5 secondes
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="product-manager">
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <ProductForm 
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
};
```

## 🍪 Configuration des cookies HTTP

### 1. Configuration du serveur

Assurez-vous que votre serveur NestJS est configuré pour les cookies :

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:3000', // URL de votre frontend
  credentials: true, // Important pour les cookies
});
```

### 2. Configuration du client React

```javascript
// utils/apiConfig.js
export const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  credentials: 'include', // Toujours inclure les cookies
  headers: {
    'Accept': 'application/json',
  }
};

// Pour fetch()
fetch(url, {
  ...API_CONFIG,
  method: 'POST',
  body: formData
});
```

## 🎨 CSS de base

```css
/* styles/ProductForm.css */
.product-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.color-variation {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.image-item {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: white;
}

.delimitation {
  display: flex;
  gap: 10px;
  margin: 5px 0;
  align-items: center;
}

.delimitation input {
  width: 80px;
}

.submit-btn {
  background-color: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

## 🔍 Gestion d'erreurs avancée

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }
  
  if (error.message.includes('401')) {
    return 'Non authentifié. Veuillez vous reconnecter.';
  }
  
  if (error.message.includes('403')) {
    return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
  }
  
  if (error.message.includes('413')) {
    return 'Les fichiers sont trop volumineux.';
  }
  
  return error.message || 'Une erreur inattendue s\'est produite.';
};
```

## 🧪 Test de l'intégration

```javascript
// Exemple de test simple
const testProductCreation = async () => {
  const testData = {
    name: "Test Product",
    description: "Description du produit test",
    price: 19.99,
    stock: 50,
    status: "draft",
    categories: ["Test"],
    colorVariations: [
      {
        name: "Bleu",
        colorCode: "#0000FF",
        images: [
          {
            fileId: "test_123",
            view: "Front",
            delimitations: [
              {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
                rotation: 0
              }
            ]
          }
        ]
      }
    ]
  };

  // Créer un fichier de test
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 400, 400);
  
  canvas.toBlob(async (blob) => {
    const testFile = new File([blob], 'test.png', { type: 'image/png' });
    
    try {
      const result = await ProductService.createProduct(testData, [
        { fileId: 'test_123', file: testFile }
      ]);
      console.log('Test réussi:', result);
    } catch (error) {
      console.error('Test échoué:', error);
    }
  });
};
```

## 📝 Notes importantes

1. **Cookies HTTP** : Toujours utiliser `credentials: 'include'` dans vos requêtes
2. **CORS** : Configurer correctement le serveur pour accepter les cookies cross-origin
3. **Validation** : Les données sont validées côté serveur, gérez les erreurs de validation
4. **Taille des fichiers** : Vérifiez les limites de taille côté client avant l'envoi
5. **FileId unique** : Assurez-vous que chaque `fileId` est unique (utilisez timestamp + index)

## 🔧 Debugging

Pour déboguer les problèmes :

1. Vérifiez la console réseau du navigateur
2. Contrôlez que les cookies sont bien envoyés
3. Vérifiez le format JSON du `productData`
4. Assurez-vous que les noms des fichiers correspondent aux `fileId`

Ce guide vous donne tout ce dont vous avez besoin pour intégrer l'API de création de produits dans votre frontend React ! 