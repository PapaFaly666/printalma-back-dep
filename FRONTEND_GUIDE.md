# 📚 Guide Frontend - Système de Commandes Printalma

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser et maintenir le système de commandes enrichies avec les données visuelles des produits (images, designs, positions, mockups) intégrées depuis le système vendor-products.

## ✨ NOUVEAUTÉ : Sauvegarde du Design et Mockup dans les Commandes

### 🎨 Champs de Design Ajoutés aux OrderItems

Lors de la création d'une commande, vous pouvez maintenant sauvegarder :
- **mockupUrl** : L'URL du mockup avec le design appliqué
- **designId** : L'ID du design utilisé
- **designPositions** : Les coordonnées de placement du design (JSON)
- **designMetadata** : Métadonnées complètes du design pour l'historique (JSON)

---

## 🚀 Points Clés à Comprendre

### 1. Architecture des Données

Les commandes (`orders`) contiennent maintenant des données enrichies qui combinent :
- **Données de commande traditionnelles** (client, prix, statut)
- **Données visuelles du produit** (images, designs, positions)
- **Informations du vendeur** (shop, profil)

### 2. Flux de Données

```
vendor-products → orders
     ↓              ↓
  Produits        Commandes
  Enrichis      Enrichies
   ↓               ↓
Images/Designs → Order Items
Positions      + Visuels
```

---

## 📡 Endpoints Principaux

### Commandes Admin (avec données enrichies)

```http
GET /orders/admin/all?page=1&limit=10
Authorization: Bearer <token_admin>
```

**Structure de réponse enrichie :**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-123456",
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "totalAmount": 25000,

        // 🎨 DONNÉES ENRICHIES DU PRODUIT
        "order_items": [
          {
            "id": 456,
            "quantity": 2,
            "unitPrice": 12500,
            "size": "XL",
            "color": "Blanc",

            // 📦 PRODUIT ADMIN DE BASE
            "adminProduct": {
              "id": 3,
              "name": "Tshirt",
              "description": "Tshirt de luxe",
              "price": 4000,
              "genre": "HOMME",
              "colorVariations": [
                {
                  "id": 6,
                  "name": "Blanc",
                  "colorCode": "#ffffff",
                  "images": [
                    {
                      "id": 6,
                      "view": "Front",
                      "url": "https://res.cloudinary.com/...",
                      "delimitations": [
                        {
                          "id": 6,
                          "name": "Zone 2",
                          "x": 378.33,
                          "y": 318.33,
                          "width": 413.59,
                          "height": 653.53,
                          "coordinateType": "PERCENTAGE"
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            // 🎨 APPLICATION DU DESIGN
            "designApplication": {
              "hasDesign": true,
              "designUrl": "https://res.cloudinary.com/raw/upload/...",
              "positioning": "CENTER",
              "scale": 0.6,
              "mode": "PRESERVED"
            },

            // 📐 DÉLIMITATIONS PAR COULEUR
            "designDelimitations": [
              {
                "colorName": "Blanc",
                "colorCode": "#ffffff",
                "imageUrl": "https://res.cloudinary.com/...",
                "naturalWidth": 1200,
                "naturalHeight": 1200,
                "delimitations": [
                  {
                    "id": 6,
                    "name": "Zone 2",
                    "x": 378.33,
                    "y": 318.33,
                    "width": 413.59,
                    "height": 653.53,
                    "coordinateType": "PERCENTAGE"
                  }
                ]
              }
            ],

            // 🎯 POSITIONS DU DESIGN
            "designPositions": [
              {
                "designId": 4,
                "position": {
                  "x": 0,
                  "y": 0,
                  "scale": 0.6,
                  "rotation": 0,
                  "constraints": {
                    "minScale": 0.1,
                    "maxScale": 2
                  }
                }
              }
            ],

            // 🖼️ IMAGES DE RÉFÉRENCE
            "images": {
              "adminReferences": [
                {
                  "colorName": "Blanc",
                  "colorCode": "#ffffff",
                  "adminImageUrl": "https://res.cloudinary.com/...",
                  "imageType": "admin_reference"
                }
              ],
              "total": 1,
              "primaryImageUrl": "https://res.cloudinary.com/..."
            },

            // 👤 VENDEUR
            "vendor": {
              "id": 3,
              "fullName": "Papa Faly Sidy",
              "shop_name": "C'est carré",
              "profile_photo_url": null
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Autres Endpoints Utiles

```http
# Obtenir une commande spécifique
GET /orders/:id
Authorization: Bearer <token>

# Obtenir les commandes d'un utilisateur
GET /orders/my-orders
Authorization: Bearer <token>

# Obtenir l'historique des tentatives de paiement
GET /orders/:orderNumber/payment-attempts

# Relancer un paiement échoué
POST /orders/:orderNumber/retry-payment
```

---

## 🛠️ Implémentation Frontend

### 1. TypeScript Interfaces

```typescript
// Interfaces principales
interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  genre: string;
  colorVariations: ColorVariation[];
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ProductImage[];
}

interface ProductImage {
  id: number;
  view: string;
  url: string;
  delimitations: Delimitation[];
}

interface Delimitation {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'ABSOLUTE';
}

interface DesignApplication {
  hasDesign: boolean;
  designUrl: string;
  positioning: 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
  scale: number;
  mode: 'PRESERVED' | 'STRETCHED';
}

interface DesignDelimitation {
  colorName: string;
  colorCode: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  delimitations: Delimitation[];
}

interface DesignPosition {
  designId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    constraints: {
      minScale: number;
      maxScale: number;
    };
  };
}

interface OrderItemEnriched {
  id: number;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
  adminProduct: AdminProduct;
  designApplication: DesignApplication;
  designDelimitations: DesignDelimitation[];
  designPositions: DesignPosition[];
  images: {
    adminReferences: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
      imageType: string;
    }>;
    total: number;
    primaryImageUrl: string;
  };
  vendor: {
    id: number;
    fullName: string;
    shop_name: string;
    profile_photo_url: string | null;
  };
}
```

### 2. Composant React - Affichage Commande

```tsx
import React from 'react';

interface OrderItemDisplayProps {
  orderItem: OrderItemEnriched;
}

const OrderItemDisplay: React.FC<OrderItemDisplayProps> = ({ orderItem }) => {
  const { adminProduct, designApplication, designDelimitations, images, vendor } = orderItem;

  return (
    <div className="order-item-card">
      {/* Header du produit */}
      <div className="product-header">
        <h3>{adminProduct.name}</h3>
        <div className="vendor-info">
          <span>Vendeur: {vendor.shop_name}</span>
          <span>Par: {vendor.fullName}</span>
        </div>
      </div>

      {/* Image principale */}
      <div className="product-image-container">
        <img
          src={images.primaryImageUrl}
          alt={`${adminProduct.name} - ${orderItem.color}`}
          className="product-main-image"
        />

        {/* Overlay du design si présent */}
        {designApplication.hasDesign && (
          <div className="design-overlay">
            <img
              src={designApplication.designUrl}
              alt="Design personnalisé"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) scale(${designApplication.scale})`,
                left: '50%',
                top: '50%'
              }}
            />
          </div>
        )}
      </div>

      {/* Informations de base */}
      <div className="product-details">
        <div className="details-row">
          <span>Couleur:</span>
          <span>{orderItem.color}</span>
          <div
            className="color-swatch"
            style={{ backgroundColor: orderItem.color }}
          />
        </div>

        <div className="details-row">
          <span>Taille:</span>
          <span>{orderItem.size}</span>
        </div>

        <div className="details-row">
          <span>Quantité:</span>
          <span>{orderItem.quantity}</span>
        </div>

        <div className="details-row">
          <span>Prix unitaire:</span>
          <span>{orderItem.unitPrice} FCFA</span>
        </div>

        <div className="details-row total">
          <span>Total:</span>
          <span>{orderItem.quantity * orderItem.unitPrice} FCFA</span>
        </div>
      </div>

      {/* Visualisation des délimitations */}
      {designDelimitations.length > 0 && (
        <div className="design-zones">
          <h4>Zones de design:</h4>
          <div className="zones-grid">
            {designDelimitations.map((delimitation, index) => (
              <div key={index} className="zone-item">
                <img
                  src={delimitation.imageUrl}
                  alt={`${delimitation.colorName} - Zone design`}
                  className="zone-image"
                />
                <div className="zone-info">
                  <span>{delimitation.colorName}</span>
                  {delimitation.delimitations.map((zone, zoneIndex) => (
                    <div key={zoneIndex} className="zone-details">
                      Zone: {zone.name} ({Math.round(zone.x)}%, {Math.round(zone.y)}%)
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderItemDisplay;
```

### 3. Hook React - Récupération des commandes

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);

      const response = await axios.get(`/api/orders/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [options.page, options.limit, options.status]);

  return {
    orders,
    loading,
    error,
    pagination,
    refetch: fetchOrders
  };
};
```

---

## 🔧 Maintenance

### 1. Points de Surveillance

#### Performance
- **Temps de réponse**: Les endpoints enrichis peuvent être plus lents
- **Taille des réponses**: Les données enrichies augmentent la taille des réponses JSON
- **Images**: Les URLs Cloudinary peuvent expirer

#### Données
- **Structures**: Les interfaces TypeScript doivent rester synchronisées
- **Null checks**: Les champs enrichis peuvent être null si pas de vendorProduct
- **Références**: Les ID de relations doivent être valides

### 2. Bonnes Pratiques

#### Frontend
```typescript
// Vérification des données enrichies
const isOrderItemEnriched = (item: any): item is OrderItemEnriched => {
  return item && item.adminProduct && item.designApplication;
};

// Affichage conditionnel
{isOrderItemEnriched(orderItem) ? (
  <EnrichedOrderItemDisplay item={orderItem} />
) : (
  <BasicOrderItemDisplay item={orderItem} />
)}
```

#### Gestion des erreurs
```typescript
// Gestion gracieuse des données manquantes
const getProductImage = (item: OrderItemEnriched) => {
  return item.images?.primaryImageUrl || item.product?.imageUrl || '/placeholder.png';
};

const getVendorName = (item: OrderItemEnriched) => {
  return item.vendor?.shop_name || 'Vendeur inconnu';
};
```

### 3. Débogage

#### Vérifier la structure
```typescript
// Log de débogage
console.log('OrderItem structure:', JSON.stringify(orderItem, null, 2));
console.log('Has adminProduct:', !!orderItem.adminProduct);
console.log('Has design:', !!orderItem.designApplication?.hasDesign);
```

#### Validation côté client
```typescript
// Validation des données essentielles
const validateOrderItem = (item: any) => {
  if (!item.id || !item.quantity || !item.unitPrice) {
    console.error('Order item missing essential fields:', item);
    return false;
  }

  if (item.adminProduct && !item.adminProduct.id) {
    console.error('Admin product missing ID:', item.adminProduct);
    return false;
  }

  return true;
};
```

---

## 🚨 Problèmes Courants & Solutions

### 1. Données manquantes
**Problème**: `adminProduct` ou `designApplication` sont null
**Cause**: La commande n'a pas de `vendorProductId` associé
**Solution**: Afficher les données de base du produit

```typescript
{orderItem.adminProduct ? (
  <EnrichedDisplay item={orderItem} />
) : (
  <BasicDisplay item={orderItem} />
)}
```

### 2. Images qui ne chargent pas
**Problème**: URLs Cloudinary invalides ou expirées
**Cause**: Problème de configuration Cloudinary
**Solution**: Image de fallback

```typescript
const SafeImage = ({ src, alt, fallback, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    setImgSrc(fallback);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
};
```

### 3. Performance avec beaucoup de commandes
**Problème**: Page lente avec beaucoup de commandes enrichies
**Cause**: Trop de données visuelles chargées d'un coup
**Solution**: Pagination et chargement progressif

```typescript
// Infinite scroll avec pagination
const loadMoreOrders = () => {
  if (!loading && pagination && pagination.hasNext) {
    fetchOrders({
      page: pagination.page + 1,
      limit: 10
    });
  }
};
```

---

## 📞 Support

Pour toute question ou problème technique :

1. **Vérifier la documentation API** (`API_PAIEMENT_DOCUMENTATION.md`)
2. **Consulter les logs du backend** pour les erreurs serveur
3. **Valider les structures de données** avec les exemples ci-dessus
4. **Contactez l'équipe backend** pour les problèmes de synchronisation

---

**Dernière mise à jour :** 9 Novembre 2025
**Version :** 1.0.0
### 📝 Exemple de Requête avec Design et Mockup

```javascript
// Exemple de création de commande avec design et mockup
const orderData = {
  shippingDetails: {
    firstName: "Papa Faly",
    lastName: "Sidy",
    street: "Point E",
    city: "Dakar",
    postalCode: "33222",
    country: "Sénégal"
  },
  phoneNumber: "775588834",
  email: "client@example.com",
  paymentMethod: "PAYDUNYA",
  initiatePayment: true,
  orderItems: [
    {
      productId: 3,
      vendorProductId: 5,
      quantity: 1,
      unitPrice: 3000,
      size: "L",
      color: "Blanc",
      colorId: 1,
      // 🎨 NOUVEAUX CHAMPS DE DESIGN
      mockupUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123456/mockups/product-123-design-456.png",
      designId: 42,
      designPositions: {
        x: 0.5,
        y: 0.4,
        scale: 0.6,
        rotation: 0,
        designWidth: 1200,
        designHeight: 1200
      },
      designMetadata: {
        designName: "Logo Cool",
        designCategory: "LOGO",
        designImageUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123456/designs/logo-cool.png",
        appliedAt: "2025-11-09T20:46:41.020Z"
      }
    }
  ]
};

// Envoi de la requête
const response = await fetch('http://localhost:3004/orders/guest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});

const result = await response.json();
console.log('Commande créée:', result);
```

### 📊 Structure de Réponse avec Design

Lorsque vous récupérez une commande, les informations de design seront incluses :

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 213,
        "orderNumber": "ORD-1762721201019",
        "orderItems": [
          {
            "id": 212,
            "productId": 3,
            "quantity": 1,
            "unitPrice": 3000,
            "size": "L",
            "color": "Blanc",
            "colorId": 1,
            "mockupUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456/mockups/product-123-design-456.png",
            "designId": 42,
            "designPositions": {
              "x": 0.5,
              "y": 0.4,
              "scale": 0.6,
              "rotation": 0,
              "designWidth": 1200,
              "designHeight": 1200
            },
            "designMetadata": {
              "designName": "Logo Cool",
              "designCategory": "LOGO",
              "designImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456/designs/logo-cool.png",
              "appliedAt": "2025-11-09T20:46:41.020Z"
            }
          }
        ]
      }
    ]
  }
}
```

### 🔍 Utilisation des Données de Design

```javascript
// Afficher le mockup dans l'interface
orderItems.forEach(item => {
  if (item.mockupUrl) {
    console.log('Mockup disponible:', item.mockupUrl);
    // Afficher l'image du mockup dans votre interface
    displayMockup(item.mockupUrl);
  }

  if (item.designPositions) {
    console.log('Position du design:', item.designPositions);
    // Utiliser les coordonnées pour recréer le placement si nécessaire
    recreateDesignPlacement(item.designPositions);
  }

  if (item.designMetadata) {
    console.log('Informations du design:', item.designMetadata);
    // Afficher les détails du design
    displayDesignInfo(item.designMetadata);
  }
});
```

### ⚠️ Points Importants

1. **Tous les champs de design sont optionnels** : Le système fonctionne avec ou sans design
2. **Format JSON pour designPositions et designMetadata** : Assurez-vous d'envoyer des objets JSON valides
3. **mockupUrl doit être une URL complète** : Incluez le protocole (https://)
4. **designId doit être un nombre** : Correspond à l'ID du design dans la base de données

### 🎯 Cas d'Usage

**1. Commande avec design personnalisé :**
```javascript
{
  mockupUrl: "https://...",
  designId: 42,
  designPositions: { x: 0.5, y: 0.4, scale: 0.6, rotation: 0 },
  designMetadata: { designName: "Logo Cool", ... }
}
```

**2. Commande sans design (produit standard) :**
```javascript
{
  // Pas de champs de design
  // Les champs mockupUrl, designId, designPositions, designMetadata seront null
}
```

