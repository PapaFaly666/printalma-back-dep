# 📚 Guide d'Intégration PayTech - Printalma

## 🎯 Objectif

Ce guide résout les problèmes d'intégration PayTech pour le traitement des paiements dans Printalma.

## 🚨 Problèmes Identifiés

### ❌ Problème 1: Montant à 0
**Erreur**: `item_price doit être superieur à 100 XOF, donné: '0 XOF'`

**Cause**: Le `totalAmount` de la commande est à 0, donc PayTech refuse le paiement.

### ❌ Problème 2: URL IPN en HTTP
**Erreur**: `ipn_url doit etre en https donné: 'http://localhost:3004/paytech/ipn-callback'`

**Cause**: PayTech exige des URLs HTTPS pour l'IPN (Instant Payment Notification).

## 🔧 Solutions à Implémenter

### 1. Calculer le montant total côté frontend

#### ❌ Incorrect (actuel)
```javascript
// Ne calcule pas le totalAmount
const orderData = {
  shippingDetails: { ... },
  phoneNumber: "+221771234567",
  orderItems: [{
    productId: 1,
    quantity: 2,
    unitPrice: 5000  // Prix non utilisé dans le calcul
  }],
  // totalAmount manquant
};
```

#### ✅ Correct
```javascript
// Calculer le montant total
function calculateOrderTotal(orderItems) {
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  const shippingCost = orderItems.length > 0 ? 1500 : 0; // Frais de port
  return subtotal + shippingCost;
}

const orderData = {
  shippingDetails: { ... },
  phoneNumber: "+221771234567",
  totalAmount: calculateOrderTotal(orderItems), // 🎯 AJOUTER LE TOTAL
  orderItems: [{
    productId: 1,
    quantity: 2,
    unitPrice: 5000
  }],
  paymentMethod: "PAYTECH",
  initiatePayment: true
};
```

### 2. URL de callback pour le développement

Pour le développement local, utilisez ngrok ou un service de tunneling HTTPS :

```javascript
// URL de callback pour développement
const PAYMENT_CONFIG = {
  // En développement - utiliser ngrok ou tunneling HTTPS
  IPN_URL: "https://your-ngrok-url.ngrok.io/paytech/ipn-callback",
  SUCCESS_URL: "https://your-ngrok-url.ngrok.io/payment/success",
  CANCEL_URL: "https://your-ngrok-url.ngrok.io/payment/cancel",

  // En production - URLs HTTPS de votre domaine
  // IPN_URL: "https://votre-domaine.com/paytech/ipn-callback",
  // SUCCESS_URL: "https://votre-domaine.com/payment/success",
  // CANCEL_URL: "https://votre-domaine.com/payment/cancel"
};
```

## 📋 Structure Complète de Données

### CreateOrderRequest Complet
```typescript
interface CreateOrderRequest {
  shippingDetails: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  phoneNumber: string;
  notes?: string;
  totalAmount: number;     // 🎯 OBLIGATOIRE pour PayTech
  orderItems: OrderItem[];
  paymentMethod: 'PAYTECH' | 'CASH_ON_DELIVERY' | 'OTHER';
  initiatePayment: boolean; // 🎯 Mettre à true pour PayTech
}
```

### OrderItem
```typescript
interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;       // 🎯 OBLIGATOIRE pour le calcul
  size?: string;
  color?: string;
  colorId?: number;
}
```

## 🔌 Endpoints API à Utiliser

### 1. Récupérer les produits avec prix
```http
GET /products
Content-Type: application/json

# Réponse
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirt Paytech Test 1",
      "price": 5000,        // 🎯 Utiliser ce prix
      "stock": 100,
      "status": "PUBLISHED"
    }
  ]
}
```

### 2. Créer une commande avec PayTech
```http
POST /orders/guest
Content-Type: application/json

# Corps de la requête
{
  "shippingDetails": {
    "firstName": "Awa",
    "lastName": "Ndiaye",
    "street": "123 Avenue Bourguiba",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12345",
    "country": "Sénégal"
  },
  "phoneNumber": "+221771234567",
  "totalAmount": 11500,        // 🎯 EXEMPLE: 2 * 5000 + 1500 (frais port)
  "orderItems": [{
    "productId": 1,
    "quantity": 2,
    "unitPrice": 5000,          // 🎯 Prix unitaire du produit
    "size": "L",
    "color": "Noir",
    "colorId": 1
  }],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true
}
```

### 3. Réponse attendue avec paiement PayTech
```json
{
  "success": true,
  "message": "Commande invité créée avec succès",
  "data": {
    "id": 16,
    "orderNumber": "ORD-1761739129568",
    "totalAmount": 11500,
    "payment": {
      "token": "paytech_token_abc123",
      "redirect_url": "https://paytech.sn/payment/abc123"
    }
  }
}
```

## 🎨 Code Complet pour le Frontend

### Service de commande amélioré
```javascript
// orderService.js
class OrderService {
  constructor() {
    this.baseUrl = 'http://localhost:3004';
  }

  // 🎯 Calculer le montant total
  calculateOrderTotal(orderItems) {
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    const shippingCost = orderItems.length > 0 ? 1500 : 0;
    return subtotal + shippingCost;
  }

  async createOrderWithPayment(orderData) {
    // 🎯 Calculer le montant total si non fourni
    if (!orderData.totalAmount) {
      orderData.totalAmount = this.calculateOrderTotal(orderData.orderItems);
    }

    // Validation du montant
    if (orderData.totalAmount < 100) {
      throw new Error(`Le montant total (${orderData.totalAmount} XOF) est inférieur au minimum requis (100 XOF)`);
    }

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

      const result = await response.json();

      // 🎯 Rediriger vers PayTech si payment data disponible
      if (result.data.payment && result.data.payment.redirect_url) {
        window.location.href = result.data.payment.redirect_url;
      }

      return result;
    } catch (error) {
      console.error('❌ Order creation error:', error);
      throw error;
    }
  }

  // 🎯 Récupérer les produits avec prix
  async getProducts() {
    const response = await fetch(`${this.baseUrl}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  }
}

export default new OrderService();
```

### Hook React pour le panier
```javascript
// hooks/useCart.js
import { useState, useEffect } from 'react';
import orderService from '../services/orderService';

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await orderService.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = items.find(item => item.productId === product.id);

    if (existingItem) {
      setItems(items.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        unitPrice: product.price,    // 🎯 Prix du produit
        quantity: 1,
        size: 'L',
        color: 'Noir',
        colorId: 1
      }]);
    }
  };

  const getTotalAmount = () => {
    return orderService.calculateOrderTotal(items);
  };

  const checkout = async (shippingInfo) => {
    const orderData = {
      shippingDetails: shippingInfo,
      phoneNumber: shippingInfo.phone,
      totalAmount: getTotalAmount(),    // 🎯 Utiliser le calcul
      orderItems: items,
      paymentMethod: 'PAYTECH',
      initiatePayment: true
    };

    return await orderService.createOrderWithPayment(orderData);
  };

  return {
    items,
    products,
    addToCart,
    getTotalAmount,
    checkout
  };
};
```

## 🔧 Configuration ngrok pour le développement

### Installer ngrok
```bash
npm install -g ngrok
# ou
# Télécharger depuis https://ngrok.com/download
```

### Lancer ngrok pour le backend
```bash
ngrok http 3004
# Exemple de sortie:
# Forwarding https://abc123.ngrok.io -> http://localhost:3004
```

### Mettre à jour les URLs dans le frontend
```javascript
const config = {
  BASE_URL: 'https://abc123.ngrok.io',  // URL ngrok
  SUCCESS_URL: 'https://abc123.ngrok.io/payment/success',
  CANCEL_URL: 'https://abc123.ngrok.io/payment/cancel'
};
```

## ✅ Checklist d'Intégration

- [ ] ✅ Ajouter `totalAmount` au calcul de la commande
- [ ] ✅ Utiliser le prix unitaire des produits (`unitPrice`)
- [ ] ✅ Calculer les frais de port (1500 FCFA minimum)
- [ ] ✅ Vérifier que le montant total est ≥ 100 XOF
- [ ] ✅ Configurer les URLs HTTPS pour le développement (ngrok)
- [ ] ✅ Mettre `initiatePayment: true` pour PayTech
- [ ] ✅ Gérer la redirection vers PayTech
- [ ] ✅ Implémenter les pages de succès/échec

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du backend pour les erreurs PayTech
2. Assurez-vous que ngrok fonctionne correctement
3. Validez tous les montants avant envoi
4. Testez d'abord avec `initiatePayment: false`

---

**Dernière mise à jour**: 29/10/2025
**Version**: 1.0