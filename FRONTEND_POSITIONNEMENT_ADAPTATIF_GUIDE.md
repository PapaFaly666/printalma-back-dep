# Guide Frontend - Positionnement adaptatif des designs

## 🎯 Solution au problème

Désormais, chaque type de produit (t-shirt, mug, casquette, etc.) a son positionnement optimal automatique. Fini les designs mal placés !

## 📡 Nouveaux endpoints disponibles

### 1. Obtenir le positionnement optimal
```
GET /vendor-design-transforms/products/{productId}/design-positioning?designUrl={url}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "positioning": {
      "x": 50,
      "y": 35,
      "width": 25,
      "height": 30,
      "rotation": 0
    },
    "productType": "tshirt",
    "description": "T-shirt - Position poitrine optimisée",
    "presets": {
      "center": { "x": 50, "y": 35, "width": 25, "height": 30, "rotation": 0 },
      "chest": { "x": 50, "y": 30, "width": 25, "height": 30, "rotation": 0 },
      "lower": { "x": 50, "y": 55, "width": 25, "height": 30, "rotation": 0 },
      "small": { "x": 50, "y": 35, "width": 15, "height": 20, "rotation": 0 },
      "large": { "x": 50, "y": 35, "width": 35, "height": 40, "rotation": 0 }
    }
  },
  "message": "Positionnement optimal pour tshirt calculé"
}
```

### 2. Sauvegarder un positionnement personnalisé
```
POST /vendor-design-transforms/products/{productId}/design-positioning
```

**Corps :**
```json
{
  "designUrl": "https://res.cloudinary.com/...",
  "positioning": {
    "x": 50,
    "y": 40,
    "width": 30,
    "height": 35,
    "rotation": 0
  }
}
```

### 3. Obtenir les presets disponibles
```
GET /vendor-design-transforms/products/{productId}/positioning-presets
```

## 🔧 Intégration React

### Hook personnalisé
```tsx
// useAdaptivePositioning.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface DesignPositioning {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const useAdaptivePositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState<DesignPositioning | null>(null);
  const [productType, setProductType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [presets, setPresets] = useState<Record<string, DesignPositioning>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      if (!productId || !designUrl) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `/vendor-design-transforms/products/${productId}/design-positioning`,
          { params: { designUrl } }
        );
        
        const { positioning, productType, description, presets } = response.data.data;
        setPositioning(positioning);
        setProductType(productType);
        setDescription(description);
        setPresets(presets);
      } catch (error) {
        console.error('Erreur chargement positionnement:', error);
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
        setProductType('default');
        setDescription('Position standard');
      } finally {
        setLoading(false);
      }
    };

    loadOptimalPositioning();
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    try {
      await axios.post(
        `/vendor-design-transforms/products/${productId}/design-positioning`,
        { designUrl, positioning: newPositioning }
      );
      
      setPositioning(newPositioning);
      console.log('✅ Positionnement sauvegardé');
    } catch (error) {
      console.error('❌ Erreur sauvegarde positionnement:', error);
    }
  };

  const applyPreset = async (presetName: string) => {
    const presetPositioning = presets[presetName];
    if (presetPositioning) {
      await saveCustomPositioning(presetPositioning);
    }
  };

  return {
    positioning,
    productType,
    description,
    presets,
    loading,
    saveCustomPositioning,
    applyPreset
  };
};
```

### Composant de positionnement
```tsx
// AdaptiveDesignPositioner.tsx
import React from 'react';
import { useAdaptivePositioning } from './useAdaptivePositioning';

interface Props {
  productId: number;
  designUrl: string;
  onPositionChange?: (position: any) => void;
}

export const AdaptiveDesignPositioner: React.FC<Props> = ({
  productId,
  designUrl,
  onPositionChange
}) => {
  const {
    positioning,
    productType,
    description,
    presets,
    loading,
    saveCustomPositioning,
    applyPreset
  } = useAdaptivePositioning(productId, designUrl);

  const handlePositionChange = (newPosition: any) => {
    saveCustomPositioning(newPosition);
    onPositionChange?.(newPosition);
  };

  if (loading) {
    return (
      <div className="adaptive-positioner-loading">
        <div className="spinner"></div>
        <p>Calcul du positionnement optimal...</p>
      </div>
    );
  }

  return (
    <div className="adaptive-design-positioner">
      {/* Indicateur de type de produit */}
      <div className="product-type-header">
        <span className="product-type-badge">
          🎯 {productType.toUpperCase()}
        </span>
        <span className="product-description">
          {description}
        </span>
      </div>

      {/* Presets rapides */}
      <div className="positioning-presets">
        <h4>Positions prédéfinies :</h4>
        <div className="preset-buttons">
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              className="preset-btn"
              onClick={() => applyPreset(name)}
              title={`Appliquer la position "${name}"`}
            >
              {name === 'center' ? '🎯 Centre' :
               name === 'chest' ? '👕 Poitrine' :
               name === 'small' ? '🔸 Petit' :
               name === 'large' ? '🔶 Grand' :
               name}
            </button>
          ))}
        </div>
      </div>

      {/* Contrôles de positionnement fins */}
      <div className="position-controls">
        <h4>Ajustement fin :</h4>
        
        <div className="control-group">
          <label>Position X: {positioning?.x}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={positioning?.x || 50}
            onChange={(e) => handlePositionChange({
              ...positioning,
              x: Number(e.target.value)
            })}
          />
        </div>

        <div className="control-group">
          <label>Position Y: {positioning?.y}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={positioning?.y || 50}
            onChange={(e) => handlePositionChange({
              ...positioning,
              y: Number(e.target.value)
            })}
          />
        </div>

        <div className="control-group">
          <label>Largeur: {positioning?.width}%</label>
          <input
            type="range"
            min="5"
            max="80"
            value={positioning?.width || 30}
            onChange={(e) => handlePositionChange({
              ...positioning,
              width: Number(e.target.value)
            })}
          />
        </div>

        <div className="control-group">
          <label>Hauteur: {positioning?.height}%</label>
          <input
            type="range"
            min="5"
            max="80"
            value={positioning?.height || 30}
            onChange={(e) => handlePositionChange({
              ...positioning,
              height: Number(e.target.value)
            })}
          />
        </div>
      </div>

      {/* Aperçu en temps réel */}
      <div className="position-preview">
        <div className="product-mockup">
          <div 
            className="design-overlay"
            style={{
              left: `${positioning?.x}%`,
              top: `${positioning?.y}%`,
              width: `${positioning?.width}%`,
              height: `${positioning?.height}%`,
              transform: `translate(-50%, -50%) rotate(${positioning?.rotation || 0}deg)`,
              border: '2px dashed #007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              position: 'absolute'
            }}
          >
            <span className="design-label">Design</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### CSS de base
```css
/* AdaptiveDesignPositioner.css */
.adaptive-design-positioner {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.product-type-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.product-type-badge {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.product-description {
  color: #666;
  font-style: italic;
}

.positioning-presets {
  margin-bottom: 20px;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.control-group input[type="range"] {
  width: 100%;
}

.position-preview {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  padding: 20px;
}

.product-mockup {
  width: 200px;
  height: 200px;
  background: #f0f0f0;
  position: relative;
  margin: 0 auto;
  border-radius: 4px;
}

.design-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #007bff;
  font-weight: bold;
}

.adaptive-positioner-loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## 🚀 Utilisation dans votre app

```tsx
// Dans votre composant de création de produit
import { AdaptiveDesignPositioner } from './AdaptiveDesignPositioner';

const CreateProductPage = () => {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [designUrl, setDesignUrl] = useState('');

  return (
    <div>
      {/* Vos autres composants */}
      
      {selectedProductId && designUrl && (
        <AdaptiveDesignPositioner
          productId={selectedProductId}
          designUrl={designUrl}
          onPositionChange={(position) => {
            console.log('Nouvelle position:', position);
            // Mettre à jour votre état local si nécessaire
          }}
        />
      )}
    </div>
  );
};
```

## ✨ Avantages immédiats

1. **🎯 Positionnement intelligent** : Chaque produit a sa position optimale
2. **⚡ Presets rapides** : Boutons pour positions courantes
3. **🎨 Personnalisation** : Ajustements fins possibles
4. **💾 Sauvegarde automatique** : Positions mémorisées par produit
5. **📱 Responsive** : Interface adaptée mobile/desktop

---

**Prêt à utiliser dès maintenant !** 🚀 
 
 
 
 