# 📚 Guide d'Intégration Frontend - API de Commandes Printalma

## 🎯 Objectif

Ce guide aide les développeurs frontend à intégrer correctement l'API de commandes de Printalma, en particulier pour le **guest checkout** (commandes sans authentification).

## 🚨 Problèmes Courants et Solutions

### ❌ Problème 1: `productId: 0`
**Erreur**: `Foreign key constraint violated on the constraint: OrderItem_productId_fkey`

**Cause**: Le frontend envoie `productId: 0` qui n'existe pas dans la base de données.

**Solution**: Toujours vérifier que le productId est valide avant d'envoyer la commande.

## 🔌 API Endpoints

### 1. Guest Checkout (Sans authentification)
```http
POST /orders/guest
Content-Type: application/json
```

### 2. Authenticated Checkout (Avec authentification)
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## 📋 Structure des Données

### ShippingDetails
```typescript
interface ShippingDetails {
  firstName: string;     // Prénom
  lastName: string;      // Nom de famille
  street: string;        // Adresse
  city: string;          // Ville
  region: string;        // Région
  postalCode: string;    // Code postal
  country: string;       // Pays
}
```

### OrderItem
```typescript
interface OrderItem {
  productId: number;     // ⚠️ DOIT être > 0 et exister dans la BDD
  quantity: number;      // Quantité (>= 1)
  size?: string;         // Taille (optionnel)
  color?: string;        // Couleur (optionnel)
  colorId?: number;      // ID de la couleur (optionnel)
  unitPrice?: number;    // Prix unitaire (optionnel)
}
```

### CreateOrderRequest
```typescript
interface CreateOrderRequest {
  shippingDetails: ShippingDetails;
  phoneNumber: string;
  notes?: string;
  orderItems: OrderItem[];
  paymentMethod: 'PAYTECH' | 'CASH_ON_DELIVERY' | 'OTHER';
  initiatePayment: boolean;
}
```

## ✅ Exemple de Requête Valide

```javascript
const orderData = {
  shippingDetails: {
    firstName: "Awa",
    lastName: "Ndiaye",
    street: "123 Avenue Bourguiba",
    city: "Dakar",
    region: "Dakar",
    postalCode: "12345",
    country: "Sénégal"
  },
  phoneNumber: "+221771234567",
  notes: "Livraison après 18h",
  orderItems: [{
    productId: 1,  // ⚠️ Doit être un ID valide (> 0)
    quantity: 2,
    size: "L",
    color: "Noir",
    colorId: 1,
    unitPrice: 5000
  }],
  paymentMethod: "CASH_ON_DELIVERY",
  initiatePayment: false
};
```

## 🎯 Étapes d'Intégration

### 1. Récupérer les produits disponibles
```javascript
// Récupérer la liste des produits
const response = await fetch('http://localhost:3004/products');
const products = await response.json();

// Exemple de structure de produit
// {
//   "id": 1,
//   "name": "T-Shirt Paytech Test 1",
//   "price": 5000,
//   "stock": 100,
//   "status": "PUBLISHED",
//   ...
// }
```

### 2. Valider le productId
```javascript
function validateProductId(productId) {
  // ⚠️ NE JAMAIS envoyer productId: 0
  if (!productId || productId <= 0) {
    throw new Error('Invalid productId: Must be greater than 0');
  }

  // Optionnel: Vérifier que le produit existe
  const product = products.find(p => p.id === productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  return productId;
}
```

### 3. Créer la commande
```javascript
async function createGuestOrder(orderData) {
  // Validation des IDs
  orderData.orderItems.forEach(item => {
    validateProductId(item.productId);
  });

  try {
    const response = await fetch('http://localhost:3004/orders/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Order creation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
}
```

## 🔍 Liste des Produits Actuels

| ID | Nom | Prix | Stock | Statut |
|----|-----|------|-------|--------|
| 1 | T-Shirt Paytech Test 1 | 5000 FCFA | 100 | PUBLISHED |
| 2 | T-Shirt Paytech Test 2 | 7500 FCFA | 50 | PUBLISHED |
| 3 | Tshirt | 6000 FCFA | 0 | PUBLISHED |

## 🚨 Erreurs Fréquentes

### 1. `productId: 0`
```javascript
// ❌ Incorrect
productId: Number(cartItem.id) || 0

// ✅ Correct
productId: Number(cartItem.id)
if (!productId || productId <= 0) {
  throw new Error('Invalid product ID');
}
```

### 2. Méthode de paiement invalide
```javascript
// ❌ Incorrect
paymentMethod: 'CASH'  // N'existe pas

// ✅ Correct
paymentMethod: 'CASH_ON_DELIVERY'
```

### 3. Champs manquants
```javascript
// ❌ Incorrect - shippingDetails incomplet
shippingDetails: {
  firstName: "Awa"
  // manque lastName, street, city, etc.
}

// ✅ Correct - tous les champs requis
shippingDetails: {
  firstName: "Awa",
  lastName: "Ndiaye",
  street: "123 Avenue...",
  city: "Dakar",
  region: "Dakar",
  postalCode: "12345",
  country: "Sénégal"
}
```

## 🎨 Code Complet d'Exemple

```javascript
// orderService.js
class OrderService {
  constructor() {
    this.baseUrl = 'http://localhost:3004';
  }

  async createGuestOrder(orderData) {
    // Validation
    this.validateOrderData(orderData);

    try {
      const response = await fetch(`${this.baseUrl}/orders/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Order creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Order creation error:', error);
      throw error;
    }
  }

  validateOrderData(orderData) {
    // Valider shippingDetails
    if (!orderData.shippingDetails) {
      throw new Error('Shipping details are required');
    }

    const { firstName, lastName, street, city, region, postalCode, country } = orderData.shippingDetails;
    if (!firstName || !lastName || !street || !city || !region || !postalCode || !country) {
      throw new Error('All shipping fields are required');
    }

    // Valider orderItems
    if (!orderData.orderItems || orderData.orderItems.length === 0) {
      throw new Error('At least one order item is required');
    }

    orderData.orderItems.forEach((item, index) => {
      if (!item.productId || item.productId <= 0) {
        throw new Error(`Invalid productId in item ${index}: ${item.productId}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid quantity in item ${index}: ${item.quantity}`);
      }
    });

    // Valider phoneNumber
    if (!orderData.phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Valider paymentMethod
    const validMethods = ['PAYTECH', 'CASH_ON_DELIVERY', 'OTHER'];
    if (!validMethods.includes(orderData.paymentMethod)) {
      throw new Error(`Invalid payment method: ${orderData.paymentMethod}`);
    }
  }
}

export default new OrderService();
```

## 📞 Support

En cas de problème :
1. Vérifier les logs du serveur backend
2. Valider tous les productId avant envoi
3. S'assurer que tous les champs requis sont présents
4. Tester avec les exemples fournis dans ce guide

---

**Dernière mise à jour**: 29/10/2025
**Version**: 1.0