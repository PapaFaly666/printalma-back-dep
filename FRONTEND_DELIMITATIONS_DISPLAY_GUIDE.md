# 🔲 Guide Front-End – Affichage des Délimitations + Design (Architecture v2)

Ce guide explique comment afficher **les délimitations** (zones imprimables) ET **le design** sur l'image produit en utilisant les données complètes de :

```
GET /vendor/products/:id
```

---

## 1. Données disponibles dans la réponse API

```jsonc
{
  "data": {
    "adminProduct": {
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#e5e6e1",
          "images": [
            {
              "id": 1,
              "url": "https://res.cloudinary.com/.../T-Shirt_Premium_Blanc.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"  // ← Important !
                }
              ]
            }
          ]
        }
      ]
    },
    "designApplication": {
      "designUrl": "https://res.cloudinary.com/.../design.png"
    },
    "designPositions": [
      {
        "position": {
          "x": 70,
          "y": -52,
          "scale": 0.5083333333333333,
          "rotation": 0
        }
      }
    ]
  }
}
```

---

## 2. Composant React complet avec délimitations

```tsx
import React, { useState, useRef, useEffect } from 'react';

interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXELS';
}

interface ProductViewerProps {
  productData: any; // Données de l'API
  selectedColorIndex?: number;
}

const ProductViewer: React.FC<ProductViewerProps> = ({ 
  productData, 
  selectedColorIndex = 0 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // 1. Récupérer les données de la couleur sélectionnée
  const selectedColor = productData.adminProduct.colorVariations[selectedColorIndex];
  const productImage = selectedColor.images[0];
  const delimitations = productImage.delimitations || [];

  // 2. Récupérer les données du design
  const designUrl = productData.designApplication.designUrl;
  const designPosition = productData.designPositions[0]?.position || {
    x: 0, y: 0, scale: 0.6, rotation: 0
  };

  // 3. Calculer les dimensions réelles de l'image affichée
  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const rect = imageRef.current.getBoundingClientRect();
      setImageDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  }, [imageLoaded, selectedColorIndex]);

  // 4. Convertir les délimitations en pixels si nécessaire
  const getDelimitationStyle = (delimitation: DelimitationData) => {
    if (delimitation.coordinateType === 'PERCENTAGE') {
      // Convertir les pourcentages en pixels basés sur l'image affichée
      return {
        left: `${delimitation.x}%`,
        top: `${delimitation.y}%`,
        width: `${delimitation.width}%`,
        height: `${delimitation.height}%`,
      };
    } else {
      // Coordonnées déjà en pixels
      return {
        left: delimitation.x,
        top: delimitation.y,
        width: delimitation.width,
        height: delimitation.height,
      };
    }
  };

  return (
    <div className="product-viewer">
      {/* Sélecteur de couleur */}
      <div className="color-selector" style={{ marginBottom: '10px' }}>
        {productData.adminProduct.colorVariations.map((color: any, index: number) => (
          <button
            key={color.id}
            onClick={() => window.location.reload()} // Simplification pour l'exemple
            style={{
              backgroundColor: color.colorCode,
              width: '30px',
              height: '30px',
              margin: '0 5px',
              border: index === selectedColorIndex ? '3px solid #000' : '1px solid #ccc',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
            title={color.name}
          />
        ))}
      </div>

      {/* Container principal avec image + overlays */}
      <div 
        className="image-container" 
        style={{ 
          position: 'relative', 
          display: 'inline-block',
          maxWidth: '500px',
          width: '100%'
        }}
      >
        {/* Image produit de base */}
        <img
          ref={imageRef}
          src={productImage.url}
          alt={`${selectedColor.name} ${productData.vendorName}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Délimitations (zones imprimables) */}
        {delimitations.map((delimitation: DelimitationData, index: number) => (
          <div
            key={`delimitation-${index}`}
            className="delimitation-overlay"
            style={{
              position: 'absolute',
              border: '2px dashed #ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              pointerEvents: 'none',
              zIndex: 1,
              ...getDelimitationStyle(delimitation)
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                fontSize: '12px',
                color: '#ff6b6b',
                fontWeight: 'bold',
                backgroundColor: 'white',
                padding: '2px 5px',
                borderRadius: '3px'
              }}
            >
              Zone imprimable
            </div>
          </div>
        ))}

        {/* Design superposé */}
        {designUrl && (
          <img
            src={designUrl}
            alt="Design"
            className="design-overlay"
            style={{
              position: 'absolute',
              left: designPosition.x,
              top: designPosition.y,
              transform: `scale(${designPosition.scale}) rotate(${designPosition.rotation}deg)`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              zIndex: 2,
              maxWidth: 'none' // Important pour éviter les contraintes de taille
            }}
          />
        )}

        {/* Informations de debug (optionnel) */}
        <div
          className="debug-info"
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px',
            fontSize: '10px',
            borderRadius: '3px',
            zIndex: 3
          }}
        >
          <div>Couleur: {selectedColor.name}</div>
          <div>Design: {designPosition.x}, {designPosition.y}</div>
          <div>Échelle: {designPosition.scale.toFixed(2)}</div>
          <div>Délimitations: {delimitations.length}</div>
        </div>
      </div>

      {/* Informations produit */}
      <div className="product-info" style={{ marginTop: '15px' }}>
        <h3>{productData.vendorName}</h3>
        <p>{productData.vendorDescription}</p>
        <p><strong>Prix:</strong> {productData.vendorPrice / 100}€</p>
        <p><strong>Stock:</strong> {productData.vendorStock}</p>
        <p><strong>Statut:</strong> {productData.status}</p>
        
        {/* Tailles disponibles */}
        <div style={{ marginTop: '10px' }}>
          <strong>Tailles:</strong>
          {productData.selectedSizes.map((size: any) => (
            <span key={size.id} style={{ 
              margin: '0 5px', 
              padding: '2px 8px', 
              border: '1px solid #ccc',
              borderRadius: '3px',
              fontSize: '12px'
            }}>
              {size.sizeName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductViewer;
```

---

## 3. Utilisation avec les données API

```tsx
// Dans votre composant parent
import React, { useEffect, useState } from 'react';
import ProductViewer from './ProductViewer';

const ProductDetailPage = ({ productId }: { productId: number }) => {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/vendor/products/${productId}`, {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        setProductData(result.data);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Erreur chargement produit:', err);
      setLoading(false);
    });
  }, [productId]);

  if (loading) return <div>Chargement...</div>;
  if (!productData) return <div>Produit non trouvé</div>;

  return (
    <div>
      <ProductViewer productData={productData} />
    </div>
  );
};
```

---

## 4. Styles CSS recommandés

```css
.product-viewer {
  font-family: Arial, sans-serif;
}

.image-container {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.delimitation-overlay {
  transition: opacity 0.3s ease;
}

.delimitation-overlay:hover {
  opacity: 0.8;
}

.design-overlay {
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
}

.color-selector button:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

.debug-info {
  font-family: monospace;
}
```

---

## 5. Points clés à retenir

1. **Délimitations en pourcentage** : Les coordonnées sont relatives à l'image originale
2. **Design en pixels absolus** : Position fixe par rapport au coin supérieur gauche
3. **Z-index** : Délimitations (1) < Design (2) < Debug (3)
4. **Responsive** : L'image s'adapte mais les délimitations gardent leurs proportions
5. **Multi-couleurs** : Chaque couleur peut avoir ses propres délimitations

---

## 6. Fonctionnalités avancées (optionnelles)

```tsx
// Basculer l'affichage des délimitations
const [showDelimitations, setShowDelimitations] = useState(true);

// Zoom sur l'image
const [zoom, setZoom] = useState(1);

// Mode édition pour déplacer le design
const [editMode, setEditMode] = useState(false);
```

---

**Résultat** : Le frontend affiche maintenant l'image produit avec les zones imprimables (délimitations) en rouge pointillé ET le design superposé à sa position exacte, pour toutes les couleurs disponibles.

> Dernière mise à jour : 2025-07-10 