# Guide Frontend - Affichage des Personnalisations dans les Commandes

## Vue d'ensemble

Les commandes contenant des produits personnalisés incluent maintenant toutes les données de personnalisation dans la réponse API. Ce guide explique comment utiliser ces données dans le frontend admin.

---

## Endpoints concernés

| Endpoint | Description |
|----------|-------------|
| `GET /orders/admin/all` | Liste paginée de toutes les commandes |
| `GET /orders/:id` | Détails d'une commande spécifique |

---

## Structure de la réponse

### OrderItem avec personnalisation

```typescript
interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
  colorId?: number;

  // Produit de base
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    orderedColorName?: string;
    orderedColorHexCode?: string;
    orderedColorImageUrl?: string;
  };

  // 🎨 NOUVEAU: Indicateur rapide de personnalisation
  isCustomizedProduct: boolean;

  // 🎨 NOUVEAU: Données complètes de personnalisation
  customization: CustomizationData | null;

  // Champs legacy (aussi disponibles)
  customizationId?: number;
  customizationIds?: Record<string, number>;
  designElementsByView?: Record<string, DesignElement[]>;
  mockupUrl?: string;
}
```

### CustomizationData

```typescript
interface CustomizationData {
  id: number;

  // 🎨 Éléments de design
  designElements: DesignElement[];           // Format simple (une vue)
  elementsByView: Record<string, DesignElement[]>; // Format multi-vues

  // 🖼️ Image de prévisualisation
  previewImageUrl: string | null;

  // 📍 Informations de vue
  colorVariationId: number;
  viewId: number;

  // 📦 Sélections de taille
  sizeSelections: SizeSelection[] | null;

  // 📊 Métadonnées
  status: 'draft' | 'ordered' | 'completed';
  createdAt: string;
  updatedAt: string;

  // 🔍 Indicateurs utiles
  isCustomized: true;
  hasDesignElements: boolean;      // true si designElements.length > 0
  hasMultiViewDesign: boolean;     // true si elementsByView a des clés
}
```

### DesignElement

```typescript
// Élément texte
interface TextElement {
  id: string;
  type: 'text';
  text: string;
  x: number;           // Position X (0-1, relatif)
  y: number;           // Position Y (0-1, relatif)
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  fontSize: number;
  baseFontSize: number;
  baseWidth: number;
  fontFamily: string;
  color: string;       // Hex color
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;
}

// Élément image
interface ImageElement {
  id: string;
  type: 'image';
  imageUrl: string;    // URL Cloudinary
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  naturalWidth: number;
  naturalHeight: number;
}

type DesignElement = TextElement | ImageElement;
```

---

## Comment détecter un produit personnalisé

### Méthode simple (recommandée)

```typescript
const isCustomized = orderItem.isCustomizedProduct;
```

### Méthode détaillée

```typescript
const isCustomized =
  orderItem.customization !== null ||
  orderItem.customizationId !== undefined ||
  orderItem.customizationIds !== undefined;
```

---

## Exemples d'utilisation React

### 1. Afficher un badge "Personnalisé"

```tsx
function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="order-item">
      <span>{item.product.name}</span>

      {item.isCustomizedProduct && (
        <span className="badge badge-custom">
          🎨 Personnalisé
        </span>
      )}
    </div>
  );
}
```

### 2. Afficher la prévisualisation

```tsx
function CustomizationPreview({ item }: { item: OrderItem }) {
  if (!item.customization?.previewImageUrl) {
    return null;
  }

  return (
    <div className="customization-preview">
      <h4>Aperçu de la personnalisation</h4>
      <img
        src={item.customization.previewImageUrl}
        alt="Prévisualisation personnalisation"
        className="preview-image"
      />
    </div>
  );
}
```

### 3. Lister les éléments de design

```tsx
function DesignElementsList({ item }: { item: OrderItem }) {
  if (!item.customization?.hasDesignElements) {
    return <p>Aucun élément de design</p>;
  }

  const elements = item.customization.designElements;

  return (
    <div className="design-elements">
      <h4>Éléments de design ({elements.length})</h4>

      {elements.map((element) => (
        <div key={element.id} className="element-item">
          {element.type === 'text' ? (
            <div className="text-element">
              <span className="icon">📝</span>
              <span className="text">"{element.text}"</span>
              <span className="font">{element.fontFamily}</span>
              <span
                className="color-swatch"
                style={{ backgroundColor: element.color }}
              />
            </div>
          ) : (
            <div className="image-element">
              <span className="icon">🖼️</span>
              <img
                src={element.imageUrl}
                alt="Design"
                className="element-thumbnail"
              />
              <span className="size">
                {element.naturalWidth}x{element.naturalHeight}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 4. Gérer le format multi-vues

```tsx
function MultiViewDesign({ item }: { item: OrderItem }) {
  if (!item.customization?.hasMultiViewDesign) {
    return null;
  }

  const elementsByView = item.customization.elementsByView;
  const viewKeys = Object.keys(elementsByView);

  return (
    <div className="multi-view-design">
      <h4>Design multi-vues ({viewKeys.length} vues)</h4>

      {viewKeys.map((viewKey) => {
        const [colorId, viewId] = viewKey.split('-');
        const elements = elementsByView[viewKey];

        return (
          <div key={viewKey} className="view-section">
            <h5>Vue {viewId} (Couleur {colorId})</h5>
            <p>{elements.length} élément(s)</p>

            {elements.map((el) => (
              <span key={el.id} className="element-badge">
                {el.type === 'text' ? `"${el.text}"` : '🖼️'}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

### 5. Composant complet pour les détails de commande

```tsx
function OrderItemDetails({ item }: { item: OrderItem }) {
  return (
    <div className="order-item-details">
      {/* Infos produit de base */}
      <div className="product-info">
        <h3>{item.product.name}</h3>
        <p>Quantité: {item.quantity}</p>
        <p>Prix unitaire: {item.unitPrice} FCFA</p>
        {item.size && <p>Taille: {item.size}</p>}
        {item.color && (
          <p>
            Couleur: {item.color}
            {item.product.orderedColorHexCode && (
              <span
                className="color-dot"
                style={{ backgroundColor: item.product.orderedColorHexCode }}
              />
            )}
          </p>
        )}
      </div>

      {/* Section personnalisation */}
      {item.isCustomizedProduct && item.customization && (
        <div className="customization-section">
          <h4>🎨 Personnalisation</h4>

          {/* Prévisualisation */}
          {item.customization.previewImageUrl && (
            <div className="preview">
              <img
                src={item.customization.previewImageUrl}
                alt="Aperçu"
              />
            </div>
          )}

          {/* Éléments de design */}
          {item.customization.hasDesignElements && (
            <div className="elements">
              <p>
                <strong>Éléments:</strong> {item.customization.designElements.length}
              </p>

              {item.customization.designElements.map((el) => (
                <div key={el.id} className="element">
                  {el.type === 'text' ? (
                    <>
                      <span>📝 Texte: "{el.text}"</span>
                      <span>Police: {el.fontFamily}</span>
                      <span>Taille: {el.fontSize}px</span>
                    </>
                  ) : (
                    <>
                      <span>🖼️ Image</span>
                      <a href={el.imageUrl} target="_blank">
                        Voir l'image
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Métadonnées */}
          <div className="metadata">
            <small>
              ID: {item.customization.id} |
              Status: {item.customization.status} |
              Créé: {new Date(item.customization.createdAt).toLocaleDateString()}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Exemple de réponse API complète

```json
{
  "orders": [
    {
      "id": 42,
      "orderNumber": "ORD-1700352000000",
      "status": "PENDING",
      "totalAmount": 15000,
      "orderItems": [
        {
          "id": 1,
          "productId": 5,
          "quantity": 2,
          "unitPrice": 7500,
          "size": "M",
          "color": "Blanc",
          "colorId": 13,

          "product": {
            "id": 5,
            "name": "T-shirt Classic",
            "price": 7500,
            "orderedColorName": "Blanc",
            "orderedColorHexCode": "#ffffff",
            "orderedColorImageUrl": "https://res.cloudinary.com/..."
          },

          "isCustomizedProduct": true,

          "customization": {
            "id": 42,
            "designElements": [
              {
                "id": "element-123",
                "type": "text",
                "text": "Mon texte personnalisé",
                "x": 0.5,
                "y": 0.3,
                "width": 200,
                "height": 50,
                "rotation": 0,
                "zIndex": 0,
                "fontSize": 24,
                "baseFontSize": 24,
                "baseWidth": 200,
                "fontFamily": "Arial",
                "color": "#000000",
                "fontWeight": "bold",
                "fontStyle": "normal",
                "textDecoration": "none",
                "textAlign": "center",
                "curve": 0
              },
              {
                "id": "element-456",
                "type": "image",
                "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v123/design.png",
                "x": 0.5,
                "y": 0.6,
                "width": 150,
                "height": 150,
                "rotation": 0,
                "zIndex": 1,
                "naturalWidth": 500,
                "naturalHeight": 500
              }
            ],
            "elementsByView": {
              "13-13": [
                {
                  "id": "element-123",
                  "type": "text",
                  "text": "Mon texte personnalisé",
                  "..."
                }
              ]
            },
            "previewImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v123/preview.png",
            "colorVariationId": 13,
            "viewId": 13,
            "sizeSelections": [
              { "size": "M", "quantity": 2 }
            ],
            "status": "ordered",
            "createdAt": "2024-11-18T23:45:00.000Z",
            "updatedAt": "2024-11-18T23:47:00.000Z",
            "isCustomized": true,
            "hasDesignElements": true,
            "hasMultiViewDesign": true
          }
        }
      ],
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-11-18T23:50:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## CSS suggéré

```css
/* Badge personnalisé */
.badge-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Prévisualisation */
.preview-image {
  max-width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Éléments de design */
.element-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 4px 0;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.element-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

/* Section personnalisation */
.customization-section {
  background: #f0f4ff;
  border: 1px solid #d0d8ff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.customization-section h4 {
  margin: 0 0 12px 0;
  color: #4a5568;
}
```

---

## Points importants

1. **Toujours vérifier `isCustomizedProduct`** avant d'accéder aux données de personnalisation
2. **`previewImageUrl`** peut être `null` - afficher un placeholder si nécessaire
3. **`designElements`** contient les éléments de la vue principale
4. **`elementsByView`** contient les éléments pour chaque vue (format: `{colorId}-{viewId}`)
5. Les positions `x` et `y` sont relatives (0-1), pas en pixels
6. Les images sont hébergées sur Cloudinary

---

## Questions fréquentes

### Q: Comment savoir si un élément est du texte ou une image?
R: Vérifiez `element.type === 'text'` ou `element.type === 'image'`

### Q: Pourquoi `customization` peut être null même si `customizationId` existe?
R: L'ancien système utilisait `customizationId` sans inclure les données. Le nouveau système inclut tout dans `customization`.

### Q: Comment afficher le design sur l'image du produit?
R: Utilisez les coordonnées `x`, `y`, `width`, `height` et `rotation` pour positionner les éléments sur un canvas ou avec CSS absolute positioning.

---

## Support

Pour toute question, contactez l'équipe backend ou consultez la documentation de l'API Swagger à `/api-docs`.
