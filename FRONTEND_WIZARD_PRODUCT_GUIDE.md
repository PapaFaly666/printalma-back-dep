# 🎨 FRONTEND - Guide Endpoint Wizard Produit

## 🚀 **NOUVEAU ENDPOINT DÉDIÉ**

✅ **URL** : `POST /vendor/wizard-products`
✅ **Authentification** : Bearer Token (JWT vendeur)
✅ **Content-Type** : `application/json`

---

## 🎯 **UTILISATION SIMPLE**

### **Quand utiliser cet endpoint ?**
- ✅ Création de produits **SANS design**
- ✅ Upload d'**images propres** au produit
- ✅ Processus **wizard simplifié**
- ❌ **NE PAS** utiliser pour produits avec design appliqué

### **Différence avec `/vendor/products`**
| Critère | `/vendor/products` | `/vendor/wizard-products` |
|---------|-------------------|-------------------------|
| Design requis | ✅ Oui (designId) | ❌ Non |
| Images | Via design | Upload direct base64 |
| Validation | Complexe | Simplifiée |
| Usage | Produits design | Produits wizard |

---

## 📤 **PAYLOAD REQUIS**

```javascript
const wizardProductData = {
  // Mockup de base (obligatoire)
  baseProductId: 34,

  // Informations produit (obligatoires)
  vendorName: "Sweat Custom Noir",
  vendorDescription: "Sweat à capuche personnalisé de qualité premium",
  vendorPrice: 10000, // Prix en FCFA
  vendorStock: 10,    // Optionnel, défaut: 10

  // Couleurs sélectionnées (obligatoire, min 1)
  selectedColors: [
    {
      id: 1,
      name: "Noir",
      colorCode: "#000000"
    },
    {
      id: 2,
      name: "Blanc",
      colorCode: "#FFFFFF"
    }
  ],

  // Tailles sélectionnées (obligatoire, min 1)
  selectedSizes: [
    {
      id: 1,
      sizeName: "S"
    },
    {
      id: 2,
      sizeName: "M"
    },
    {
      id: 3,
      sizeName: "L"
    }
  ],

  // Images du produit (obligatoire)
  productImages: {
    // Image principale (OBLIGATOIRE)
    baseImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",

    // Images détail (OPTIONNEL)
    detailImages: [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  },

  // Statut forcé (optionnel)
  forcedStatus: "DRAFT" // ou "PUBLISHED"
};
```

---

## 🔧 **IMPLÉMENTATION FRONTEND**

### **1. Fonction d'appel API**

```javascript
// api/wizardProducts.js
import api from './config';

export const createWizardProduct = async (wizardData) => {
  try {
    const response = await api.post('/vendor/wizard-products', wizardData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erreur création produit wizard:', error.response?.data);
    throw error;
  }
};
```

### **2. Conversion images en base64**

```javascript
// utils/imageConverter.js
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
};

// Utilisation
const handleImageUpload = async (imageFile) => {
  try {
    const base64Image = await convertImageToBase64(imageFile);
    return base64Image; // "data:image/png;base64,..."
  } catch (error) {
    console.error('Erreur conversion image:', error);
    throw error;
  }
};
```

### **3. Composant wizard complet**

```jsx
// components/WizardProductForm.jsx
import React, { useState } from 'react';
import { createWizardProduct } from '../api/wizardProducts';
import { convertImageToBase64 } from '../utils/imageConverter';

const WizardProductForm = () => {
  const [formData, setFormData] = useState({
    baseProductId: null,
    vendorName: '',
    vendorDescription: '',
    vendorPrice: 0,
    vendorStock: 10,
    selectedColors: [],
    selectedSizes: [],
    productImages: {
      baseImage: null,
      detailImages: []
    },
    forcedStatus: 'DRAFT'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Gestion image principale
  const handleBaseImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const base64Image = await convertImageToBase64(file);
      setFormData(prev => ({
        ...prev,
        productImages: {
          ...prev.productImages,
          baseImage: base64Image
        }
      }));
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        baseImage: 'Erreur upload image principale'
      }));
    }
  };

  // Gestion images détail
  const handleDetailImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const base64Images = await Promise.all(
        files.map(file => convertImageToBase64(file))
      );

      setFormData(prev => ({
        ...prev,
        productImages: {
          ...prev.productImages,
          detailImages: base64Images
        }
      }));
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        detailImages: 'Erreur upload images détail'
      }));
    }
  };

  // Validation formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.baseProductId) {
      newErrors.baseProductId = 'Mockup requis';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Nom du produit requis';
    }

    if (!formData.vendorDescription.trim()) {
      newErrors.vendorDescription = 'Description requise';
    }

    if (formData.vendorPrice <= 0) {
      newErrors.vendorPrice = 'Prix doit être supérieur à 0';
    }

    if (formData.selectedColors.length === 0) {
      newErrors.selectedColors = 'Au moins une couleur requise';
    }

    if (formData.selectedSizes.length === 0) {
      newErrors.selectedSizes = 'Au moins une taille requise';
    }

    if (!formData.productImages.baseImage) {
      newErrors.baseImage = 'Image principale requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createWizardProduct(formData);

      // Succès
      console.log('Produit wizard créé:', result);
      alert('Produit créé avec succès !');

      // Redirection ou reset
      // navigate('/vendor/products');

    } catch (error) {
      // Gestion erreurs
      const errorMessage = error.response?.data?.message || 'Erreur création produit';
      setErrors({ submit: errorMessage });

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="wizard-product-form">
      <h2>🎨 Créer un Produit Wizard</h2>

      {/* Sélection mockup */}
      <div className="form-group">
        <label>Mockup de base *</label>
        <select
          value={formData.baseProductId || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            baseProductId: parseInt(e.target.value)
          }))}
          required
        >
          <option value="">Choisir un mockup...</option>
          <option value="34">Sweat à capuche unisexe</option>
          <option value="35">T-shirt classique</option>
          {/* Charger dynamiquement depuis API */}
        </select>
        {errors.baseProductId && <span className="error">{errors.baseProductId}</span>}
      </div>

      {/* Nom produit */}
      <div className="form-group">
        <label>Nom du produit *</label>
        <input
          type="text"
          value={formData.vendorName}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            vendorName: e.target.value
          }))}
          placeholder="Ex: Sweat Custom Noir"
          required
        />
        {errors.vendorName && <span className="error">{errors.vendorName}</span>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={formData.vendorDescription}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            vendorDescription: e.target.value
          }))}
          placeholder="Description détaillée du produit..."
          required
        />
        {errors.vendorDescription && <span className="error">{errors.vendorDescription}</span>}
      </div>

      {/* Prix */}
      <div className="form-group">
        <label>Prix de vente (FCFA) *</label>
        <input
          type="number"
          value={formData.vendorPrice}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            vendorPrice: parseInt(e.target.value)
          }))}
          min="0"
          placeholder="10000"
          required
        />
        {errors.vendorPrice && <span className="error">{errors.vendorPrice}</span>}
      </div>

      {/* Image principale */}
      <div className="form-group">
        <label>Image principale *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleBaseImageUpload}
          required
        />
        {formData.productImages.baseImage && (
          <img
            src={formData.productImages.baseImage}
            alt="Aperçu"
            className="image-preview"
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
        )}
        {errors.baseImage && <span className="error">{errors.baseImage}</span>}
      </div>

      {/* Images détail */}
      <div className="form-group">
        <label>Images de détail (optionnel)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailImagesUpload}
        />
        {formData.productImages.detailImages.length > 0 && (
          <div className="detail-images-preview">
            {formData.productImages.detailImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Détail ${index + 1}`}
                className="detail-image-preview"
                style={{ maxWidth: '100px', maxHeight: '100px', margin: '5px' }}
              />
            ))}
          </div>
        )}
        {errors.detailImages && <span className="error">{errors.detailImages}</span>}
      </div>

      {/* Couleurs et tailles - composants séparés */}
      <ColorSelector
        selectedColors={formData.selectedColors}
        onChange={(colors) => setFormData(prev => ({
          ...prev,
          selectedColors: colors
        }))}
        error={errors.selectedColors}
      />

      <SizeSelector
        selectedSizes={formData.selectedSizes}
        onChange={(sizes) => setFormData(prev => ({
          ...prev,
          selectedSizes: sizes
        }))}
        error={errors.selectedSizes}
      />

      {/* Statut */}
      <div className="form-group">
        <label>Statut</label>
        <select
          value={formData.forcedStatus}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            forcedStatus: e.target.value
          }))}
        >
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </div>

      {/* Erreur soumission */}
      {errors.submit && (
        <div className="error-message">
          {errors.submit}
        </div>
      )}

      {/* Bouton soumission */}
      <button
        type="submit"
        disabled={loading}
        className="submit-button"
      >
        {loading ? 'Création en cours...' : '🎨 Créer le Produit Wizard'}
      </button>
    </form>
  );
};

export default WizardProductForm;
```

---

## 📊 **RÉPONSE BACKEND**

### **Succès (201 Created)**
```json
{
  "success": true,
  "message": "Produit wizard créé avec succès",
  "data": {
    "id": 789,
    "vendorId": 123,
    "name": "Sweat Custom Noir",
    "description": "Sweat à capuche personnalisé de qualité",
    "price": 10000,
    "status": "DRAFT",
    "productType": "WIZARD",

    "baseProduct": {
      "id": 34,
      "name": "Sweat à capuche unisexe",
      "price": 6000
    },

    "calculations": {
      "basePrice": 6000,
      "vendorProfit": 4000,
      "expectedRevenue": 2800,
      "platformCommission": 1200,
      "marginPercentage": "66.67"
    },

    "selectedColors": [
      {
        "id": 1,
        "name": "Noir",
        "colorCode": "#000000"
      }
    ],

    "selectedSizes": [
      {
        "id": 1,
        "sizeName": "S"
      }
    ],

    "images": [
      {
        "id": 456,
        "url": "https://res.cloudinary.com/printma/image/upload/wizard-product-789-base.jpg",
        "type": "BASE",
        "isMain": true,
        "orderIndex": 0
      },
      {
        "id": 457,
        "url": "https://res.cloudinary.com/printma/image/upload/wizard-product-789-detail-1.jpg",
        "type": "DETAIL",
        "isMain": false,
        "orderIndex": 1
      }
    ],

    "wizard": {
      "createdViaWizard": true,
      "hasDesign": false,
      "imageCount": 2
    },

    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Erreurs possibles**

#### **400 Bad Request - Prix insuffisant**
```json
{
  "success": false,
  "message": "Prix trop bas. Minimum: 6600 FCFA (marge 10%)"
}
```

#### **404 Not Found - Mockup inexistant**
```json
{
  "success": false,
  "message": "Produit de base introuvable"
}
```

#### **400 Bad Request - Validation**
```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    "vendorName requis",
    "Au moins une couleur doit être sélectionnée",
    "Image principale (baseImage) obligatoire"
  ]
}
```

#### **401 Unauthorized**
```json
{
  "message": "Authentification vendeur requise"
}
```

---

## ⚠️ **RÈGLES IMPORTANTES**

### **Validation côté frontend**
1. ✅ **Prix minimum** : Vérifier marge 10% avant envoi
2. ✅ **Images** : Valider format et taille des images
3. ✅ **Couleurs/Tailles** : Au moins 1 de chaque
4. ✅ **Mockup** : Vérifier que le baseProductId existe

### **Gestion d'erreurs**
```javascript
// Exemple gestion d'erreurs complète
const handleCreateWizard = async (wizardData) => {
  try {
    const result = await createWizardProduct(wizardData);

    // Succès
    showSuccess('Produit wizard créé !');
    navigate('/vendor/products');

  } catch (error) {
    const errorData = error.response?.data;

    if (error.response?.status === 400) {
      // Erreur validation
      showError(errorData.message);

    } else if (error.response?.status === 404) {
      // Mockup inexistant
      showError('Mockup sélectionné introuvable');

    } else if (error.response?.status === 401) {
      // Non authentifié
      showError('Session expirée');
      redirectToLogin();

    } else {
      // Erreur générale
      showError('Erreur technique. Réessayez plus tard.');
    }
  }
};
```

### **Optimisations recommandées**
1. 🔄 **Compression images** : Réduire taille avant conversion base64
2. ⏱️ **Debounce** : Éviter appels API multiples
3. 💾 **Cache** : Stocker mockups disponibles
4. 🔄 **Progress** : Indicateur de progression upload

---

## 🧪 **TESTS RECOMMANDÉS**

### **Test 1: Création réussie**
```javascript
// test/wizardProduct.test.js
describe('Wizard Product Creation', () => {
  test('Should create wizard product successfully', async () => {
    const wizardData = {
      baseProductId: 34,
      vendorName: 'Test Wizard',
      vendorDescription: 'Test description',
      vendorPrice: 7000,
      selectedColors: [{ id: 1, name: 'Noir', colorCode: '#000000' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      productImages: {
        baseImage: 'data:image/png;base64,iVBORw0KGgo...'
      }
    };

    const result = await createWizardProduct(wizardData);

    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
    expect(result.data.productType).toBe('WIZARD');
  });
});
```

### **Test 2: Validation prix**
```javascript
test('Should reject insufficient price', async () => {
  const wizardData = {
    baseProductId: 34,
    vendorPrice: 5000, // Trop bas
    // ... autres champs
  };

  await expect(createWizardProduct(wizardData))
    .rejects
    .toThrow('Prix trop bas');
});
```

---

## 🎯 **RÉSUMÉ POUR DÉVELOPPEUR**

### **✅ À faire**
1. Remplacer l'appel `/vendor/products` par `/vendor/wizard-products`
2. Supprimer tous les champs liés aux designs :
   - ❌ `designId`
   - ❌ `productStructure`
   - ❌ `designApplication`
   - ❌ `isWizardProduct`
   - ❌ `bypassValidation`
3. Implémenter conversion images en base64
4. Ajouter validation prix minimum (10%)
5. Gérer les réponses d'erreur spécifiques

### **✅ Avantages**
- 🎯 **Logique claire** : Endpoint dédié au wizard
- 🚀 **Plus simple** : Moins de champs, validation directe
- 🔧 **Maintenable** : Code séparé, pas de conditions
- 📈 **Évolutif** : Nouvelles fonctionnalités wizard indépendantes

### **✅ Support**
Pour toute question sur l'implémentation, référez-vous à cette documentation ou contactez l'équipe backend.

---

**🎨 L'endpoint `/vendor/wizard-products` est maintenant prêt pour le frontend !**