# 📋 GUIDE FRONTEND - AFFICHAGE DÉTAILS COMMANDE

## 🎯 Vue d'ensemble

Ce guide explique comment afficher les détails d'une commande avec l'endpoint `GET /api/orders/:id`, incluant :
- Les informations de base de la commande
- Les détails de livraison avec transporteur et tarifs
- Les informations de personnalisation
- L'historique des tentatives de paiement
- Les informations client enrichies

---

## 🔗 Endpoint API

### GET /api/orders/:id

**Authentification requise :** `Bearer Token` (JWT)

**Permissions :**
- Utilisateurs : peuvent voir seulement leurs propres commandes
- Admins : peuvent voir toutes les commandes

**Réponse :**
```json
{
  "success": true,
  "message": "Commande récupérée avec succès",
  "data": {
    // Structure de commande complète (voir ci-dessous)
  }
}
```

---

## 📊 Structure des Données

### 1. Informations de Base

```typescript
interface OrderData {
  // Identifiants
  id: number;
  orderNumber: string;

  // Montants
  subtotal: number;        // Somme des prix des produits
  deliveryFee: number;     // Frais de livraison
  totalAmount: number;    // Montant total (subtotal + deliveryFee)

  // Statuts
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'PAYDUNYA' | 'PAYTECH' | 'CASH_ON_DELIVERY' | 'OTHER';

  // Dates
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  estimatedDelivery?: string; // ISO 8601

  // Métadonnées
  transactionId?: string;
  paymentAttempts: number;
  lastPaymentAttemptAt?: string;
  hasInsufficientFunds: boolean;
  lastPaymentFailureReason?: string;

  // Notes
  notes?: string;
}
```

### 2. Informations de Paiement Enrichies (`payment_info`)

```typescript
interface PaymentInfo {
  status: string;                    // 'PAID', 'FAILED', etc.
  status_text: string;                 // 'Payé', 'Échoué', etc.
  status_icon: string;                 // '✅', '❌', etc.
  status_color: string;                // '#28A745', '#DC3545', etc.
  method: string;                      // 'PAYDUNYA', etc.
  method_text: string;                 // 'PayDunya', etc.
  transaction_id: string;              // Token de transaction
  attempts_count: number;               // Nombre de tentatives
  last_attempt_at: string;             // Dernière tentative (ISO 8601)

  // Gestion des fonds insuffisants
  insufficient_funds?: {
    detected: boolean;
    last_failure_reason: string;
    message: string;
    user_message: string;
    can_retry: boolean;
    retry_available: boolean;
  };

  // Historique récent des tentatives
  recent_attempts?: Array<{
    attempt_number: number;
    status: string;
    attempted_at: string;
    failure_reason?: string;
    failure_category?: string;
    payment_method: string;
  }>;
}
```

### 3. Informations Client Enrichies (`customer_info`)

```typescript
interface CustomerInfo {
  // Informations utilisateur (si connecté)
  user_id?: number;
  user_firstname?: string;
  user_lastname?: string;
  user_email?: string;
  user_phone?: string;
  user_role?: string;

  // Informations de livraison de la commande
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;

  // Informations de contact principales
  email: string;
  phone: string;
  full_name: string;

  // Détails de livraison
  shipping_address?: {
    address: string;
    city: string;
    postal_code: string;
    country: string;
    additional_info?: string;
  };

  // Notes client
  notes?: string;

  // Dates importantes
  created_at: string;
  updated_at: string;
}
```

### 4. Informations de Livraison (`delivery_info`)

#### Structure Complète (avec transporteur)

```typescript
interface DeliveryInfo {
  // Type de livraison
  deliveryType: 'city' | 'region' | 'international';

  // Localisation
  location: {
    type: 'city' | 'region' | 'international';

    // Pour livraison en ville
    cityId?: string;
    cityName?: string;

    // Pour livraison en région
    regionId?: string;
    regionName?: string;

    // Pour livraison internationale
    zoneId?: string;
    zoneName?: string;

    // Communs
    countryCode: string;     // 'SN', 'FR', etc.
    countryName: string;     // 'Sénégal', 'France', etc.
  };

  // Transporteur sélectionné
  transporteur?: {
    id: string;
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
    description?: string;
    status: 'active' | 'inactive';
  };

  // Tarification
  tarif?: {
    id: string;
    amount: number;         // Montant en XOF
    currency: string;       // 'XOF'
    deliveryTime: string;   // '24-48 heures'
    description?: string;
  };

  // Métadonnées (optionnel)
  metadata?: {
    availableCarriers?: any[];
    selectedAt?: string;
    calculationDetails?: any;
  };
}
```

#### Cas Spécifique : Livraison Sans Transporteur (Sénégal)

```typescript
interface DeliveryInfoSansTransporteur {
  deliveryType: 'city';  // Généralement 'city' pour le Sénégal

  location: {
    type: 'city';
    cityId: string;
    cityName: string;
    countryCode: 'SN';
    countryName: 'Sénégal';
  };

  // Pas de transporteur ni de tarif pour livraison gratuite/locale
  // transporteur: undefined
  // tarif: undefined
}
```

### 5. Articles de Commande (`order_items`)

```typescript
interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  colorId?: number;
  color?: string;

  // Produit
  product: {
    id: number;
    name: string;
    description?: string;
    vendorId?: number;

    // Informations sur la couleur commandée
    orderedColorName?: string;
    orderedColorHexCode?: string;
    orderedColorImageUrl?: string;
  };

  // Variation de couleur
  colorVariation?: {
    id: number;
    name: string;
    colorCode: string;
    images?: Array<{
      id: number;
      url: string;
      viewType: string;
    }>;
  };

  // Personnalisation (optionnel)
  customization?: {
    id: number;
    designElements?: any[];           // Format simple
    elementsByView?: Record<string, any[]>; // Format multi-vues
    previewImageUrl?: string;
    colorVariationId: number;
    viewId: number;
    sizeSelections?: Array<{
      size: string;
      quantity: number;
    }>;
    status: 'draft' | 'ordered';
    createdAt: string;
    updatedAt: string;

    // Indicateurs pour le frontend
    isCustomized: boolean;
    hasDesignElements: boolean;
    hasMultiViewDesign: boolean;
  };

  // Métadonnées de personnalisation
  customizationId?: number;
  customizationIds?: Record<string, number>; // Format multi-vues
  designPositions?: any;
  designMetadata?: any;
  delimitation?: any;
  delimitations?: Array<{
    viewId: number;
    viewKey: string;
    viewType?: string;
    imageUrl?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: 'RELATIVE' | 'PIXEL';
    referenceWidth?: number;
    referenceHeight?: number;
  }>;

  // Métadonnées des vues (pour multi-vues)
  viewsMetadata?: Array<{
    viewKey: string;
    colorId: number;
    viewId: number;
    viewType: string;
    imageUrl: string;
    hasElements: boolean;
    elementsCount: number;
  }>;

  // URL du mockup avec design appliqué
  mockupUrl?: string;

  // Indicateurs pour le frontend
  isCustomizedProduct: boolean;
  viewsMetadata?: any;
  designElementsByView?: Record<string, any[]>;
  customizationIds?: Record<string, number>;
}
```

---

## 🎨 Composants React

### 1. Composant Principal des Détails

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OrderService } from '../services/order.service';

interface OrderDetailsResponse {
  success: boolean;
  message: string;
  data: OrderData;
}

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await OrderService.getOrderById(parseInt(id));

        if (response.success) {
          setOrder(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!order) return <div>Commande non trouvée</div>;

  return (
    <div className="order-details">
      <OrderHeader order={order} />
      <PaymentSection paymentInfo={order.payment_info} />
      <CustomerSection customerInfo={order.customer_info} />
      <DeliverySection deliveryInfo={order.delivery_info} />
      <OrderItemsSection items={order.order_items} />
      {order.notes && <NotesSection notes={order.notes} />}
    </div>
  );
};
```

### 2. Section Livraison

```typescript
interface DeliverySectionProps {
  deliveryInfo?: DeliveryInfo | null;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({ deliveryInfo }) => {
  if (!deliveryInfo) {
    return (
      <div className="delivery-section">
        <h3>📍 Informations de Livraison</h3>
        <div className="no-delivery">
          <p>Aucune information de livraison disponible</p>
          <small>Commande ancienne ou livraison en point de retrait</small>
        </div>
      </div>
    );
  }

  const { location, transporteur, tarif } = deliveryInfo;

  return (
    <div className="delivery-section">
      <h3>🚚 Informations de Livraison</h3>

      {/* Type et localisation */}
      <div className="delivery-location">
        <h4>Type de livraison</h4>
        <div className="location-badge">
          {location.type === 'city' && '🏙️ Livraison en ville'}
          {location.type === 'region' && '🌍️ Livraison en région'}
          {location.type === 'international' && '🌍️ Livraison internationale'}
        </div>

        <div className="location-details">
          <p><strong>Localisation :</strong></p>
          <ul>
            {location.cityName && <li>Ville : {location.cityName}</li>}
            {location.regionName && <li>Région : {location.regionName}</li>}
            {location.zoneName && <li>Zone : {location.zoneName}</li>}
            <li>Pays : {location.countryName}</li>
          </ul>
        </div>
      </div>

      {/* Transporteur (si disponible) */}
      {transporteur ? (
        <div className="delivery-carrier">
          <h4>Transporteur</h4>
          <div className="carrier-info">
            <div className="carrier-header">
              {transporteur.logo && (
                <img
                  src={transporteur.logo}
                  alt={transporteur.name}
                  className="carrier-logo"
                />
              )}
              <div className="carrier-details">
                <p className="carrier-name">{transporteur.name}</p>
                {transporteur.phone && (
                  <p className="carrier-phone">📞 {transporteur.phone}</p>
                )}
              </div>
              <div className="carrier-status">
                <span className={`status-badge ${transporteur.status}`}>
                  {transporteur.status === 'active' ? '✅ Actif' : '❌ Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="delivery-carrier">
          <h4>Transporteur</h4>
          <div className="no-carrier">
            <p>🏠 Livraison locale</p>
            <small>Pas de transporteur spécifié (livraison gratuite)</small>
          </div>
        </div>
      )}

      {/* Tarification (si disponible) */}
      {tarif ? (
        <div className="delivery-tarif">
          <h4>Frais de Livraison</h4>
          <div className="tarif-info">
            <div className="tarif-amount">
              <span className="amount">{tarif.amount.toLocaleString()} XOF</span>
            </div>
            <div className="tarif-details">
              <p><strong>Délai :</strong> {tarif.deliveryTime}</p>
              <p><strong>Devise :</strong> {tarif.currency}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="delivery-tarif">
          <h4>Frais de Livraison</h4>
          <div className="free-delivery">
            <p>🆓 Livraison gratuite</p>
            <small>Pas de frais de livraison appliqués</small>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3. Section Personnalisation

```typescript
interface CustomizationSectionProps {
  customization: OrderItem['customization'];
}

export const CustomizationSection: React.FC<CustomizationSectionProps> = ({ customization }) => {
  if (!customization) {
    return null;
  }

  return (
    <div className="customization-section">
      <h3>🎨 Personnalisation</h3>

      {/* Preview du design */}
      {customization.previewImageUrl && (
        <div className="design-preview">
          <h4>Aperçu du Design</h4>
          <img
            src={customization.previewImageUrl}
            alt="Aperçu de la personnalisation"
            className="preview-image"
          />
        </div>
      )}

      {/* Éléments de design par vue */}
      {customization.elementsByView && (
        <div className="design-elements">
          <h4>Éléments de Design</h4>
          {Object.entries(customization.elementsByView).map(([viewKey, elements]) => {
            const [colorId, viewId] = viewKey.split('-');
            return (
              <div key={viewKey} className="view-elements">
                <h5>Vue {viewId} (Couleur {colorId})</h5>
                <div className="elements-list">
                  {elements.map((element, index) => (
                    <div key={`${viewKey}-${index}`} className="design-element">
                      {element.type === 'text' ? (
                        <TextElementInfo element={element} />
                      ) : (
                        <ImageElementInfo element={element} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sélections de taille */}
      {customization.sizeSelections && customization.sizeSelections.length > 0 && (
        <div className="size-selections">
          <h4>Tailles Commandées</h4>
          <div className="sizes-grid">
            {customization.sizeSelections.map((size, index) => (
              <div key={index} className="size-item">
                <span className="size-name">{size.size}</span>
                <span className="size-quantity">x{size.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TextElementInfo: React.FC<{ element: any }> = ({ element }) => (
  <div className="text-element">
    <p><strong>Texte :</strong> {element.text}</p>
    <p><strong>Police :</strong> {element.fontFamily} ({element.fontSize}px)</p>
    <p><strong>Couleur :</strong>
      <span
        className="color-swatch"
        style={{ backgroundColor: element.color }}
      ></span>
      {element.color}
    </p>
    <p><strong>Position :</strong> X: {element.x}, Y: {element.y}</p>
  </div>
);

const ImageElementInfo: React.FC<{ element: any }> = ({ element }) => (
  <div className="image-element">
    <p><strong>Type :</strong> Image</p>
    {element.imageUrl && (
      <img
        src={element.imageUrl}
        alt="Élément d'image"
        className="element-image"
      />
    )}
    <p><strong>Dimensions :</strong> {element.width} x {element.height}</p>
    <p><strong>Position :</strong> X: {element.x}, Y: {element.y}</p>
  </div>
);
```

### 4. Service API

```typescript
class OrderService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3004';
  }

  async getOrderById(orderId: number): Promise<OrderDetailsResponse> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async retryPayment(orderNumber: string, paymentMethod?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/retry-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod }),
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getPaymentAttempts(orderNumber: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/payment-attempts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## 🎯 Cas d'Utilisation

### 1. Commande avec Transporteur (Livraison Standard)

```json
{
  "delivery_info": {
    "deliveryType": "city",
    "location": {
      "type": "city",
      "cityId": "1",
      "cityName": "Dakar",
      "countryCode": "SN",
      "countryName": "Sénégal"
    },
    "transporteur": {
      "id": "5",
      "name": "DHL Express",
      "logo": "https://api.printalma.com/uploads/logos/dhl.png",
      "phone": "+221338221234",
      "status": "active"
    },
    "tarif": {
      "id": "23",
      "amount": 3000,
      "currency": "XOF",
      "deliveryTime": "24-48 heures"
    }
  }
}
```

### 2. Commande sans Transporteur (Sénégal - Livraison Locale)

```json
{
  "delivery_info": {
    "deliveryType": "city",
    "location": {
      "type": "city",
      "cityId": "1",
      "cityName": "Dakar",
      "countryCode": "SN",
      "countryName": "Sénégal"
    }
    // Pas de transporteur ni de tarif
  }
}
```

### 3. Commande Internationale

```json
{
  "delivery_info": {
    "deliveryType": "international",
    "location": {
      "type": "international",
      "zoneId": "EU-001",
      "zoneName": "Europe Union",
      "countryCode": "FR",
      "countryName": "France"
    },
    "transporteur": {
      "id": "12",
      "name": "FedEx International",
      "logo": "https://api.printalma.com/uploads/logos/fedex.png",
      "status": "active"
    },
    "tarif": {
      "id": "156",
      "amount": 25000,
      "currency": "XOF",
      "deliveryTime": "5-7 jours"
    }
  }
}
```

---

## 🎨 Styles CSS Recommandés

```css
.order-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.delivery-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.delivery-location h4,
.delivery-carrier h4,
.delivery-tarif h4 {
  margin-bottom: 12px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.location-badge {
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 12px;
  font-weight: 500;
}

.location-details ul {
  list-style: none;
  padding: 0;
}

.location-details li {
  padding: 4px 0;
  color: #666;
}

.carrier-info {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
}

.carrier-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.carrier-logo {
  width: 60px;
  height: 40px;
  object-fit: contain;
}

.carrier-details {
  flex: 1;
}

.carrier-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.carrier-phone {
  color: #666;
  font-size: 14px;
}

.status-badge.active {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tarif-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e9ecef;
  padding: 16px;
  border-radius: 8px;
}

.tarif-amount {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.free-delivery {
  text-align: center;
  background: #d4edda;
  color: #155724;
  padding: 20px;
  border-radius: 8px;
}

.customization-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-image {
  max-width: 300px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.view-elements {
  margin-top: 16px;
}

.elements-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.design-element {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  background: #f8f9fa;
}

.sizes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.size-item {
  text-align: center;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
}

.size-name {
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}

.size-quantity {
  color: #666;
  font-size: 14px;
}
```

---

## 🔧 Bonnes Pratiques

### 1. Gestion des États
```typescript
// Gestion centralisée des états de commande
const ORDER_STATUSES = {
  PENDING: { label: 'En attente', color: '#ffc107', icon: '⏳' },
  CONFIRMED: { label: 'Confirmée', color: '#17a2b8', icon: '✅' },
  PROCESSING: { label: 'En traitement', color: '#007bff', icon: '🔄' },
  SHIPPED: { label: 'Expédiée', color: '#6f42c1', icon: '📦' },
  DELIVERED: { label: 'Livrée', color: '#28a745', icon: '🎯' },
  CANCELLED: { label: 'Annulée', color: '#dc3545', icon: '❌' }
};

const PAYMENT_STATUSES = {
  PENDING: { label: 'En attente', color: '#ffc107', icon: '⏳' },
  PAID: { label: 'Payé', color: '#28a745', icon: '✅' },
  FAILED: { label: 'Échoué', color: '#dc3545', icon: '❌' },
  REFUNDED: { label: 'Remboursé', color: '#6c757d', icon: '💰' }
};
```

### 2. Validation des Données
```typescript
const validateOrderData = (order: OrderData): string[] => {
  const errors: string[] = [];

  if (!order.orderNumber) errors.push('Numéro de commande manquant');
  if (!order.customer_info?.email) errors.push('Email client manquant');
  if (!order.order_items || order.order_items.length === 0) {
    errors.push('Aucun article dans la commande');
  }

  return errors;
};
```

### 3. Optimisation des Performances
```typescript
// React.memo pour éviter les re-rendus inutiles
const DeliverySection = React.memo<DeliverySectionProps>(({ deliveryInfo }) => {
  // ... composant
});

// useMemo pour les calculs complexes
const orderTotal = useMemo(() => {
  return order.order_items.reduce((sum, item) => sum + item.totalPrice, 0) + (order.deliveryFee || 0);
}, [order.order_items, order.deliveryFee]);
```

---

## 📱 Gestion des Erreurs

### 1. Erreurs Courantes

```typescript
const handleOrderErrors = (error: any) => {
  if (error.status === 404) {
    return 'Commande non trouvée';
  }
  if (error.status === 403) {
    return 'Accès non autorisé à cette commande';
  }
  if (error.status === 401) {
    return 'Session expirée. Veuillez vous reconnecter';
  }
  return 'Erreur lors du chargement de la commande';
};
```

### 2. États de Chargement

```typescript
const LoadingStates = {
  ORDER_LOADING: 'Chargement de la commande...',
  RETRY_PAYMENT_LOADING: 'Tentative de paiement en cours...',
  UPDATING_STATUS: 'Mise à jour du statut...'
};
```

---

## 🚀 Tests Recommandés

### 1. Tests Unitaires

```typescript
describe('DeliverySection', () => {
  it('should display carrier information when available', () => {
    const mockDeliveryInfo = {
      deliveryType: 'city',
      location: { type: 'city', cityName: 'Dakar' },
      transporteur: { id: '1', name: 'DHL', status: 'active' },
      tarif: { amount: 3000, currency: 'XOF' }
    };

    render(<DeliverySection deliveryInfo={mockDeliveryInfo} />);

    expect(screen.getByText('DHL')).toBeInTheDocument();
    expect(screen.getByText('3,000 XOF')).toBeInTheDocument();
  });

  it('should display free delivery when no carrier', () => {
    const mockDeliveryInfo = {
      deliveryType: 'city',
      location: { type: 'city', cityName: 'Dakar' }
      // No carrier or tarif
    };

    render(<DeliverySection deliveryInfo={mockDeliveryInfo} />);

    expect(screen.getByText('Livraison gratuite')).toBeInTheDocument();
    expect(screen.getByText('Pas de transporteur spécifié')).toBeInTheDocument();
  });
});
```

### 2. Tests d'Intégration

```typescript
describe('OrderDetailsPage', () => {
  it('should load and display order details', async () => {
    const mockOrderResponse = {
      success: true,
      data: { /* mock order data */ }
    };

    jest.spyOn(OrderService.prototype, 'getOrderById')
      .mockResolvedValue(mockOrderResponse);

    render(<OrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Détails de la commande')).toBeInTheDocument();
    });
  });
});
```

---

## 📚 Références

### Documentation Reliée
- `GUIDE_CUSTOMISATION_FRONTEND.md` - Guide de personnalisation
- `GUIDE_FRONTEND_DELIVERY_INTEGRATION.md` - Guide d'intégration livraison
- Documentation Swagger disponible sur `/api` en développement

### Support
- Issues GitHub pour les bugs et améliorations
- Documentation technique dans le wiki du projet
- Support via le canal Discord du projet

---

## 🎯 Résumé

Ce guide fournit une implémentation complète pour afficher les détails de commande :

1. **Architecture robuste** : Gestion de tous les cas de livraison
2. **Interface utilisateur complète** : Affichage clair de toutes les informations
3. **Gestion des erreurs** : Messages explicites et états de chargement
4. **Support multilingue** : Structure adaptable pour l'internationalisation
5. **Performance optimisée** : Composants memoizés et rendu conditionnel
6. **Tests complets** : Couverture unitaire et d'intégration
7. **Accessibilité** : Structure sémantique et contrastes adaptés

L'implémentation est conçue pour être évolutive et maintenable, avec une séparation claire des responsabilités et une gestion d'état optimisée.