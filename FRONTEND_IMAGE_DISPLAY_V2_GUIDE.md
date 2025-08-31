# 🖼️ GUIDE AFFICHAGE IMAGES - ARCHITECTURE V2

## 🎯 Problématique

En Architecture v2, le frontend doit afficher :
- ✅ **Images admin originales** (depuis les URLs Cloudinary)
- ✅ **Design superposé** (depuis base64 stocké)
- ✅ **Rendu final en temps réel** (côté client)

---

## 🔄 STRATÉGIES D'AFFICHAGE

### Option 1 : Affichage Simple (Images Admin Seules)
**Usage** : Listes de produits, aperçus rapides

```javascript
function displayAdminImageOnly(product) {
  const primaryImage = product.images.primaryImageUrl;
  
  return `
    <div class="product-card">
      <img src="${primaryImage}" alt="${product.vendorName}" class="product-image" />
      <div class="product-info">
        <h3>${product.vendorName}</h3>
        <p>${product.price.toLocaleString()} FCFA</p>
        ${product.designApplication.hasDesign ? 
          '<span class="design-badge">🎨 Avec design</span>' : ''
        }
      </div>
    </div>
  `;
}
```

### Option 2 : Rendu Canvas (Design Superposé)
**Usage** : Page produit, aperçu détaillé

```javascript
async function renderProductWithDesign(product, targetContainer) {
  const { adminProduct, designApplication } = product.data;
  
  // Conteneur pour toutes les variations
  const container = document.querySelector(targetContainer);
  container.innerHTML = '';
  
  for (const colorVar of adminProduct.colorVariations) {
    const colorSection = document.createElement('div');
    colorSection.className = 'color-variation';
    colorSection.innerHTML = `<h4>Couleur: ${colorVar.name}</h4>`;
    
    for (const adminImage of colorVar.images) {
      const canvas = await createProductCanvas(adminImage, designApplication);
      colorSection.appendChild(canvas);
    }
    
    container.appendChild(colorSection);
  }
}

async function createProductCanvas(adminImage, designApplication) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.className = 'product-canvas';
    
    // Charger l'image admin
    const adminImg = new Image();
    adminImg.crossOrigin = 'anonymous';
    
    adminImg.onload = () => {
      canvas.width = adminImg.width;
      canvas.height = adminImg.height;
      
      // Dessiner l'image admin
      ctx.drawImage(adminImg, 0, 0);
      
      // Si design disponible, le superposer
      if (designApplication?.designBase64) {
        const designImg = new Image();
        designImg.onload = () => {
          // Appliquer le design sur chaque délimitation
          adminImage.delimitations.forEach(delim => {
            const centerX = delim.x + (delim.width / 2);
            const centerY = delim.y + (delim.height / 2);
            
            const designWidth = delim.width * designApplication.scale;
            const designHeight = delim.height * designApplication.scale;
            
            const designX = centerX - (designWidth / 2);
            const designY = centerY - (designHeight / 2);
            
            ctx.drawImage(designImg, designX, designY, designWidth, designHeight);
          });
          
          resolve(canvas);
        };
        
        designImg.src = designApplication.designBase64;
      } else {
        // Pas de design, retourner l'image admin seule
        resolve(canvas);
      }
    };
    
    adminImg.src = adminImage.url;
  });
}
```

### Option 3 : Overlay CSS (Performance Optimisée)
**Usage** : Grilles de produits, performance critique

```javascript
function createCSSOverlay(product) {
  const primaryImage = product.images.primaryImageUrl;
  const hasDesign = product.designApplication.hasDesign;
  
  return `
    <div class="product-overlay-container" data-product-id="${product.id}">
      <img src="${primaryImage}" alt="${product.vendorName}" class="base-image" />
      
      ${hasDesign ? `
        <div class="design-overlay">
          <img src="${getDesignThumbnail(product)}" class="design-preview" />
          <div class="design-indicator">🎨</div>
        </div>
      ` : ''}
      
      <div class="product-info-overlay">
        <h3>${product.vendorName}</h3>
        <p>${product.price.toLocaleString()} FCFA</p>
      </div>
    </div>
  `;
}

// CSS associé
const overlayCSS = `
.product-overlay-container {
  position: relative;
  display: inline-block;
}

.base-image {
  width: 100%;
  height: auto;
  display: block;
}

.design-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.design-preview {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.design-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 12px;
}
`;
```

---

## 🛠️ FONCTIONS UTILITAIRES

### Génération de miniature design

```javascript
function getDesignThumbnail(product, size = 100) {
  if (!product.designApplication?.designBase64) return null;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  const img = new Image();
  img.onload = () => {
    // Calculer les dimensions pour garder les proportions
    const scale = Math.min(size / img.width, size / img.height);
    const width = img.width * scale;
    const height = img.height * scale;
    const x = (size - width) / 2;
    const y = (size - height) / 2;
    
    ctx.drawImage(img, x, y, width, height);
  };
  
  img.src = product.designApplication.designBase64;
  return canvas.toDataURL();
}
```

### Cache d'images pour performance

```javascript
class ImageCache {
  constructor() {
    this.cache = new Map();
  }
  
  async getRenderedImage(productId, imageUrl, designBase64) {
    const cacheKey = `${productId}_${this.hashString(imageUrl + designBase64)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const renderedCanvas = await this.renderImage(imageUrl, designBase64);
    const dataUrl = renderedCanvas.toDataURL();
    
    this.cache.set(cacheKey, dataUrl);
    return dataUrl;
  }
  
  async renderImage(imageUrl, designBase64) {
    // Logique de rendu canvas ici
    // Retourner le canvas rendu
  }
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

// Instance globale
const imageCache = new ImageCache();
```

---

## 📱 EXEMPLES D'INTÉGRATION COMPLÈTE

### 1. Liste de produits (Performance)

```javascript
async function displayProductList(products) {
  const container = document.getElementById('products-list');
  
  const productsHTML = products.map(product => `
    <div class="product-card" onclick="viewProduct(${product.id})">
      <div class="image-container">
        <img src="${product.images.primaryImageUrl}" 
             alt="${product.vendorName}" 
             class="product-image"
             loading="lazy" />
        
        ${product.designApplication.hasDesign ? `
          <div class="design-badge">
            <span>🎨 Design personnalisé</span>
          </div>
        ` : ''}
      </div>
      
      <div class="product-info">
        <h3>${product.vendorName}</h3>
        <p class="original-name">${product.originalAdminName}</p>
        <div class="price">${product.price.toLocaleString()} FCFA</div>
        
        <div class="colors">
          ${product.selectedColors.map(color => `
            <span class="color-dot" style="background-color: ${color.colorCode}" 
                  title="${color.name}"></span>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = productsHTML;
}
```

### 2. Page détail produit (Rendu complet)

```javascript
async function displayProductDetail(productId) {
  try {
    // Récupérer les détails complets
    const response = await fetch(`/api/vendor/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    const product = result.data;
    
    // Container principal
    const container = document.getElementById('product-detail');
    container.innerHTML = `
      <div class="product-detail-layout">
        <div class="images-section">
          <div id="color-tabs"></div>
          <div id="image-viewer"></div>
        </div>
        
        <div class="info-section">
          <h1>${product.vendorName}</h1>
          <p class="description">${product.vendorDescription}</p>
          <div class="price">${product.vendorPrice.toLocaleString()} FCFA</div>
          
          <div class="admin-info">
            <h3>Produit de base : ${product.adminProduct.name}</h3>
            <p>${product.adminProduct.description}</p>
            <p>Prix de base : ${product.adminProduct.price.toLocaleString()} FCFA</p>
          </div>
          
          <div class="selections">
            <div class="sizes">
              <h4>Tailles disponibles :</h4>
              ${product.selectedSizes.map(size => `
                <span class="size-tag">${size.sizeName}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Créer les onglets de couleurs
    await createColorTabs(product);
    
  } catch (error) {
    console.error('Erreur chargement détail produit:', error);
  }
}

async function createColorTabs(product) {
  const tabsContainer = document.getElementById('color-tabs');
  const viewerContainer = document.getElementById('image-viewer');
  
  // Créer les onglets
  const tabs = product.adminProduct.colorVariations.map((colorVar, index) => `
    <button class="color-tab ${index === 0 ? 'active' : ''}" 
            data-color-id="${colorVar.id}"
            onclick="switchColor(${colorVar.id}, '${product.id}')">
      <span class="color-dot" style="background-color: ${colorVar.colorCode}"></span>
      ${colorVar.name}
    </button>
  `).join('');
  
  tabsContainer.innerHTML = tabs;
  
  // Afficher la première couleur par défaut
  await switchColor(product.adminProduct.colorVariations[0].id, product.id);
}

async function switchColor(colorId, productId) {
  // Mise à jour des onglets actifs
  document.querySelectorAll('.color-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.colorId == colorId);
  });
  
  // Récupérer les données du produit
  const response = await fetch(`/api/vendor/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  const product = result.data;
  
  // Trouver la variation de couleur
  const colorVar = product.adminProduct.colorVariations.find(cv => cv.id == colorId);
  
  if (!colorVar) return;
  
  // Container pour les images
  const viewerContainer = document.getElementById('image-viewer');
  viewerContainer.innerHTML = '<div class="loading">Génération des images...</div>';
  
  // Générer les images avec design
  const imagesHTML = await Promise.all(
    colorVar.images.map(async (adminImage, index) => {
      const canvas = await createProductCanvas(adminImage, product.designApplication);
      
      return `
        <div class="image-view ${index === 0 ? 'active' : ''}">
          <div class="view-label">${adminImage.viewType}</div>
          ${canvas.outerHTML}
        </div>
      `;
    })
  );
  
  viewerContainer.innerHTML = `
    <div class="image-gallery">
      ${imagesHTML.join('')}
    </div>
    
    <div class="image-controls">
      <button onclick="downloadProductImage()">📥 Télécharger</button>
      <button onclick="shareProduct()">🔗 Partager</button>
    </div>
  `;
}
```

### 3. Prévisualisation temps réel (Création produit)

```javascript
class ProductPreview {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.adminProduct = null;
    this.designBase64 = null;
    this.scale = 0.6;
  }
  
  setAdminProduct(adminProduct) {
    this.adminProduct = adminProduct;
    this.render();
  }
  
  setDesign(designBase64) {
    this.designBase64 = designBase64;
    this.render();
  }
  
  setScale(scale) {
    this.scale = scale;
    this.render();
  }
  
  async render() {
    if (!this.adminProduct) {
      this.container.innerHTML = '<p>Sélectionnez un produit de base</p>';
      return;
    }
    
    this.container.innerHTML = '<div class="generating">Génération preview...</div>';
    
    const previewHTML = await Promise.all(
      this.adminProduct.images.colorVariations.map(async (colorVar) => {
        const colorSection = document.createElement('div');
        colorSection.className = 'color-preview';
        colorSection.innerHTML = `<h4>${colorVar.name}</h4>`;
        
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'images-preview';
        
        for (const adminImage of colorVar.images) {
          const canvas = await this.createPreviewCanvas(adminImage);
          imagesContainer.appendChild(canvas);
        }
        
        colorSection.appendChild(imagesContainer);
        return colorSection.outerHTML;
      })
    );
    
    this.container.innerHTML = previewHTML.join('');
  }
  
  async createPreviewCanvas(adminImage) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.className = 'preview-canvas';
    
    return new Promise((resolve) => {
      const adminImg = new Image();
      adminImg.crossOrigin = 'anonymous';
      
      adminImg.onload = () => {
        // Taille réduite pour preview
        const scale = 0.5;
        canvas.width = adminImg.width * scale;
        canvas.height = adminImg.height * scale;
        
        ctx.drawImage(adminImg, 0, 0, canvas.width, canvas.height);
        
        // Appliquer le design si disponible
        if (this.designBase64) {
          const designImg = new Image();
          designImg.onload = () => {
            adminImage.delimitations.forEach(delim => {
              const centerX = (delim.x + delim.width / 2) * scale;
              const centerY = (delim.y + delim.height / 2) * scale;
              
              const designWidth = delim.width * this.scale * scale;
              const designHeight = delim.height * this.scale * scale;
              
              const designX = centerX - designWidth / 2;
              const designY = centerY - designHeight / 2;
              
              ctx.drawImage(designImg, designX, designY, designWidth, designHeight);
            });
            
            resolve(canvas);
          };
          
          designImg.src = this.designBase64;
        } else {
          resolve(canvas);
        }
      };
      
      adminImg.src = adminImage.url;
    });
  }
}

// Usage
const preview = new ProductPreview('product-preview');

// Lors de la sélection d'un produit admin
preview.setAdminProduct(selectedAdminProduct);

// Lors de l'upload d'un design
preview.setDesign(uploadedDesignBase64);

// Lors du changement d'échelle
preview.setScale(newScale);
```

---

## 🎨 CSS POUR L'AFFICHAGE

```css
/* Cartes produits */
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.design-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* Détail produit */
.product-detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.color-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 8px;
}

.color-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #ddd;
}

/* Canvas images */
.product-canvas, .preview-canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  margin: 8px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.view-label {
  text-align: center;
  font-weight: bold;
  margin-bottom: 8px;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* Loading states */
.loading, .generating {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
  }
  
  .image-gallery {
    grid-template-columns: 1fr;
  }
}
```

---

## ⚡ OPTIMISATIONS PERFORMANCE

### Lazy Loading des images

```javascript
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}
```

### Web Workers pour le rendu

```javascript
// worker.js
self.onmessage = function(e) {
  const { imageData, designData, delimitations, scale } = e.data;
  
  // Traitement lourd du rendu ici
  const canvas = new OffscreenCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Logique de rendu...
  
  const renderedImageData = canvas.transferToImageBitmap();
  self.postMessage({ renderedImageData });
};

// Usage principal
const worker = new Worker('worker.js');
worker.postMessage({ imageData, designData, delimitations, scale });
worker.onmessage = function(e) {
  const { renderedImageData } = e.data;
  // Afficher l'image rendue
};
```

---

## 🚀 RÉSUMÉ DES SOLUTIONS

### Pour les listes de produits :
1. **Affichage image admin seule** + badge design
2. **Lazy loading** pour la performance
3. **CSS overlay** pour les indicateurs

### Pour les détails produits :
1. **Rendu Canvas** avec design superposé
2. **Onglets de couleurs** dynamiques
3. **Cache d'images** pour éviter les recalculs

### Pour la création produit :
1. **Preview temps réel** avec classe dédiée
2. **Contrôle d'échelle** interactif
3. **Génération instantanée** à chaque modification

Cette approche vous donne une solution complète et performante pour afficher les images en Architecture v2 ! 🎯 