# 🎨 GUIDE FRONTEND - Endpoint POST /api/vendeur/create-product

## 📋 Vue d'ensemble

Ce document détaille l'intégration frontend de l'endpoint `/api/vendeur/create-product` spécialement conçu pour le wizard de création de produits vendeur. Cet endpoint gère la création complète d'un produit avec upload d'images et validations avancées.

## 🔌 ENDPOINT

**URL:** `POST /api/vendeur/create-product`
**Type:** `multipart/form-data`
**Auth:** Bearer Token requis (role VENDEUR)

---

## 📨 FORMAT DE LA REQUÊTE

### **Structure des données à envoyer**

```typescript
// Interface TypeScript pour les données
interface WizardProductData {
  // Étape 1: Mockup sélectionné
  selectedMockup: {
    id: number;
    name: string;
    price: number; // Prix de revient en FCFA
    suggestedPrice?: number;
  };

  // Étape 2: Informations produit
  productName: string;
  productDescription: string;
  productPrice: number; // Prix en FCFA (pas en centimes)
  basePrice: number; // Prix de revient
  vendorProfit: number; // Bénéfice calculé
  expectedRevenue: number; // Revenu attendu (70% du profit)
  isPriceCustomized: boolean;

  // Étape 3: Sélections
  selectedTheme: string; // ID de la catégorie design
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;

  // Action post-validation
  postValidationAction: 'TO_DRAFT' | 'TO_PUBLISHED';
}
```

### **Structure des images**

```typescript
interface WizardImages {
  baseImage: File; // OBLIGATOIRE - Image principale
  detailImage_1?: File; // Optionnel - Image détail 1
  detailImage_2?: File; // Optionnel - Image détail 2
  // ... jusqu'à detailImage_15
}
```

---

## 🚀 IMPLÉMENTATION FRONTEND

### **1. Hook React pour l'upload**

```typescript
import { useState } from 'react';
import axios from 'axios';

interface UseWizardProductUpload {
  uploadProduct: (data: WizardProductData, images: WizardImages) => Promise<any>;
  loading: boolean;
  error: string | null;
  progress: number;
}

export const useWizardProductUpload = (): UseWizardProductUpload => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadProduct = async (
    productData: WizardProductData,
    images: WizardImages
  ) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Créer FormData
      const formData = new FormData();

      // Ajouter les données JSON
      formData.append('productData', JSON.stringify(productData));

      // Ajouter l'image principale (OBLIGATOIRE)
      if (!images.baseImage) {
        throw new Error('Image principale obligatoire');
      }
      formData.append('baseImage', images.baseImage);

      // Ajouter les images de détail (optionnelles)
      for (let i = 1; i <= 15; i++) {
        const detailImage = images[`detailImage_${i}` as keyof WizardImages];
        if (detailImage) {
          formData.append(`detailImage_${i}`, detailImage);
        }
      }

      // Envoyer la requête
      const response = await axios.post('/api/vendeur/create-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          setProgress(percentCompleted);
        }
      });

      return response.data;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { uploadProduct, loading, error, progress };
};
```

### **2. Composant Wizard - Étape finale**

```tsx
import React, { useState } from 'react';
import { useWizardProductUpload } from './hooks/useWizardProductUpload';

interface WizardFinalStepProps {
  wizardData: WizardProductData;
  images: WizardImages;
  onSuccess: (productId: number) => void;
  onError: (error: string) => void;
}

export const WizardFinalStep: React.FC<WizardFinalStepProps> = ({
  wizardData,
  images,
  onSuccess,
  onError
}) => {
  const { uploadProduct, loading, error, progress } = useWizardProductUpload();
  const [validationErrors, setValidationErrors] = useState<any>(null);

  const handleSubmit = async (action: 'TO_DRAFT' | 'TO_PUBLISHED') => {
    try {
      // Validation côté frontend
      const validationResult = validateWizardData(wizardData, images);
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        return;
      }

      // Préparer les données finales
      const finalData: WizardProductData = {
        ...wizardData,
        postValidationAction: action
      };

      // Envoyer la requête
      const result = await uploadProduct(finalData, images);

      if (result.success) {
        onSuccess(result.data.id);
      } else {
        onError(result.message || 'Erreur lors de la création');
      }

    } catch (error: any) {
      // Gestion des erreurs de validation backend
      if (error.response?.status === 400) {
        const backendError = error.response.data;
        setValidationErrors({
          step: backendError.details?.step,
          field: backendError.details?.field,
          message: backendError.message,
          suggestions: backendError.suggestions
        });
      }
      onError(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="wizard-final-step">
      {/* Résumé du produit */}
      <div className="product-summary">
        <h3>Résumé de votre produit</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Nom:</span>
            <span>{wizardData.productName}</span>
          </div>
          <div className="summary-item">
            <span>Prix:</span>
            <span>{wizardData.productPrice.toLocaleString()} FCFA</span>
          </div>
          <div className="summary-item">
            <span>Bénéfice:</span>
            <span>{wizardData.vendorProfit.toLocaleString()} FCFA</span>
          </div>
          <div className="summary-item">
            <span>Revenu attendu:</span>
            <span>{wizardData.expectedRevenue.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Images aperçu */}
      <div className="images-preview">
        <h4>Images du produit</h4>
        <div className="images-grid">
          {images.baseImage && (
            <div className="image-preview base-image">
              <img src={URL.createObjectURL(images.baseImage)} alt="Image principale" />
              <span className="image-label">Principale</span>
            </div>
          )}
          {Object.entries(images).map(([key, file]) => {
            if (key.startsWith('detailImage_') && file) {
              return (
                <div key={key} className="image-preview detail-image">
                  <img src={URL.createObjectURL(file)} alt={`Détail ${key}`} />
                  <span className="image-label">Détail</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Erreurs de validation */}
      {validationErrors && (
        <div className="validation-errors">
          <h4>Erreurs de validation</h4>
          <div className="error-message">{validationErrors.message}</div>
          {validationErrors.suggestions && (
            <ul className="error-suggestions">
              {validationErrors.suggestions.map((suggestion: string, index: number) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Erreur générale */}
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      {/* Barre de progression */}
      {loading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{progress}% - Création en cours...</span>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="action-buttons">
        <button
          type="button"
          onClick={() => handleSubmit('TO_DRAFT')}
          disabled={loading}
          className="btn-secondary"
        >
          Sauvegarder en brouillon
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('TO_PUBLISHED')}
          disabled={loading}
          className="btn-primary"
        >
          Publier directement
        </button>
      </div>
    </div>
  );
};
```

### **3. Fonction de validation côté frontend**

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: any;
}

const validateWizardData = (
  data: WizardProductData,
  images: WizardImages
): ValidationResult => {
  const errors: any = {};

  // Validation image principale
  if (!images.baseImage) {
    errors.baseImage = 'Image principale obligatoire';
  }

  // Validation prix minimum (marge 10%)
  const minimumPrice = data.basePrice * 1.1;
  if (data.productPrice < minimumPrice) {
    errors.productPrice = `Prix minimum: ${minimumPrice.toLocaleString()} FCFA (marge 10%)`;
  }

  // Validation calculs
  const expectedProfit = data.productPrice - data.basePrice;
  const expectedRevenue = Math.round(expectedProfit * 0.7);

  if (Math.abs(data.vendorProfit - expectedProfit) > 1) {
    errors.vendorProfit = 'Erreur dans le calcul du bénéfice';
  }

  if (Math.abs(data.expectedRevenue - expectedRevenue) > 1) {
    errors.expectedRevenue = 'Erreur dans le calcul du revenu attendu';
  }

  // Validation sélections
  if (!data.selectedColors.length) {
    errors.selectedColors = 'Au moins une couleur doit être sélectionnée';
  }

  if (!data.selectedSizes.length) {
    errors.selectedSizes = 'Au moins une taille doit être sélectionnée';
  }

  // Validation taille des images
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (images.baseImage) {
    if (images.baseImage.size > maxSize) {
      errors.baseImageSize = 'Image principale trop volumineuse (max 5MB)';
    }
    if (!allowedTypes.includes(images.baseImage.type)) {
      errors.baseImageType = 'Type d\'image non autorisé (JPG, PNG, WebP uniquement)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### **4. Utilitaires pour les calculs**

```typescript
export const WizardCalculations = {
  // Calculer le bénéfice vendeur
  calculateVendorProfit: (sellingPrice: number, basePrice: number): number => {
    return sellingPrice - basePrice;
  },

  // Calculer le revenu attendu (70% du bénéfice)
  calculateExpectedRevenue: (vendorProfit: number): number => {
    return Math.round(vendorProfit * 0.7);
  },

  // Calculer la commission plateforme (30% du bénéfice)
  calculatePlatformCommission: (vendorProfit: number): number => {
    return Math.round(vendorProfit * 0.3);
  },

  // Calculer le prix minimum autorisé (marge 10%)
  calculateMinimumPrice: (basePrice: number): number => {
    return basePrice * 1.1;
  },

  // Calculer le pourcentage de marge
  calculateMarginPercentage: (sellingPrice: number, basePrice: number): number => {
    return ((sellingPrice - basePrice) / basePrice) * 100;
  },

  // Valider que tous les calculs sont cohérents
  validateCalculations: (data: WizardProductData): boolean => {
    const expectedProfit = WizardCalculations.calculateVendorProfit(
      data.productPrice,
      data.basePrice
    );
    const expectedRevenue = WizardCalculations.calculateExpectedRevenue(expectedProfit);

    return (
      Math.abs(data.vendorProfit - expectedProfit) <= 1 &&
      Math.abs(data.expectedRevenue - expectedRevenue) <= 1
    );
  }
};
```

---

## 📤 RÉPONSES DE L'API

### **Succès (201 Created)**

```json
{
  "success": true,
  "message": "Produit créé avec succès via le wizard",
  "data": {
    "id": 456,
    "vendorId": 123,
    "productName": "Mon T-shirt Custom Design",
    "productPrice": 8500,
    "basePrice": 6000,
    "vendorProfit": 2500,
    "expectedRevenue": 1750,
    "platformCommission": 750,
    "status": "DRAFT",
    "validationStatus": "PENDING",

    "mockup": {
      "id": 123,
      "name": "T-shirt Basic",
      "basePrice": 6000
    },

    "theme": {
      "id": 5,
      "name": "Moderne",
      "color": "#3b82f6"
    },

    "selectedColors": [
      { "id": 1, "name": "Noir", "colorCode": "#000000" },
      { "id": 2, "name": "Blanc", "colorCode": "#ffffff" }
    ],

    "selectedSizes": [
      { "id": 1, "sizeName": "M" },
      { "id": 2, "sizeName": "L" },
      { "id": 3, "sizeName": "XL" }
    ],

    "images": {
      "baseImage": {
        "id": 1,
        "url": "https://res.cloudinary.com/vendor-products/123/base_design1.jpg",
        "isBase": true,
        "type": "base"
      },
      "detailImages": [
        {
          "id": 2,
          "url": "https://res.cloudinary.com/vendor-products/123/detail_1_design2.jpg",
          "isBase": false,
          "type": "detail"
        }
      ],
      "totalImages": 2
    },

    "wizard": {
      "createdViaWizard": true,
      "priceCustomized": true,
      "completedSteps": 5
    },

    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Erreur de validation (400 Bad Request)**

```json
{
  "success": false,
  "error": "INSUFFICIENT_MARGIN",
  "message": "Prix minimum autorisé: 6600 FCFA (marge 10% minimum)",
  "details": {
    "step": 2,
    "field": "productPrice",
    "baseCost": 6000,
    "minimumPrice": 6600,
    "providedPrice": 6500,
    "requiredMargin": "10%"
  },
  "suggestions": [
    "Augmentez le prix de vente à au moins 6600 FCFA",
    "Le prix de revient du mockup est de 6000 FCFA",
    "Une marge de 10% minimum est requise"
  ]
}
```

---

## 🔧 GESTION D'ERREURS FRONTEND

### **Types d'erreurs possibles**

```typescript
enum WizardErrorTypes {
  // Erreurs de validation
  INSUFFICIENT_MARGIN = 'INSUFFICIENT_MARGIN',
  INVALID_COLORS = 'INVALID_COLORS',
  INVALID_SIZES = 'INVALID_SIZES',
  CALCULATION_ERROR = 'CALCULATION_ERROR',

  // Erreurs d'images
  MISSING_BASE_IMAGE = 'MISSING_BASE_IMAGE',
  INVALID_IMAGE_TYPE = 'INVALID_IMAGE_TYPE',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',

  // Erreurs générales
  MOCKUP_NOT_FOUND = 'MOCKUP_NOT_FOUND',
  INVALID_THEME = 'INVALID_THEME',
  UNAUTHORIZED = 'UNAUTHORIZED'
}
```

### **Composant de gestion d'erreurs**

```tsx
interface ErrorHandlerProps {
  error: any;
  onRetry: () => void;
  onGoBack: () => void;
}

export const WizardErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onGoBack
}) => {
  const getErrorMessage = (errorType: string) => {
    const messages = {
      [WizardErrorTypes.INSUFFICIENT_MARGIN]: {
        title: 'Marge insuffisante',
        description: 'Le prix de vente doit être au moins 10% supérieur au prix de revient.',
        action: 'Augmenter le prix'
      },
      [WizardErrorTypes.MISSING_BASE_IMAGE]: {
        title: 'Image principale manquante',
        description: 'Vous devez télécharger au moins une image principale.',
        action: 'Ajouter une image'
      },
      [WizardErrorTypes.INVALID_COLORS]: {
        title: 'Couleurs non disponibles',
        description: 'Certaines couleurs sélectionnées ne sont pas disponibles pour ce mockup.',
        action: 'Modifier les couleurs'
      }
      // ... autres messages
    };

    return messages[errorType] || {
      title: 'Erreur inconnue',
      description: 'Une erreur inattendue s\'est produite.',
      action: 'Réessayer'
    };
  };

  const errorInfo = getErrorMessage(error.error);

  return (
    <div className="wizard-error">
      <div className="error-icon">⚠️</div>
      <h3>{errorInfo.title}</h3>
      <p>{error.message || errorInfo.description}</p>

      {error.suggestions && (
        <ul className="error-suggestions">
          {error.suggestions.map((suggestion: string, index: number) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}

      <div className="error-actions">
        <button onClick={onGoBack} className="btn-secondary">
          Retour
        </button>
        <button onClick={onRetry} className="btn-primary">
          {errorInfo.action}
        </button>
      </div>
    </div>
  );
};
```

---

## 🎯 BONNES PRATIQUES

### **1. Optimisation des performances**

```typescript
// Compression d'images avant upload
const compressImage = (file: File, maxSize: number = 1024): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: file.type }));
      }, file.type, 0.9);
    };

    img.src = URL.createObjectURL(file);
  });
};
```

### **2. Cache des données**

```typescript
// Hook pour persister les données du wizard
export const useWizardPersistence = () => {
  const STORAGE_KEY = 'wizard_product_data';

  const saveWizardData = (data: WizardProductData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadWizardData = (): WizardProductData | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  };

  const clearWizardData = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { saveWizardData, loadWizardData, clearWizardData };
};
```

### **3. Validation en temps réel**

```typescript
// Hook pour validation en temps réel
export const useRealTimeValidation = (data: WizardProductData) => {
  const [validationState, setValidationState] = useState({
    isValid: false,
    errors: {},
    warnings: {}
  });

  useEffect(() => {
    const validate = () => {
      const result = validateWizardData(data, {} as WizardImages);

      // Calculs automatiques
      const autoCalculated = {
        ...data,
        vendorProfit: WizardCalculations.calculateVendorProfit(data.productPrice, data.basePrice),
        expectedRevenue: WizardCalculations.calculateExpectedRevenue(data.vendorProfit)
      };

      setValidationState({
        isValid: result.isValid,
        errors: result.errors,
        warnings: generateWarnings(autoCalculated)
      });
    };

    validate();
  }, [data]);

  return validationState;
};
```

---

## ✅ CHECKLIST INTÉGRATION

- [ ] Hook `useWizardProductUpload` implémenté
- [ ] Composant `WizardFinalStep` créé
- [ ] Validation frontend ajoutée
- [ ] Gestion d'erreurs implémentée
- [ ] Upload d'images avec compression
- [ ] Persistence des données wizard
- [ ] Calculs automatiques en temps réel
- [ ] Barre de progression d'upload
- [ ] Messages d'erreur utilisateur-friendly
- [ ] Tests d'intégration API

---

**🎯 Objectif:** Fournir une intégration frontend complète et robuste pour l'endpoint wizard de création de produits, avec une expérience utilisateur optimale et une gestion d'erreurs sophistiquée.