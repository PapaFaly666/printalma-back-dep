# 🎨 Guide Frontend - Affichage des Produits Wizard

## 📋 Problèmes corrigés

✅ **originalAdminName** ne sera plus null
✅ **Structure d'images** distingue wizard vs traditionnel
✅ **Logique d'affichage** adaptée selon le type de produit

## 🔧 Corrections Backend Appliquées

### 1. **originalAdminName corrigé**
Le champ `originalAdminName` est maintenant rempli automatiquement :
```typescript
// Dans vendor-wizard-product.service.ts
originalAdminName: baseProduct.name || `Produit base ${baseProductId}`,
```

### 2. **Structure d'images intelligente**
Nouvelles méthodes pour distinguer produits wizard vs traditionnel :
```typescript
// Méthodes ajoutées dans vendor-publish.service.ts
formatProductImages(product) // Formate selon le type
getPrimaryImageUrl(product)  // Image principale selon le type
```

## 🎯 Structure de Réponse API

### Produit Wizard (avec images propres)
```json
{
  "id": 138,
  "vendorName": "Mon T-shirt Personnalisé",
  "originalAdminName": "T-shirt Blanc Classique", // ✅ Plus jamais null
  "images": {
    "adminReferences": [
      {
        "colorName": null,
        "colorCode": null,
        "adminImageUrl": "https://res.cloudinary.com/.../wizard-base-xxx.jpg",
        "imageType": "base" // ✅ Image principale pour la card
      },
      {
        "colorName": null,
        "colorCode": null,
        "adminImageUrl": "https://res.cloudinary.com/.../wizard-detail-xxx-1.jpg",
        "imageType": "detail" // ✅ Images détail pour la page produit
      },
      {
        "colorName": null,
        "colorCode": null,
        "adminImageUrl": "https://res.cloudinary.com/.../wizard-detail-xxx-2.jpg",
        "imageType": "detail"
      }
    ],
    "total": 3,
    "primaryImageUrl": "https://res.cloudinary.com/.../wizard-base-xxx.jpg" // ✅ Image principale auto
  },
  "designId": null // ✅ Indique que c'est un produit wizard
}
```

### Produit Traditionnel (avec mockup)
```json
{
  "id": 124,
  "vendorName": "Polo Design Africain",
  "originalAdminName": "Polo",
  "images": {
    "adminReferences": [
      {
        "colorName": "Blanc",
        "colorCode": "#ffffff",
        "adminImageUrl": "https://res.cloudinary.com/.../polo-blanc.jpg",
        "imageType": "admin_reference"
      },
      {
        "colorName": "Rouge",
        "colorCode": "#f00a0a",
        "adminImageUrl": "https://res.cloudinary.com/.../polo-rouge.jpg",
        "imageType": "admin_reference"
      }
    ],
    "total": 2,
    "primaryImageUrl": "https://res.cloudinary.com/.../polo-blanc.jpg"
  },
  "designId": 32 // ✅ Indique que c'est un produit avec design
}
```

## 🎨 Guide d'Implémentation Frontend

### 1. **Composant ProductCard**

```tsx
interface ProductCardProps {
  product: VendorProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // ✅ Détecter le type de produit
  const isWizardProduct = product.designId === null;
  const isTraditionalProduct = product.designId !== null;

  // ✅ Obtenir l'image d'affichage pour la card
  const getCardImage = () => {
    if (isWizardProduct) {
      // Pour wizard: utiliser l'image base ou la première
      const baseImage = product.images.adminReferences.find(
        img => img.imageType === 'base'
      );
      return baseImage?.adminImageUrl || product.images.primaryImageUrl;
    } else {
      // Pour traditionnel: utiliser l'image du mockup
      return product.images.primaryImageUrl;
    }
  };

  // ✅ Obtenir le nom d'affichage
  const getDisplayName = () => {
    return product.vendorName || product.originalAdminName || 'Produit sans nom';
  };

  return (
    <div className="product-card">
      {/* ✅ Image principale selon le type */}
      <img
        src={getCardImage()}
        alt={getDisplayName()}
        className="product-card-image"
      />

      {/* ✅ Badge type de produit */}
      <div className="product-type-badge">
        {isWizardProduct ? '🎨 Personnalisé' : '🎯 Design'}
      </div>

      {/* ✅ Informations produit */}
      <div className="product-info">
        <h3>{getDisplayName()}</h3>
        <p className="price">{product.price} FCFA</p>

        {/* ✅ Statut */}
        <span className={`status ${product.status.toLowerCase()}`}>
          {product.status}
        </span>
      </div>
    </div>
  );
};
```

### 2. **Page Détails Produit**

```tsx
const ProductDetailPage: React.FC<{ productId: number }> = ({ productId }) => {
  const [product, setProduct] = useState<VendorProduct | null>(null);

  const isWizardProduct = product?.designId === null;

  // ✅ Obtenir toutes les images selon le type
  const getProductImages = () => {
    if (!product) return [];

    if (isWizardProduct) {
      // Pour wizard: afficher base + détails
      return product.images.adminReferences.map(img => ({
        url: img.adminImageUrl,
        type: img.imageType,
        isMain: img.imageType === 'base'
      }));
    } else {
      // Pour traditionnel: afficher mockups par couleur
      return product.images.adminReferences.map(img => ({
        url: img.adminImageUrl,
        type: 'mockup',
        colorName: img.colorName,
        colorCode: img.colorCode,
        isMain: false
      }));
    }
  };

  return (
    <div className="product-detail">
      {/* ✅ Galerie d'images adaptée */}
      <div className="product-gallery">
        {isWizardProduct ? (
          // Galerie wizard: image principale + détails
          <WizardProductGallery images={getProductImages()} />
        ) : (
          // Galerie traditionnelle: mockups par couleur
          <TraditionalProductGallery
            images={getProductImages()}
            selectedColors={product.selectedColors}
          />
        )}
      </div>

      {/* ✅ Informations produit */}
      <div className="product-info">
        <h1>{product.vendorName}</h1>
        <p className="original-name">
          Basé sur: {product.originalAdminName}
        </p>

        {/* ✅ Type de produit */}
        <div className="product-type">
          {isWizardProduct ? (
            <span className="wizard-badge">
              🎨 Produit avec images personnalisées
            </span>
          ) : (
            <span className="design-badge">
              🎯 Produit avec design sur mockup
            </span>
          )}
        </div>

        <p className="description">{product.description}</p>
        <div className="price">{product.price} FCFA</div>
      </div>
    </div>
  );
};
```

### 3. **Galerie Wizard**

```tsx
const WizardProductGallery: React.FC<{ images: ProductImage[] }> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  // ✅ Séparer image principale et détails
  const mainImage = images.find(img => img.type === 'base') || images[0];
  const detailImages = images.filter(img => img.type === 'detail');

  return (
    <div className="wizard-gallery">
      {/* ✅ Image principale */}
      <div className="main-image">
        <img
          src={images[selectedImage]?.url || mainImage?.url}
          alt="Produit personnalisé"
        />
      </div>

      {/* ✅ Thumbnails */}
      <div className="image-thumbnails">
        {images.map((image, index) => (
          <button
            key={index}
            className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
            onClick={() => setSelectedImage(index)}
          >
            <img src={image.url} alt={`Vue ${index + 1}`} />
            <span className="image-type">
              {image.type === 'base' ? 'Principal' : `Détail ${index}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 4. **Galerie Traditionnelle**

```tsx
const TraditionalProductGallery: React.FC<{
  images: ProductImage[],
  selectedColors: Color[]
}> = ({ images, selectedColors }) => {
  const [selectedColor, setSelectedColor] = useState(selectedColors[0]);

  // ✅ Filtrer images par couleur
  const getImagesByColor = (color: Color) => {
    return images.filter(img => img.colorCode === color.colorCode);
  };

  return (
    <div className="traditional-gallery">
      {/* ✅ Sélecteur de couleur */}
      <div className="color-selector">
        {selectedColors.map(color => (
          <button
            key={color.id}
            className={`color-option ${selectedColor.id === color.id ? 'active' : ''}`}
            style={{ backgroundColor: color.colorCode }}
            onClick={() => setSelectedColor(color)}
          >
            {color.name}
          </button>
        ))}
      </div>

      {/* ✅ Images du mockup pour la couleur sélectionnée */}
      <div className="mockup-images">
        {getImagesByColor(selectedColor).map((image, index) => (
          <img
            key={index}
            src={image.url}
            alt={`${selectedColor.name} - Vue ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Services API Frontend

### Service de récupération des produits

```typescript
class ProductService {
  // ✅ Récupérer les produits du vendeur
  static async getVendorProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const response = await fetch('/api/vendor/products?' + new URLSearchParams(params));
    const data = await response.json();

    return {
      products: data.data.products,
      pagination: data.data.pagination,
      healthMetrics: data.data.healthMetrics
    };
  }

  // ✅ Détails d'un produit
  static async getProductDetails(productId: number) {
    const response = await fetch(`/api/vendor/products/${productId}`);
    const data = await response.json();

    return data.data;
  }

  // ✅ Helper: Vérifier si c'est un produit wizard
  static isWizardProduct(product: VendorProduct): boolean {
    return product.designId === null;
  }

  // ✅ Helper: Obtenir l'image principale
  static getPrimaryImage(product: VendorProduct): string | null {
    if (this.isWizardProduct(product)) {
      // Produit wizard: image base ou première
      const baseImage = product.images.adminReferences.find(
        img => img.imageType === 'base'
      );
      return baseImage?.adminImageUrl || product.images.primaryImageUrl;
    } else {
      // Produit traditionnel: image du mockup
      return product.images.primaryImageUrl;
    }
  }

  // ✅ Helper: Obtenir toutes les images détail
  static getDetailImages(product: VendorProduct): string[] {
    if (this.isWizardProduct(product)) {
      // Produit wizard: images détail
      return product.images.adminReferences
        .filter(img => img.imageType === 'detail')
        .map(img => img.adminImageUrl);
    } else {
      // Produit traditionnel: toutes les variations
      return product.images.adminReferences.map(img => img.adminImageUrl);
    }
  }
}
```

## 📱 Styles CSS Recommandés

```css
/* ✅ Cards produits */
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.product-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

/* ✅ Badges type de produit */
.product-type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* ✅ Galerie wizard */
.wizard-gallery .main-image {
  width: 100%;
  max-height: 500px;
  overflow: hidden;
  border-radius: 8px;
}

.wizard-gallery .image-thumbnails {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  overflow-x: auto;
}

.wizard-gallery .thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
}

.wizard-gallery .thumbnail.active {
  border-color: #007bff;
}

/* ✅ Sélecteur de couleur traditionnel */
.color-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.color-option {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.2s;
}

.color-option.active {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
```

## 🎯 Checklist d'Implémentation

### Backend ✅
- [x] originalAdminName corrigé dans vendor-wizard-product.service.ts
- [x] Méthodes formatProductImages() et getPrimaryImageUrl() ajoutées
- [x] Structure d'images intelligente dans vendor-publish.service.ts

### Frontend 📋
- [ ] Créer ProductCard avec détection wizard vs traditionnel
- [ ] Implémenter WizardProductGallery pour images personnalisées
- [ ] Implémenter TraditionalProductGallery pour mockups
- [ ] Ajouter ProductService avec helpers de détection
- [ ] Styler les badges et galeries
- [ ] Tester l'affichage des deux types de produits

## 🧪 Tests Recommandés

1. **Vérifier l'affichage des cards:**
   - Produit wizard → Image base + badge "Personnalisé"
   - Produit traditionnel → Image mockup + badge "Design"

2. **Tester les galeries:**
   - Wizard → Navigation base + détails
   - Traditionnel → Sélection couleur + mockups

3. **Valider les données:**
   - originalAdminName jamais null
   - primaryImageUrl toujours défini
   - Structure images cohérente

## 🎨 Résultat Final

Avec ces corrections, vous aurez :
- **Cards cohérentes** : Chaque produit affiche son image appropriée
- **Pages détail adaptées** : Galeries différentes selon le type
- **UX claire** : L'utilisateur comprend immédiatement le type de produit
- **Données fiables** : Plus de valeurs null ou undefined