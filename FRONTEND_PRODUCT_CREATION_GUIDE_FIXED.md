# Guide Frontend React - Création de Produits (Version Corrigée)

## 🐛 Problème résolu : Maximum update depth exceeded

Cette version corrige les boucles infinies de setState qui causaient l'erreur "Maximum update depth exceeded".

## 🎨 Composant React - Formulaire de création (VERSION CORRIGÉE)

```jsx
// components/ProductForm.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { ProductService } from '../services/productService';

export const ProductForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    status: 'draft',
    categories: [''],
    sizes: ['']
  });
  
  const [colorVariations, setColorVariations] = useState([{
    name: '',
    colorCode: '#000000',
    images: []
  }]);
  
  const [loading, setLoading] = useState(false);

  // Prédéfinitions - useMemo pour éviter les re-créations
  const PREDEFINED_SIZES = useMemo(() => 
    ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], []
  );
  
  const PREDEFINED_CATEGORIES = useMemo(() => [
    'T-shirts', 'Polos', 'Sweats', 'Hoodies', 'Casquettes', 
    'Tote bags', 'Mugs', 'Stickers', 'Cartes de visite', 'Flyers'
  ], []);

  // useCallback pour éviter les re-créations de fonctions
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCategoryChange = useCallback((index, value) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = value;
      return {
        ...prev,
        categories: newCategories
      };
    });
  }, []);

  const addCategory = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, '']
    }));
  }, []);

  const removeCategory = useCallback((index) => {
    setFormData(prev => {
      if (prev.categories.length <= 1) return prev;
      return {
        ...prev,
        categories: prev.categories.filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleSizeChange = useCallback((index, value) => {
    setFormData(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = value;
      return {
        ...prev,
        sizes: newSizes
      };
    });
  }, []);

  const addSize = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  }, []);

  const removeSize = useCallback((index) => {
    setFormData(prev => {
      if (prev.sizes.length <= 1) return prev;
      return {
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleColorVariationChange = useCallback((index, field, value) => {
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[index] = {
        ...newVariations[index],
        [field]: value
      };
      return newVariations;
    });
  }, []);

  const addColorVariation = useCallback(() => {
    setColorVariations(prev => [...prev, {
      name: '',
      colorCode: '#000000',
      images: []
    }]);
  }, []);

  const removeColorVariation = useCallback((index) => {
    setColorVariations(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleImageUpload = useCallback((colorIndex, files) => {
    const newImages = Array.from(files).map((file, index) => ({
      fileId: `${Date.now()}_${colorIndex}_${index}`,
      file: file,
      view: 'Front',
      delimitations: []
    }));
    
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: [...newVariations[colorIndex].images, ...newImages]
      };
      return newVariations;
    });
  }, []);

  const removeImage = useCallback((colorIndex, imageIndex) => {
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: newVariations[colorIndex].images.filter((_, i) => i !== imageIndex)
      };
      return newVariations;
    });
  }, []);

  const updateImageView = useCallback((colorIndex, imageIndex, view) => {
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: newVariations[colorIndex].images.map((img, i) => 
          i === imageIndex ? { ...img, view } : img
        )
      };
      return newVariations;
    });
  }, []);

  const addDelimitation = useCallback((colorIndex, imageIndex) => {
    setColorVariations(prev => {
      const newVariations = [...prev];
      const newDelimitation = {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0
      };
      
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: newVariations[colorIndex].images.map((img, i) => 
          i === imageIndex 
            ? { ...img, delimitations: [...img.delimitations, newDelimitation] }
            : img
        )
      };
      return newVariations;
    });
  }, []);

  const removeDelimitation = useCallback((colorIndex, imageIndex, delimIndex) => {
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: newVariations[colorIndex].images.map((img, i) => 
          i === imageIndex 
            ? { ...img, delimitations: img.delimitations.filter((_, di) => di !== delimIndex) }
            : img
        )
      };
      return newVariations;
    });
  }, []);

  const updateDelimitation = useCallback((colorIndex, imageIndex, delimIndex, field, value) => {
    const numValue = parseFloat(value) || 0;
    
    setColorVariations(prev => {
      const newVariations = [...prev];
      newVariations[colorIndex] = {
        ...newVariations[colorIndex],
        images: newVariations[colorIndex].images.map((img, i) => 
          i === imageIndex 
            ? { 
                ...img, 
                delimitations: img.delimitations.map((delim, di) => 
                  di === delimIndex ? { ...delim, [field]: numValue } : delim
                )
              }
            : img
        )
      };
      return newVariations;
    });
  }, []);

  const validateForm = useCallback(() => {
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
  }, [formData, colorVariations]);

  const handleSubmit = useCallback(async (e) => {
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
        sizes: formData.sizes.filter(size => size.trim() !== ''),
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
  }, [formData, colorVariations, validateForm, onSuccess, onError]);

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

      {/* Tailles */}
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
                    onChange={(e) => updateImageView(colorIndex, imageIndex, e.target.value)}
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
                          onChange={(e) => updateDelimitation(colorIndex, imageIndex, delimIndex, 'x', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Y"
                          value={delim.y}
                          onChange={(e) => updateDelimitation(colorIndex, imageIndex, delimIndex, 'y', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Largeur"
                          value={delim.width}
                          onChange={(e) => updateDelimitation(colorIndex, imageIndex, delimIndex, 'width', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Hauteur"
                          value={delim.height}
                          onChange={(e) => updateDelimitation(colorIndex, imageIndex, delimIndex, 'height', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Rotation"
                          value={delim.rotation}
                          onChange={(e) => updateDelimitation(colorIndex, imageIndex, delimIndex, 'rotation', e.target.value)}
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

## 🔧 CSS amélioré pour éviter les problèmes de style

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

.form-group-with-controls {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.form-row .form-group {
  flex: 1;
}

.flex-grow {
  flex-grow: 1;
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
  box-sizing: border-box;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.color-variation {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.color-variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.image-item {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: white;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.delimitation {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.delimitation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.delimitation-inputs {
  display: flex;
  gap: 10px;
}

.delimitation-inputs input {
  width: 80px;
}

/* Boutons */
.btn-add, .btn-remove, .btn-add-small, .btn-remove-small {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.btn-add, .btn-add-small {
  background-color: #28a745;
  color: white;
}

.btn-add:hover, .btn-add-small:hover {
  background-color: #218838;
}

.btn-remove, .btn-remove-small {
  background-color: #dc3545;
  color: white;
}

.btn-remove:hover, .btn-remove-small:hover {
  background-color: #c82333;
}

.btn-remove-small {
  padding: 4px 8px;
  font-size: 10px;
  line-height: 1;
}

.submit-btn {
  background-color: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #0056b3;
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

## 🔧 Points clés de la correction

### ✅ **Problèmes résolus :**

1. **useCallback** : Toutes les fonctions sont wrapped avec `useCallback` pour éviter les re-créations
2. **useMemo** : Les listes prédéfinies utilisent `useMemo` pour éviter les re-créations
3. **setState immutable** : Toutes les mises à jour d'état suivent les patterns immutables
4. **Fonctions séparées** : Les opérations complexes sont divisées en fonctions dédiées
5. **Pas de setState direct** : Aucun setState n'est appelé directement dans le render

### 🎯 **Optimisations ajoutées :**

- **Mémorisation** des constantes avec `useMemo`
- **Callbacks optimisés** avec `useCallback`
- **Mises à jour d'état sécurisées** avec des copies profondes
- **Validation centrale** avec `validateForm`
- **Gestion d'erreurs robuste**

Utilisez cette version corrigée à la place de l'ancienne pour éviter les boucles infinies React ! 🎉 