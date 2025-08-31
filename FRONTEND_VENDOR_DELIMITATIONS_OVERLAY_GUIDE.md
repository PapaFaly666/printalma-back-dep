# 🎯 Guide Frontend - Affichage Design dans Délimitations

## 📋 Vue d'ensemble

Ce guide explique comment afficher le design du vendeur superposé dans les zones de délimitation sur les images de produits. Le système utilise les coordonnées de délimitation pour positionner précisément le design sur chaque vue du produit.

---

## 🎨 Concept des Délimitations

### Structure des Données
```typescript
interface Delimitation {
  x: number;           // Position X (pixels ou pourcentage)
  y: number;           // Position Y (pixels ou pourcentage)
  width: number;       // Largeur de la zone
  height: number;      // Hauteur de la zone
  coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
}

interface ProductImage {
  id: number;
  url: string;
  viewType: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';
  delimitations: Delimitation[];
}
```

### Types de Coordonnées
- **ABSOLUTE** : Coordonnées en pixels fixes
- **PERCENTAGE** : Coordonnées en pourcentage (0-100)

---

## 🖼️ Composant Principal - ProductImageWithDesign

```tsx
// src/components/ProductImageWithDesign.tsx
import React, { useState, useRef, useEffect } from 'react';

interface ProductImageWithDesignProps {
  productImage: {
    id: number;
    url: string;
    viewType: string;
    delimitations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
    }>;
  };
  designUrl?: string;
  designConfig?: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  showDelimitations?: boolean;
  className?: string;
}

const ProductImageWithDesign: React.FC<ProductImageWithDesignProps> = ({
  productImage,
  designUrl,
  designConfig = { positioning: 'CENTER', scale: 0.8 },
  showDelimitations = false,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      const { offsetWidth, offsetHeight } = imageRef.current;
      
      setImageDimensions({
        width: offsetWidth,
        height: offsetHeight
      });
    }
  }, [imageLoaded]);

  // Calculer les coordonnées absolues depuis les délimitations
  const getAbsoluteCoordinates = (delimitation: any) => {
    if (!imageRef.current || !imageLoaded) return null;

    const img = imageRef.current;
    const containerWidth = img.offsetWidth;
    const containerHeight = img.offsetHeight;

    if (delimitation.coordinateType === 'PERCENTAGE') {
      return {
        x: (delimitation.x / 100) * containerWidth,
        y: (delimitation.y / 100) * containerHeight,
        width: (delimitation.width / 100) * containerWidth,
        height: (delimitation.height / 100) * containerHeight
      };
    } else {
      // ABSOLUTE - ajuster selon le ratio de redimensionnement
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      
      return {
        x: delimitation.x * scaleX,
        y: delimitation.y * scaleY,
        width: delimitation.width * scaleX,
        height: delimitation.height * scaleY
      };
    }
  };

  // Calculer la position et taille du design dans une délimitation
  const getDesignStyle = (delimitation: any) => {
    const coords = getAbsoluteCoordinates(delimitation);
    if (!coords) return {};

    const designWidth = coords.width * designConfig.scale;
    const designHeight = coords.height * designConfig.scale;

    let designX = coords.x;
    let designY = coords.y;

    // Appliquer le positionnement
    switch (designConfig.positioning) {
      case 'CENTER':
        designX += (coords.width - designWidth) / 2;
        designY += (coords.height - designHeight) / 2;
        break;
      case 'TOP':
        designX += (coords.width - designWidth) / 2;
        designY += 10; // Marge du haut
        break;
      case 'BOTTOM':
        designX += (coords.width - designWidth) / 2;
        designY += coords.height - designHeight - 10; // Marge du bas
        break;
    }

    return {
      position: 'absolute' as const,
      left: `${designX}px`,
      top: `${designY}px`,
      width: `${designWidth}px`,
      height: `${designHeight}px`,
      zIndex: 10,
      pointerEvents: 'none' as const
    };
  };

  // Style pour afficher les zones de délimitation (debug)
  const getDelimitationStyle = (delimitation: any) => {
    const coords = getAbsoluteCoordinates(delimitation);
    if (!coords) return {};

    return {
      position: 'absolute' as const,
      left: `${coords.x}px`,
      top: `${coords.y}px`,
      width: `${coords.width}px`,
      height: `${coords.height}px`,
      border: '2px dashed #ff6b6b',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      zIndex: 5,
      pointerEvents: 'none' as const
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ lineHeight: 0 }}
    >
      {/* Image du produit */}
      <img
        ref={imageRef}
        src={productImage.url}
        alt={`Vue ${productImage.viewType}`}
        className="max-w-full h-auto"
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error('Erreur chargement image:', productImage.url);
          e.currentTarget.src = '/placeholder-product.png';
        }}
      />

      {/* Overlay des designs */}
      {imageLoaded && designUrl && productImage.delimitations.map((delimitation, index) => (
        <img
          key={`design-${index}`}
          src={designUrl}
          alt="Design appliqué"
          style={getDesignStyle(delimitation)}
          className="object-contain"
          onError={(e) => {
            console.error('Erreur chargement design:', designUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      ))}

      {/* Overlay des délimitations (mode debug) */}
      {showDelimitations && imageLoaded && productImage.delimitations.map((delimitation, index) => (
        <div
          key={`delimitation-${index}`}
          style={getDelimitationStyle(delimitation)}
          title={`Délimitation ${index + 1}: ${delimitation.coordinateType}`}
        >
          <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded">
            {index + 1}
          </div>
        </div>
      ))}

      {/* Indicateur de vue */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
        {productImage.viewType}
      </div>
    </div>
  );
};

export default ProductImageWithDesign;
```

---

## 🎮 Composant Galerie - ProductImageGallery

```tsx
// src/components/ProductImageGallery.tsx
import React, { useState } from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';

interface ProductImageGalleryProps {
  product: {
    adminProduct: {
      images: {
        colorVariations: Array<{
          id: number;
          name: string;
          colorCode: string;
          images: Array<{
            id: number;
            url: string;
            viewType: string;
            delimitations: Array<{
              x: number;
              y: number;
              width: number;
              height: number;
              coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
            }>;
          }>;
        }>;
      };
    };
    designApplication?: {
      designUrl: string;
      positioning: 'CENTER' | 'TOP' | 'BOTTOM';
      scale: number;
    };
    selectedColors: Array<{
      id: number;
      name: string;
      colorCode: string;
    }>;
  };
  showDelimitations?: boolean;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  showDelimitations = false
}) => {
  const [selectedColorId, setSelectedColorId] = useState(
    product.selectedColors[0]?.id || null
  );
  const [selectedViewType, setSelectedViewType] = useState<string>('FRONT');

  // Filtrer les couleurs sélectionnées par le vendeur
  const availableColors = product.adminProduct.images.colorVariations.filter(
    color => product.selectedColors.some(selected => selected.id === color.id)
  );

  // Obtenir la couleur actuellement sélectionnée
  const currentColor = availableColors.find(color => color.id === selectedColorId);

  // Obtenir l'image pour la vue sélectionnée
  const currentImage = currentColor?.images.find(
    img => img.viewType === selectedViewType
  ) || currentColor?.images[0];

  // Obtenir toutes les vues disponibles pour la couleur actuelle
  const availableViews = currentColor?.images.map(img => img.viewType) || [];

  return (
    <div className="space-y-6">
      {/* Sélecteur de couleur */}
      <div className="flex flex-wrap gap-3">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          Couleur:
        </span>
        {availableColors.map((color) => (
          <button
            key={color.id}
            onClick={() => setSelectedColorId(color.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
              selectedColorId === color.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color.colorCode }}
            />
            <span className="text-sm font-medium">{color.name}</span>
          </button>
        ))}
      </div>

      {/* Sélecteur de vue */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          Vue:
        </span>
        {availableViews.map((viewType) => (
          <button
            key={viewType}
            onClick={() => setSelectedViewType(viewType)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedViewType === viewType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {viewType}
          </button>
        ))}
      </div>

      {/* Image principale avec design */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-6">
        {currentImage ? (
          <ProductImageWithDesign
            productImage={currentImage}
            designUrl={product.designApplication?.designUrl}
            designConfig={{
              positioning: product.designApplication?.positioning || 'CENTER',
              scale: product.designApplication?.scale || 0.8
            }}
            showDelimitations={showDelimitations}
            className="max-w-md"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Aucune image disponible pour cette couleur
          </div>
        )}
      </div>

      {/* Vignettes des autres vues */}
      {currentColor && currentColor.images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentColor.images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedViewType(image.viewType)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedViewType === image.viewType
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <ProductImageWithDesign
                productImage={image}
                designUrl={product.designApplication?.designUrl}
                designConfig={{
                  positioning: product.designApplication?.positioning || 'CENTER',
                  scale: product.designApplication?.scale || 0.8
                }}
                showDelimitations={false}
                className="w-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Toggle délimitations (mode debug) */}
      <div className="flex items-center space-x-2 text-sm">
        <input
          type="checkbox"
          id="show-delimitations"
          checked={showDelimitations}
          onChange={(e) => {
            // Cette prop devrait être gérée par le composant parent
            console.log('Toggle délimitations:', e.target.checked);
          }}
          className="rounded"
        />
        <label htmlFor="show-delimitations" className="text-gray-600">
          Afficher les zones de délimitation (Debug)
        </label>
      </div>
    </div>
  );
};

export default ProductImageGallery;
```

---

## 🔧 Hook pour la Gestion des Délimitations

```typescript
// src/hooks/useDelimitations.ts
import { useState, useCallback } from 'react';

interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
}

interface UseDelimitationsOptions {
  imageNaturalWidth?: number;
  imageNaturalHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const useDelimitations = (options: UseDelimitationsOptions = {}) => {
  const [delimitations, setDelimitations] = useState<DelimitationData[]>([]);

  // Convertir coordonnées absolues en pourcentage
  const toPercentage = useCallback((delimitation: DelimitationData): DelimitationData => {
    if (delimitation.coordinateType === 'PERCENTAGE') {
      return delimitation;
    }

    const { imageNaturalWidth, imageNaturalHeight } = options;
    if (!imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    return {
      x: (delimitation.x / imageNaturalWidth) * 100,
      y: (delimitation.y / imageNaturalHeight) * 100,
      width: (delimitation.width / imageNaturalWidth) * 100,
      height: (delimitation.height / imageNaturalHeight) * 100,
      coordinateType: 'PERCENTAGE'
    };
  }, [options.imageNaturalWidth, options.imageNaturalHeight]);

  // Convertir coordonnées pourcentage en absolues
  const toAbsolute = useCallback((delimitation: DelimitationData): DelimitationData => {
    if (delimitation.coordinateType === 'ABSOLUTE') {
      return delimitation;
    }

    const { imageNaturalWidth, imageNaturalHeight } = options;
    if (!imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    return {
      x: (delimitation.x / 100) * imageNaturalWidth,
      y: (delimitation.y / 100) * imageNaturalHeight,
      width: (delimitation.width / 100) * imageNaturalWidth,
      height: (delimitation.height / 100) * imageNaturalHeight,
      coordinateType: 'ABSOLUTE'
    };
  }, [options.imageNaturalWidth, options.imageNaturalHeight]);

  // Obtenir coordonnées pour l'affichage (ajustées au container)
  const getDisplayCoordinates = useCallback((delimitation: DelimitationData) => {
    const { containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight } = options;
    
    if (!containerWidth || !containerHeight || !imageNaturalWidth || !imageNaturalHeight) {
      return delimitation;
    }

    const scaleX = containerWidth / imageNaturalWidth;
    const scaleY = containerHeight / imageNaturalHeight;

    if (delimitation.coordinateType === 'PERCENTAGE') {
      return {
        x: (delimitation.x / 100) * containerWidth,
        y: (delimitation.y / 100) * containerHeight,
        width: (delimitation.width / 100) * containerWidth,
        height: (delimitation.height / 100) * containerHeight,
        coordinateType: 'ABSOLUTE' as const
      };
    } else {
      return {
        x: delimitation.x * scaleX,
        y: delimitation.y * scaleY,
        width: delimitation.width * scaleX,
        height: delimitation.height * scaleY,
        coordinateType: 'ABSOLUTE' as const
      };
    }
  }, [options]);

  // Valider qu'une délimitation est dans les limites
  const isValidDelimitation = useCallback((delimitation: DelimitationData): boolean => {
    if (delimitation.coordinateType === 'PERCENTAGE') {
      return (
        delimitation.x >= 0 && delimitation.x <= 100 &&
        delimitation.y >= 0 && delimitation.y <= 100 &&
        delimitation.width > 0 && delimitation.width <= (100 - delimitation.x) &&
        delimitation.height > 0 && delimitation.height <= (100 - delimitation.y)
      );
    } else {
      const { imageNaturalWidth, imageNaturalHeight } = options;
      if (!imageNaturalWidth || !imageNaturalHeight) return true;

      return (
        delimitation.x >= 0 && delimitation.x <= imageNaturalWidth &&
        delimitation.y >= 0 && delimitation.y <= imageNaturalHeight &&
        delimitation.width > 0 && delimitation.width <= (imageNaturalWidth - delimitation.x) &&
        delimitation.height > 0 && delimitation.height <= (imageNaturalHeight - delimitation.y)
      );
    }
  }, [options]);

  return {
    delimitations,
    setDelimitations,
    toPercentage,
    toAbsolute,
    getDisplayCoordinates,
    isValidDelimitation
  };
};
```

---

## 🎨 Composant de Prévisualisation - DesignPreview

```tsx
// src/components/DesignPreview.tsx
import React from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';

interface DesignPreviewProps {
  adminProduct: {
    name: string;
    images: {
      colorVariations: Array<{
        id: number;
        name: string;
        colorCode: string;
        images: Array<{
          id: number;
          url: string;
          viewType: string;
          delimitations: any[];
        }>;
      }>;
    };
  };
  designUrl: string;
  designConfig: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  maxImages?: number;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({
  adminProduct,
  designUrl,
  designConfig,
  selectedColors,
  maxImages = 4
}) => {
  // Collecter toutes les images des couleurs sélectionnées
  const previewImages: Array<{
    image: any;
    color: any;
  }> = [];

  selectedColors.forEach(selectedColor => {
    const colorVariation = adminProduct.images.colorVariations.find(
      cv => cv.id === selectedColor.id
    );
    
    if (colorVariation) {
      // Prioriser la vue FRONT, sinon prendre la première
      const frontImage = colorVariation.images.find(img => img.viewType === 'FRONT');
      const imageToUse = frontImage || colorVariation.images[0];
      
      if (imageToUse) {
        previewImages.push({
          image: imageToUse,
          color: colorVariation
        });
      }
    }
  });

  // Limiter le nombre d'images
  const limitedImages = previewImages.slice(0, maxImages);

  if (limitedImages.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">Aucune image de prévisualisation disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Aperçu du Design sur {adminProduct.name}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {limitedImages.map(({ image, color }, index) => (
          <div key={`preview-${image.id}-${color.id}`} className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: color.colorCode }}
              />
              <span className="font-medium">{color.name}</span>
              <span className="text-gray-500">- {image.viewType}</span>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <ProductImageWithDesign
                productImage={image}
                designUrl={designUrl}
                designConfig={designConfig}
                showDelimitations={false}
                className="w-full max-w-xs mx-auto"
              />
            </div>
          </div>
        ))}
      </div>

      {previewImages.length > maxImages && (
        <p className="text-sm text-gray-500 text-center">
          Et {previewImages.length - maxImages} autre(s) couleur(s)...
        </p>
      )}
    </div>
  );
};

export default DesignPreview;
```

---

## 🔗 Intégration dans la Page Produit Vendeur

```tsx
// Modification du composant VendorProductDetail existant
import ProductImageGallery from '../components/ProductImageGallery';
import DesignPreview from '../components/DesignPreview';

// Dans le JSX du composant VendorProductDetail :
<div className="grid md:grid-cols-2 gap-8">
  {/* Galerie d'images avec design */}
  <div className="space-y-4">
    <ProductImageGallery
      product={product}
      showDelimitations={false} // Passer à true pour le debug
    />
  </div>

  {/* Informations du produit */}
  <div className="space-y-6">
    {/* ... autres informations ... */}
    
    {/* Aperçu design */}
    {product.designApplication?.designUrl && (
      <div className="bg-white rounded-lg shadow p-6">
        <DesignPreview
          adminProduct={product.adminProduct}
          designUrl={product.designApplication.designUrl}
          designConfig={{
            positioning: product.designApplication.positioning || 'CENTER',
            scale: product.designApplication.scale || 0.8
          }}
          selectedColors={product.selectedColors}
          maxImages={2}
        />
      </div>
    )}
  </div>
</div>
```

---

## 🎮 Composant de Configuration Design

```tsx
// src/components/DesignConfigPanel.tsx
import React from 'react';

interface DesignConfigPanelProps {
  config: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  onChange: (config: { positioning: 'CENTER' | 'TOP' | 'BOTTOM'; scale: number }) => void;
  disabled?: boolean;
}

const DesignConfigPanel: React.FC<DesignConfigPanelProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const updateConfig = (updates: Partial<typeof config>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-gray-900">Configuration du Design</h4>
      
      {/* Positionnement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Positionnement
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['TOP', 'CENTER', 'BOTTOM'].map((position) => (
            <button
              key={position}
              onClick={() => updateConfig({ positioning: position as any })}
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                config.positioning === position
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {position === 'TOP' ? 'Haut' : position === 'CENTER' ? 'Centre' : 'Bas'}
            </button>
          ))}
        </div>
      </div>

      {/* Échelle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Taille du Design: {Math.round(config.scale * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={config.scale}
          onChange={(e) => updateConfig({ scale: parseFloat(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>30%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default DesignConfigPanel;
```

---

## 🚀 Utilisation et Tests

### Test Simple
```typescript
// Test d'affichage avec données fictives
const testProduct = {
  adminProduct: {
    images: {
      colorVariations: [{
        id: 1,
        name: 'Noir',
        colorCode: '#000000',
        images: [{
          id: 1,
          url: 'https://example.com/tshirt-black-front.jpg',
          viewType: 'FRONT',
          delimitations: [{
            x: 25, y: 30, width: 50, height: 40,
            coordinateType: 'PERCENTAGE'
          }]
        }]
      }]
    }
  },
  designApplication: {
    designUrl: 'https://res.cloudinary.com/your-cloud/image/upload/design.png',
    positioning: 'CENTER',
    scale: 0.8
  },
  selectedColors: [{ id: 1, name: 'Noir', colorCode: '#000000' }]
};
```

### Debug Mode
```tsx
// Activer le mode debug pour voir les délimitations
<ProductImageWithDesign
  productImage={image}
  designUrl={designUrl}
  designConfig={config}
  showDelimitations={true} // Mode debug activé
/>
```

---

## 📋 Points Importants

### ✅ Bonnes Pratiques
1. **Responsive** : Les délimitations s'adaptent à la taille d'affichage
2. **Performance** : Chargement lazy des images
3. **Gestion d'erreurs** : Images de fallback en cas d'échec
4. **Accessibilité** : Alt text et attributs ARIA appropriés

### ⚠️ Points d'Attention
1. **Coordonnées** : Vérifier le type (ABSOLUTE vs PERCENTAGE)
2. **Ratios** : Maintenir les proportions lors du redimensionnement
3. **Performance** : Optimiser les images Cloudinary
4. **Validation** : S'assurer que les délimitations sont dans les limites

Ce guide vous permet d'afficher précisément le design du vendeur dans les zones de délimitation sur toutes les vues du produit ! 