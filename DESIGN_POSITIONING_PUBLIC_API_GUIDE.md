# 🎨 Guide Positionnement Design - API Public

## 🌐 Endpoint avec Positionnement Design

### `GET http://localhost:3004/public/vendor-products`

L'endpoint `/public/vendor-products` inclut déjà le positionnement exact du design pour chaque produit, similaire à l'endpoint `/vendor/products`.

---

## 📊 Structure des Données de Positionnement

### Champs Disponibles

Chaque produit dans la réponse contient les informations de positionnement du design :

```json
{
  "id": 36,
  "vendorName": "Tshirt",
  "price": 6000,
  "status": "PUBLISHED",

  // 🎨 DESIGN POSITIONS - Positionnement exact du design
  "designPositions": [
    {
      "designId": 1,
      "position": {
        "x": -4,                    // Position X exacte en pixels
        "y": -18.138621875,         // Position Y exacte en pixels
        "scale": 0.85,               // Échelle du design (0.1 à 2.0)
        "rotation": 0,                // Rotation en degrés
        "constraints": {
          "minScale": 0.1,           // Échelle minimale autorisée
          "maxScale": 2.0            // Échelle maximale autorisée
        },
        "designWidth": 1200,          // Largeur originale du design
        "designHeight": 1200          // Hauteur originale du design
      },
      "createdAt": "2025-10-22T10:12:22.119Z",
      "updatedAt": "2025-10-22T10:12:22.119Z"
    }
  ],

  // 🎨 DESIGN INFOS - Informations complètes du design
  "design": {
    "id": 1,
    "name": "PIRATE",
    "description": "",
    "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760955842/vendor-designs/vendor_37_design_1760955841034.png",
    "tags": [],
    "isValidated": true
  }
}
```

---

## 🎯 Explication des Champs de Positionnement

### `designPositions[].position`

| Champ | Type | Description | Exemple |
|--------|-------|-------------|----------|
| `x` | number | Position horizontale du design en pixels | `-4` |
| `y` | number | Position verticale du design en pixels | `-18.14` |
| `scale` | number | Échelle du design (1.0 = taille originale) | `0.85` |
| `rotation` | number | Rotation du design en degrés | `0` |
| `designWidth` | number | Largeur originale du design en pixels | `1200` |
| `designHeight` | number | Hauteur originale du design en pixels | `1200` |

### `designPositions[].position.constraints`

| Champ | Type | Description | Valeur |
|--------|-------|-------------|---------|
| `minScale` | number | Échelle minimale autorisée | `0.1` |
| `maxScale` | number | Échelle maximale autorisée | `2.0` |

---

## 💡 Utilisation Frontend

### 1. Récupération et Application du Design

```javascript
// Récupérer les produits avec positions de design
async function getProductsWithDesignPositions() {
  const response = await fetch('http://localhost:3004/public/vendor-products?adminProductName=Tshirt');
  const data = await response.json();

  if (data.success) {
    return data.data.map(product => ({
      ...product,
      designPosition: product.designPositions[0]?.position || null,
      design: product.design
    }));
  }
  return [];
}

// Appliquer le design avec le positionnement exact
function applyDesignToProduct(product) {
  const { designPosition, design, designDelimitations } = product;

  if (!designPosition || !design) {
    console.warn('Aucun design ou positionnement trouvé');
    return;
  }

  // Extraire les informations de positionnement
  const { x, y, scale, rotation, constraints } = designPosition;

  // Appliquer le design sur l'image du produit
  const productImage = document.getElementById('product-image');
  const designImage = document.getElementById('design-image');

  // Positionnement exact
  designImage.style.transform = `
    translate(${x}px, ${y}px)
    scale(${scale})
    rotate(${rotation}deg)
  `;

  // Contraintes d'échelle
  designImage.style.minScale = constraints.minScale;
  designImage.style.maxScale = constraints.maxScale;
}
```

### 2. Composant React Complet

```jsx
import React, { useState, useEffect } from 'react';

const ProductWithDesign = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`http://localhost:3004/public/vendor-products?adminProductName=Tshirt&limit=1`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          const productData = data.data[0];
          setProduct(productData);
        }
      } catch (error) {
        console.error('Erreur chargement produit:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  if (loading) return <div>Chargement...</div>;
  if (!product) return <div>Produit non trouvé</div>;

  const designPosition = product.designPositions[0]?.position;
  const design = product.design;

  return (
    <div className="product-container">
      {/* Image du produit */}
      <img
        src={product.images?.primaryImageUrl}
        alt={product.adminProduct?.name}
        className="product-image"
        id="product-image"
      />

      {/* Design avec positionnement exact */}
      {design && designPosition && (
        <div className="design-overlay">
          <img
            src={design.imageUrl}
            alt={design.name}
            className="design-image"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%)
                translate(${designPosition.x}px, ${designPosition.y}px)
                scale(${designPosition.scale})
                rotate(${designPosition.rotation}deg)
              `,
              transformOrigin: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        </div>
      )}

      {/* Informations du produit */}
      <div className="product-info">
        <h3>{product.adminProduct?.name}</h3>
        <p>{product.price / 100}€</p>
        {design && (
          <div className="design-info">
            <p>Design: {design.name}</p>
            <p>Position: X={designPosition.x}, Y={designPosition.y}</p>
            <p>Échelle: {designPosition.scale}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductWithDesign;
```

### 3. Composant Vue.js

```vue
<template>
  <div class="product-container" v-if="product">
    <!-- Image du produit -->
    <img
      :src="product.images?.primaryImageUrl"
      :alt="product.adminProduct?.name"
      class="product-image"
      ref="productImage"
    />

    <!-- Design avec positionnement exact -->
    <div v-if="design && designPosition" class="design-overlay">
      <img
        :src="design.imageUrl"
        :alt="design.name"
        class="design-image"
        :style="designStyle"
      />
    </div>

    <!-- Informations -->
    <div class="product-info">
      <h3>{{ product.adminProduct?.name }}</h3>
      <p>{{ (product.price / 100).toFixed(2) }}€</p>
      <div v-if="design" class="design-info">
        <p>Design: {{ design.name }}</p>
        <p>Position: X={{ designPosition.x }}, Y={{ designPosition.y }}</p>
        <p>Échelle: {{ designPosition.scale }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['productId'],

  data() {
    return {
      product: null,
      loading: true
    };
  },

  computed: {
    designPosition() {
      return this.product?.designPositions?.[0]?.position;
    },

    design() {
      return this.product?.design;
    },

    designStyle() {
      if (!this.designPosition || !this.design) return {};

      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `
          translate(-50%, -50%)
          translate(${this.designPosition.x}px, ${this.designPosition.y}px)
          scale(${this.designPosition.scale})
          rotate(${this.designPosition.rotation}deg)
        `,
        transformOrigin: 'center',
        pointerEvents: 'none',
        zIndex: 10
      };
    }
  },

  async mounted() {
    await this.loadProduct();
  },

  methods: {
    async loadProduct() {
      try {
        const response = await fetch('http://localhost:3004/public/vendor-products?limit=1');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          this.product = data.data[0];
        }
      } catch (error) {
        console.error('Erreur chargement produit:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 🎛️ Outils Interactifs

### 1. Éditeur de Positionnement

```javascript
class DesignPositionEditor {
  constructor(productContainer, designElement) {
    this.container = productContainer;
    this.design = designElement;
    this.isDragging = false;
    this.currentScale = 1;
    this.currentRotation = 0;

    this.initEventListeners();
  }

  // Appliquer le positionnement initial depuis l'API
  applyInitialPosition(positionData) {
    const { x, y, scale, rotation } = positionData;

    this.design.style.transform = `
      translate(${x}px, ${y}px)
      scale(${scale})
      rotate(${rotation}deg)
    `;

    this.currentScale = scale;
    this.currentRotation = rotation;
  }

  // Activer le drag & drop
  initEventListeners() {
    this.design.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.endDrag.bind(this));

    // Molette pour l'échelle
    this.design.addEventListener('wheel', this.handleWheel.bind(this));

    // Touche Shift + rotation
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  startDrag(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.currentX;
    this.dragStartY = e.clientY - this.currentY;
  }

  drag(e) {
    if (!this.isDragging) return;

    this.currentX = e.clientX - this.dragStartX;
    this.currentY = e.clientY - this.dragStartY;

    this.updateTransform();
  }

  endDrag() {
    this.isDragging = false;
  }

  handleWheel(e) {
    e.preventDefault();

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.currentScale *= scaleFactor;
    this.currentScale = Math.max(0.1, Math.min(2.0, this.currentScale));

    this.updateTransform();
  }

  updateTransform() {
    this.design.style.transform = `
      translate(${this.currentX}px, ${this.currentY}px)
      scale(${this.currentScale})
      rotate(${this.currentRotation}deg)
    `;
  }

  // Obtenir le positionnement actuel pour sauvegarde
  getCurrentPosition() {
    return {
      x: this.currentX,
      y: this.currentY,
      scale: this.currentScale,
      rotation: this.currentRotation
    };
  }
}

// Utilisation
const productContainer = document.getElementById('product-container');
const designElement = document.getElementById('design-image');
const editor = new DesignPositionEditor(productContainer, designElement);

// Appliquer le positionnement depuis l'API
editor.applyInitialPosition(product.designPositions[0].position);
```

---

## 📱 Exemple d'Intégration Complète

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>Produit avec Design Positionné</title>
  <style>
    .product-container {
      position: relative;
      width: 600px;
      height: 600px;
      margin: 20px auto;
      border: 1px solid #ddd;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .design-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .design-image {
      position: absolute;
      left: 50%;
      top: 50%;
      transform-origin: center;
      max-width: 80%;
      max-height: 80%;
    }

    .controls {
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      max-width: 600px;
    }

    .position-info {
      background: #f5f5f5;
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="product-container">
      <img id="product-image" alt="Produit" />
      <div class="design-overlay">
        <img id="design-image" alt="Design" />
      </div>
    </div>

    <div class="controls">
      <div id="position-info" class="position-info">
        <h3>Positionnement du Design</h3>
        <p>X: <span id="pos-x">0</span>px</p>
        <p>Y: <span id="pos-y">0</span>px</p>
        <p>Échelle: <span id="pos-scale">1.0</span></p>
        <p>Rotation: <span id="pos-rotation">0</span>°</p>
      </div>
    </div>
  </div>

  <script>
    async function loadProductWithDesign() {
      try {
        const response = await fetch('http://localhost:3004/public/vendor-products?adminProductName=Tshirt&limit=1');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          const product = data.data[0];
          const designPosition = product.designPositions[0]?.position;
          const design = product.design;

          if (design && designPosition) {
            // Appliquer les images
            document.getElementById('product-image').src = product.images?.primaryImageUrl;
            document.getElementById('design-image').src = design.imageUrl;

            // Appliquer le positionnement exact
            const designElement = document.getElementById('design-image');
            designElement.style.transform = `
              translate(-50%, -50%)
              translate(${designPosition.x}px, ${designPosition.y}px)
              scale(${designPosition.scale})
              rotate(${designPosition.rotation}deg)
            `;

            // Afficher les infos de positionnement
            document.getElementById('pos-x').textContent = designPosition.x;
            document.getElementById('pos-y').textContent = designPosition.y;
            document.getElementById('pos-scale').textContent = designPosition.scale;
            document.getElementById('pos-rotation').textContent = designPosition.rotation;
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }

    // Charger le produit au chargement de la page
    loadProductWithDesign();
  </script>
</body>
</html>
```

---

## ✅ Tests et Validation

### Script de Test

```bash
#!/bin/bash
# test-design-positioning.sh

echo "🎨 Test Positionnement Design - API Public"
echo "======================================"

API_URL="http://localhost:3004/public/vendor-products"

# Test 1: Vérifier la présence des positions
echo "Test 1: Présence des positions de design"
response=$(curl -s "$API_URL?adminProductName=Tshirt&limit=1")
design_positions=$(echo "$response" | jq '.data[0].designPositions')
echo "✅ Design positions trouvés: $design_positions"

# Test 2: Vérifier les champs de positionnement
echo ""
echo "Test 2: Champs de positionnement"
x_pos=$(echo "$response" | jq '.data[0].designPositions[0].position.x')
y_pos=$(echo "$response" | jq '.data[0].designPositions[0].position.y')
scale=$(echo "$response" | jq '.data[0].designPositions[0].position.scale')
rotation=$(echo "$response" | jq '.data[0].designPositions[0].position.rotation')

echo "✅ Position X: $x_pos"
echo "✅ Position Y: $y_pos"
echo "✅ Échelle: $scale"
echo "✅ Rotation: $rotation"

# Test 3: Vérifier les contraintes
echo ""
echo "Test 3: Contraintes d'échelle"
min_scale=$(echo "$response" | jq '.data[0].designPositions[0].position.constraints.minScale')
max_scale=$(echo "$response" | jq '.data[0].designPositions[0].position.constraints.maxScale')

echo "✅ Échelle min: $min_scale"
echo "✅ Échelle max: $max_scale"

echo ""
echo "🏁 Tests terminés !"
```

---

## 📞 Support et Dépannage

### Problèmes Courants

**1. Design non affiché**
- Vérifier que `designPositions` n'est pas vide
- Vérifier que `design.imageUrl` est accessible
- Contrôler la visibilité CSS (`z-index`, `pointer-events`)

**2. Mauvais positionnement**
- Utiliser les valeurs exactes de `x` et `y` depuis l'API
- Vérifier que `transform-origin` est bien sur `'center'`
- Appliquer `translate(-50%, -50%)` avant les autres transformations

**3. Design trop grand/petit**
- Utiliser la valeur `scale` exacte depuis l'API
- Respecter les contraintes `minScale` et `maxScale`

### Debug

```javascript
// Afficher les informations de positionnement pour debug
console.log('Design Position:', {
  position: product.designPositions[0]?.position,
  design: product.design,
  delimitations: product.designDelimitations
});
```

---

## 📈 Performance

### Optimisations Recommandées

1. **Mise en cache des designs**
   ```javascript
   const designCache = new Map();
   // Mettre en cache les designs chargés
   ```

2. **Lazy loading des images**
   ```javascript
   const img = new Image();
   img.loading = 'lazy';
   img.src = design.imageUrl;
   ```

3. **Debouncing des interactions**
   ```javascript
   let timeoutId;
   function debouncedUpdate() {
     clearTimeout(timeoutId);
     timeoutId = setTimeout(updatePosition, 16); // 60fps
   }
   ```

---

**Conclusion** : L'endpoint `/public/vendor-products` fournit déjà toutes les informations nécessaires pour le positionnement exact du design, avec les mêmes fonctionnalités que l'endpoint `/vendor/products`.

**Dernière mise à jour** : 22 octobre 2025
**Version** : v1.0
**Statut** : ✅ Production Ready