# 🧪 GUIDE FRONTEND - TEST DÉTAILS COMMANDE & LIVRAISON

## 🎯 Objectif

Ce guide explique comment **tester l'endpoint `/orders/:id`** et **afficher les informations de livraison** de manière structurée, avec des exemples de requêtes et réponses pour faciliter le développement.

---

## 📡 Endpoints à Tester

### 1. GET /api/orders/:id - Récupérer les détails
**Authentification :** Bearer Token (JWT)

**Permissions :**
- Utilisateurs : peuvent voir seulement leurs propres commandes
- Admins : peuvent voir toutes les commandes

---

## 🔗 Étapes de Test

### Étape 1 : Préparation

#### 1.1. Authentification
```bash
# Récupérer un token JWT (via login ou test)
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "password123"
  }'

# Extraire le token de la réponse
export ORDER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 1.2. Créer une commande de test (si nécessaire)
```bash
# Créer une commande guest pour tester
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORDER_TOKEN" \
  -d '{
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "Client",
      "street": "123 Rue du Test",
      "city": "Dakar",
      "postalCode": "10000",
      "country": "Sénégal"
    },
    "phoneNumber": "+221123456789",
    "email": "test@client.com",
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "size": "M",
        "colorId": 12,
        "unitPrice": 5000
      }
    ],
    "deliveryInfo": {
      "deliveryType": "city",
      "cityId": "1",
      "cityName": "Dakar",
      "countryCode": "SN",
      "countryName": "Sénégal",
      "deliveryFee": 2500
    },
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": false
  }'
```

#### 1.3. Identifier la commande créée
```bash
# La réponse contiendra l'ID de la commande
# Exemple : orderNumber: "CMD-2024-001", id: 123
export ORDER_ID=123
```

### Étape 2 : Test de l'endpoint de détails

#### 2.1. Test avec authentification valide
```bash
# Test avec un utilisateur normal
curl -X GET http://localhost:3004/orders/$ORDER_ID \
  -H "Authorization: Bearer $ORDER_TOKEN" \
  -H "Content-Type: application/json"

# Test avec un admin (peut voir toutes les commandes)
curl -X GET http://localhost:3004/orders/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2.2. Test sans authentification (doit échouer)
```bash
# Test sans token (doit retourner 401)
curl -X GET http://localhost:3004/orders/$ORDER_ID \
  -H "Content-Type: application/json"

# Test avec token invalide (doit retourner 401)
curl -X GET http://localhost:3004/orders/$ORDER_ID \
  -H "Authorization: Bearer token_invalide" \
  -H "Content-Type: application/json"
```

#### 2.3. Test avec ID inexistant (doit échouer)
```bash
# Test avec un ID qui n'existe pas
curl -X GET http://localhost:3004/orders/999999 \
  -H "Authorization: Bearer $ORDER_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2.4. Test les permissions
```bash
# Test qu'un utilisateur ne peut pas voir la commande d'un autre
# 1. Créer deux commandes avec deux utilisateurs différents
# 2. Essayer d'accéder à la commande de l'utilisateur 1 avec le token de l'utilisateur 2
```

---

## 📊 Structure des Réponses Attendues

### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Commande récupérée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "CMD-2024-001",
    "subtotal": 10000,
    "deliveryFee": 2500,
    "totalAmount": 12500,
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "paymentMethod": "PAYDUNYA",
    "transactionId": "paydunya_test_123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:45:00Z",
    "estimatedDelivery": "2024-01-18T14:00:00Z",

    "payment_info": {
      "status": "PAID",
      "status_text": "Payé",
      "status_icon": "✅",
      "status_color": "#28A745",
      "method": "PAYDUNYA",
      "method_text": "PayDunya",
      "transaction_id": "paydunya_test_123",
      "attempts_count": 1,
      "last_attempt_at": "2024-01-15T10:35:00Z"
    },

    "customer_info": {
      "user_id": 101,
      "user_firstname": "Test",
      "user_lastname": "Client",
      "user_email": "test@client.com",
      "user_phone": "+221123456789",
      "user_role": "CLIENT"
    },

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
        "phone": "+221334567890",
        "email": "support@dhl.com"
      },
      "tarif": {
        "id": "23",
        "amount": 2500,
        "currency": "XOF",
        "deliveryTime": "24-48h"
      },
      "deliveryFee": 2500
    },

    "order_items": [
      {
        "id": 456,
        "quantity": 2,
        "unitPrice": 5000,
        "totalPrice": 10000,
        "size": "M",
        "colorId": 12,
        "color": "Noir",
        "colorCode": "#000000",
        "orderedColorHexCode": "#000000",
        "orderedColorImageUrl": "https://api.printalma.com/uploads/colors/black.png",
        "product": {
          "id": 1,
          "name": "T-shirt Premium",
          "description": "T-shirt en coton de haute qualité",
          "vendorId": 15,
          "orderedColorName": "Noir",
          "orderedColorHexCode": "#000000",
          "orderedColorImageUrl": "https://api.printalma.com/uploads/colors/black.png"
        },
        "customization": {
          "id": 789,
          "designElements": [
            {
              "id": "text_123",
              "type": "text",
              "text": "MON TEXTE",
              "x": 0.5,
              "y": 0.3,
              "width": 0.3,
              "height": 0.1,
              "rotation": 0,
              "zIndex": 1,
              "fontSize": 24,
              "fontFamily": "Arial",
              "color": "#FFFFFF",
              "fontWeight": "bold",
              "textAlign": "center"
            }
          ],
          "previewImageUrl": "https://api.printalma.com/uploads/previews/order_456_preview.png",
          "colorVariationId": 12,
          "viewId": 1,
          "sizeSelections": [
            {
              "size": "M",
              "quantity": 2
            }
          ],
          "status": "ordered",
          "isCustomized": true,
          "hasDesignElements": true
        }
      }
    ],

    "notes": "Instructions spéciales pour la livraison",
    "hasInsufficientFunds": false
  }
}
```

### Réponse Erreur (404 - Commande non trouvée)
```json
{
  "success": false,
  "message": "Commande non trouvée",
  "error": {
    "code": "ORDER_NOT_FOUND",
    "details": "Aucune commande trouvée avec l'ID 999999"
  }
}
```

### Réponse Erreur (401 - Non autorisé)
```json
{
  "success": false,
  "message": "Non autorisé",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Token invalide ou expiré"
  }
}
```

### Réponse Erreur (403 - Permissions insuffisantes)
```json
{
  "success": false,
  "message": "Permissions insuffisantes",
  "error": {
    "code": "FORBIDDEN",
    "details": "Vous n'avez pas les permissions pour voir cette commande"
  }
}
```

---

## 🎨 Implémentation Frontend

### 1. Service d'API

```typescript
// src/services/orderDetailsService.ts
export interface OrderDetailsService {
  getOrderDetails(orderId: number): Promise<OrderDetailsResponse>;
  retryPayment(orderNumber: string, paymentMethod?: string): Promise<any>;
  getPaymentAttempts(orderNumber: string): Promise<PaymentAttempt[]>;
}

export class OrderDetailsServiceImpl implements OrderDetailsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3004';
  }

  async getOrderDetails(orderId: number): Promise<OrderDetailsResponse> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trouvé');
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors du chargement');
    }

    return response.json();
  }

  async retryPayment(orderNumber: string, paymentMethod?: string): Promise<any> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/retry-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentMethod })
    });

    return response.json();
  }

  async getPaymentAttempts(orderNumber: string): Promise<PaymentAttempt[]> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/payment-attempts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }
}
```

### 2. Composant de détails de commande

```typescript
// src/components/OrderDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OrderDetailsService, OrderDetailsResponse } from '../services/orderDetailsService';

interface LoadingState {
  order: boolean;
  payment: boolean;
  retry: boolean;
}

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailsResponse['data'] | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    order: false,
    payment: false,
    retry: false
  });
  const [error, setError] = useState<string | null>(null);

  const orderDetailsService = new OrderDetailsServiceImpl();

  const loadOrderDetails = async () => {
    if (!id) return;

    try {
      setLoading(prev => ({ ...prev, order: true }));

      const response = await orderDetailsService.getOrderDetails(parseInt(id));

      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  };

  const handleRetryPayment = async () => {
    if (!order?.orderNumber) return;

    try {
      setLoading(prev => ({ ...prev, retry: true }));

      const response = await orderDetailsService.retryPayment(order.orderNumber, 'PAYDUNYA');

      if (response.success) {
        // Recharger les détails après paiement
        await loadOrderDetails();
      } else {
        setError(response.message || 'Erreur lors du paiement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(prev => ({ ...prev, retry: false }));
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  if (loading.order) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!order) return <OrderNotFound />;

  return (
    <div className="order-details-page">
      <OrderHeader order={order} />
      <PaymentSection
        paymentInfo={order.payment_info}
        onRetry={handleRetryPayment}
        isRetrying={loading.retry}
      />
      <CustomerSection customerInfo={order.customer_info} />
      <DeliverySection deliveryInfo={order.delivery_info} />
      <OrderItemsSection items={order.order_items} />
      {order.notes && <NotesSection notes={order.notes} />}
      <OrderTimeline
        created={order.created_at}
        updated={order.updated_at}
        estimatedDelivery={order.estimatedDelivery}
        status={order.status}
      />
    </div>
  );
};
```

### 3. Composant de section livraison

```typescript
// src/components/DeliverySection.tsx
import React from 'react';

interface DeliveryInfo {
  deliveryType: 'city' | 'region' | 'international';
  location?: {
    type: string;
    cityId?: string;
    cityName?: string;
    regionId?: string;
    regionName?: string;
    zoneId?: string;
    zoneName?: string;
    countryCode?: string;
    countryName?: string;
  };
  transporteur?: {
    id: string;
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
  };
  tarif?: {
    id: string;
    amount: number;
    currency: string;
    deliveryTime: string;
  };
  deliveryFee: number;
}

interface DeliverySectionProps {
  deliveryInfo: DeliveryInfo | null;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({ deliveryInfo }) => {
  if (!deliveryInfo) return null;

  const { location, transporteur, tarif } = deliveryInfo;

  return (
    <div className="delivery-section">
      <h3>🚚 Informations de Livraison</h3>

      <div className="delivery-location">
        <h4>Type de livraison</h4>
        <div className="location-type">
          <span className={`badge ${deliveryInfo.deliveryType}`}>
            {deliveryInfo.deliveryType === 'city' && '🏙️ Livraison en ville'}
            {deliveryInfo.deliveryType === 'region' && '🌍️ Livraison en région'}
            {deliveryInfo.deliveryType === 'international' && '🌍️ Livraison internationale'}
          </span>
        </div>

        {location && (
          <div className="location-details">
            <h5>Localisation</h5>
            <div className="location-info">
              <p><strong>Type :</strong> {location.type}</p>
              {location.cityName && <p><strong>Ville :</strong> {location.cityName}</p>}
              {location.regionName && <p><strong>Région :</strong> {location.regionName}</p>}
              {location.zoneName && <p><strong>Zone :</strong> {location.zoneName}</p>}
              <p><strong>Pays :</strong> {location.countryName}</p>
            </div>
          </div>
        )}
      </div>

      {transporteur && (
        <div className="delivery-carrier">
          <h4>Transporteur</h4>
          <div className="carrier-info">
            {transporteur.logo && (
              <img
                src={transporteur.logo}
                alt={transporteur.name}
                className="carrier-logo"
              />
            )}
            <div className="carrier-details">
              <h5>{transporteur.name}</h5>
              {transporteur.phone && (
                <p className="carrier-phone">📞 {transporteur.phone}</p>
              )}
              {transporteur.email && (
                <p className="carrier-email">✉️ {transporteur.email}</p>
              )}
            </div>
            <div className={`carrier-status ${transporteur.status}`}>
              {transporteur.status === 'active' ? '✅ Actif' : '❌ Inactif'}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-carrier">
          <h4>Transporteur</h4>
          <div className="free-delivery">
            <p>🆓 Livraison locale</p>
            <small>Pas de transporteur spécifié (livraison gratuite)</small>
          </div>
        </div>
      )}

      {tarif && (
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

### 4. Styles CSS

```css
/* src/components/DeliverySection.css */
.delivery-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.delivery-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.delivery-location {
  margin-bottom: 20px;
}

.location-type {
  margin-bottom: 12px;
}

.location-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.location-badge.city {
  background-color: #007bff;
}

.location-badge.region {
  background-color: #6f42c1;
}

.location-badge.international {
  background-color: #e83e8c;
}

.location-details h5 {
  margin-bottom: 12px;
  color: #333;
}

.location-info p {
  margin-bottom: 8px;
  line-height: 1.5;
}

.delivery-carrier {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-bottom: 20px;
}

.delivery-carrier h4 {
  margin-bottom: 16px;
  color: #333;
}

.carrier-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.carrier-logo {
  width: 60px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
}

.carrier-details {
  flex: 1;
}

.carrier-details h5 {
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.carrier-phone,
.carrier-email {
  margin-bottom: 4px;
  color: #666;
  font-size: 14px;
}

.carrier-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.carrier-status.active {
  background-color: #28a745;
  color: white;
}

.carrier-status.inactive {
  background-color: #dc3545;
  color: white;
}

.no-carrier {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-bottom: 20px;
}

.free-delivery {
  text-align: center;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.free-delivery p {
  margin-bottom: 4px;
  font-weight: 600;
  color: #333;
}

.free-delivery small {
  color: #666;
  font-size: 14px;
}

.delivery-tarif {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-bottom: 20px;
}

.delivery-tarif h4 {
  margin-bottom: 16px;
  color: #333;
}

.tarif-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.tarif-amount {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.tarif-details p {
  margin-bottom: 4px;
  color: #666;
}
```

---

## 🧪 Script de Test Automatisé

### test-order-details.sh
```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3004"
USER_EMAIL="test@client.com"
USER_PASSWORD="password123"

echo "🧪 DÉBUT DES TESTS - DÉTAILS COMMANDE"
echo "================================"

# Étape 1: Authentification
echo "1️⃣ Authentification..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur d'authentification"
  exit 1
fi

echo "✅ Authentification réussie"

# Étape 2: Création d'une commande de test
echo "2️⃣ Création d'une commande de test..."

ORDER_RESPONSE=$(curl -s -X POST $API_URL/orders/guest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "Client",
      "street": "123 Rue du Test",
      "city": "Dakar",
      "postalCode": "10000",
      "country": "Sénégal"
    },
    "phoneNumber": "+221123456789",
    "email": "test@client.com",
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "size": "M",
        "colorId": 12,
        "unitPrice": 5000
      }
    ],
    "deliveryInfo": {
      "deliveryType": "city",
      "cityId": "1",
      "cityName": "Dakar",
      "countryCode": "SN",
      "countryName": "Sénégal",
      "deliveryFee": 2500
    },
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": false
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
ORDER_NUMBER=$(echo $ORDER_RESPONSE | jq -r '.data.orderNumber')

if [ -z "$ORDER_ID" ]; then
  echo "❌ Erreur de création de commande"
  echo $ORDER_RESPONSE
  exit 1
fi

echo "✅ Commande créée - ID: $ORDER_ID, Numéro: $ORDER_NUMBER"

# Étape 3: Test de l'endpoint de détails
echo "3️⃣ Test de l'endpoint de détails..."

echo "Test 3.1: Récupération avec authentification valide"
DETAILS_RESPONSE=$(curl -s -X GET $API_URL/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse :"
echo $DETAILS_RESPONSE | jq '.'

# Test 3.2: Test sans authentification
echo "Test 3.2: Test sans authentification (doit échouer)..."
UNAUTHORIZED_RESPONSE=$(curl -s -X GET $API_URL/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -w "%{http_code}")

echo "Code HTTP : $UNAUTHORIZED_RESPONSE"

# Test 3.3: Test avec ID inexistant
echo "Test 3.3: Test avec ID inexistant (doit échouer)..."
NOT_FOUND_RESPONSE=$(curl -s -X GET $API_URL/orders/999999 \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{http_code}")

echo "Code HTTP : $NOT_FOUND_RESPONSE"

# Étape 4: Vérification des champs de livraison
echo "4️⃣ Vérification des champs de livraison..."

# Extraire les informations de livraison
DELIVERY_TYPE=$(echo $DETAILS_RESPONSE | jq -r '.data.delivery_info.deliveryType')
CITY_NAME=$(echo $DETAILS_RESPONSE | jq -r '.data.delivery_info.location.cityName')
TRANSPORTEUR_NAME=$(echo $DETAILS_RESPONSE | jq -r '.data.delivery_info.transporteur.name // "Non spécifié"')
TRANSPORTEUR_ID=$(echo $DETAILS_RESPONSE | jq -r '.data.delivery_info.transporteur.id // "Non spécifié"')
DELIVERY_FEE=$(echo $DETAILS_RESPONSE | jq -r '.data.delivery_info.deliveryFee')

echo "📦 Type de livraison : $DELIVERY_TYPE"
echo "🏙️ Ville : $CITY_NAME"
echo "🚚 Transporteur : $TRANSPORTEUR_NAME (ID: $TRANSPORTEUR_ID)"
echo "💰 Frais de livraison : $DELIVERY_FEE XOF"

# Vérifications
if [ "$DELIVERY_TYPE" = "city" ] && [ -z "$CITY_NAME" ]; then
  echo "❌ Erreur : Type city mais pas de nom de ville"
fi

if [ "$DELIVERY_FEE" = "null" ] && [ "$TRANSPORTEUR_NAME" = "Non spécifié" ]; then
  echo "✅ Succès : Livraison locale sans transporteur"
fi

# Étape 5: Test des options de personnalisation
echo "5️⃣ Test des options de personnalisation..."

HAS_CUSTOMIZATION=$(echo $DETAILS_RESPONSE | jq -r '.data.order_items[0].customization // false')

if [ "$HAS_CUSTOMIZATION" = "true" ]; then
  echo "✅ Personnalisation présente"
  echo "Éléments de design : $(echo $DETAILS_RESPONSE | jq -r '.data.order_items[0].customization.designElements | length')"
else
  echo "ℹ️ Pas de personnalisation"
fi

echo "================================"
echo "🎯 TESTS TERMINÉS"
echo "Commande de test : $ORDER_NUMBER (ID: $ORDER_ID)"
echo "Consultez la documentation Swagger pour plus de détails"
```

### Utilisation du script
```bash
# Rendre le script exécutable
chmod +x test-order-details.sh

# Exécuter les tests
./test-order-details.sh
```

---

## 📋 Checklists de Test

### ✅ Authentification
- [ ] Login avec identifiants valides
- [ ] Vérification du token JWT
- [ ] Gestion des erreurs d'authentification

### ✅ Création de commande
- [ ] Commande avec livraison locale (Sénégal)
- [ ] Commande avec transporteur
- [ ] Commande internationale
- [ ] Commande avec personnalisation

### ✅ Endpoint GET /orders/:id
- [ ] Récupération avec authentification valide
- [ ] Réponse avec toutes les informations requises
- [ ] Gestion des cas d'erreur (404, 401, 403)
- [ ] Test des permissions utilisateur

### ✅ Affichage des informations
- [ ] Section livraison avec transporteur
- [ ] Section livraison sans transporteur (cas Sénégal)
- [ ] Section livraison internationale
- [ ] Affichage des tarifs et délais
- [ ] Gestion des cas spéciaux

### ✅ Personnalisation
- [ ] Affichage des éléments de design
- [ ] Support multi-vues
- [ ] Aperçu des personnalisations
- [ ] Validation des données

### ✅ Interface utilisateur
- [ ] Messages d'erreur clairs
- [ ] États de chargement
- [ ] Actions utilisateur (retry paiement)
- [ ] Responsive design

---

## 🔍 Débogage et Validation

### Points de vérification dans la réponse

1. **Structure delivery_info**
   ```json
   {
     "deliveryType": "city" | "region" | "international",
     "location": {
       "type": "city" | "region" | "international",
       "cityId"?: "string",
       "cityName"?: "string",
       // ...
     }
   }
   ```

2. **Gestion des cas null**
   ```typescript
   // Toujours vérifier si delivery_info existe
   if (!orderData.delivery_info) {
     // Cas ancienne commande ou livraison locale
     return <div>Aucune information de livraison disponible</div>;
   }
   ```

3. **Validation des types de livraison**
   ```typescript
   const validDeliveryTypes = ['city', 'region', 'international'];
   if (!validDeliveryTypes.includes(deliveryInfo.deliveryType)) {
     console.error('Type de livraison invalide:', deliveryInfo.deliveryType);
   }
   ```

---

## 🚨 Erreurs Communes et Solutions

### Erreur 401 - Non autorisé
**Cause :** Token manquant, invalide ou expiré
**Solution :** Rediriger vers la page de connexion

```typescript
if (error.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### Erreur 404 - Commande non trouvée
**Cause :** ID de commande invalide
**Solution :** Afficher un message clair avec possibilité de retour

```typescript
if (error.status === 404) {
  return (
    <div className="error-container">
      <h2>Commande non trouvée</h2>
      <p>La commande que vous recherchez n'existe pas ou a été supprimée.</p>
      <button onClick={() => window.history.back()}>Retour</button>
    </div>
  );
}
```

### Erreur 403 - Permissions insuffisantes
**Cause :** L'utilisateur n'a pas le droit de voir cette commande
**Solution :** Afficher un message d'erreur explicatif

```typescript
if (error.status === 403) {
  return (
    <div className="error-container">
      <h2>Accès non autorisé</h2>
      <p>Vous n'avez pas les permissions nécessaires pour accéder à cette commande.</p>
    </div>
  );
}
```

---

## 📱 Tests de Performance

### Test de charge
- Tester avec des commandes contenant beaucoup d'articles
- Tester avec des personnalisations complexes
- Vérifier le temps de réponse de l'API

### Test de responsivité
- Tester sur mobile et desktop
- Vérifier l'affichage avec différentes tailles d'écran
- Tester les états de chargement

---

## 🎯 Résumé

Ce guide complet permet de :

1. **Tester l'endpoint** avec scénarios complets
2. **Valider les réponses** selon la structure attendue
3. **Implémenter l'affichage** robuste des informations de livraison
4. **Gérer les erreurs** de manière appropriée
5. **Supporter tous les cas** : livraison avec/sans transporteur, locale et internationale

L'implémentation frontend sera **prête pour la production** avec une gestion complète des cas de livraison spécifiques au contexte sénégalais !