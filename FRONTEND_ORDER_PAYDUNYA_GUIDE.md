# Guide d'Intégration Frontend - Système de Commandes et Paiement Paydunya 🛒️

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration requise](#configuration-requise)
3. [Endpoints API](#endpoints-api)
4. [Structure des données](#structure-des-données)
5. [Flux de création de commande](#flux-de-création-de-commande)
6. [Intégration du paiement Paydunya](#intégration-du-paiement-paydunya)
7. [Exemples de code complets](#exemples-de-code-complets)
8. [Gestion des erreurs](#gestion-des-erreurs)
9. [Tests et validation](#tests-et-validation)
10. [Checklist de déploiement](#checklist-de-déploiement)

---

## 🎯 Vue d'ensemble

Ce guide décrit comment intégrer le système de commandes et le paiement Paydunya dans votre application frontend PrintAlma.

### Architecture du système

```
Frontend (Port 3001)
    ↓ API Calls (JSON)
Backend API (Port 3004)
    ↓ Traitement commande
Base de données
    ↓ Initialisation Paydunya
Paydunya API (Sandbox/Production)
    ↓ Paiement utilisateur
    ↓ Webhook de confirmation
Backend → Mise à jour statut
```

---

## ⚙️ Configuration requise

### 1. Variables d'environnement

```bash
# .env.local
REACT_APP_API_URL=http://localhost:3004
REACT_APP_PAYDUNYA_MODE=sandbox  # ou 'production'
```

### 2. Configuration API

```typescript
// config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  PAYDUNYA_MODE: process.env.REACT_APP_PAYDUNYA_MODE || 'sandbox',
  ENDPOINTS: {
    ORDERS: '/orders/guest',
    PAYDUNYA_STATUS: '/paydunya/status',
    PRODUCTS: '/products',
    PUBLIC_VENDOR_PRODUCTS: '/public/vendor-products'
  }
};
```

### 3. Dépendances recommandées

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react-router-dom": "^6.8.0",
    "@hookform/resolvers": "^3.3.0",
    "react-hook-form": "^7.47.0",
    "react-query": "^3.39.0",
    "date-fns": "^2.30.0"
  }
}
```

---

## 🔌 Endpoints API

### 1. Création de commande (Guest)

```http
POST /orders/guest
Content-Type: application/json
```

### 2. Vérification du statut de paiement

```http
GET /paydunya/status/{token}
```

### 3. Récupération des produits

```http
GET /public/vendor-products?adminProductName=Tshirt
```

---

## 📊 Structure des données

### 1. Formulaire de commande

```typescript
interface OrderFormData {
  // Informations client
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  // Adresse de livraison
  shippingDetails: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Articles
  orderItems: {
    productId: number;
    quantity: number;
    unitPrice?: number;
    size?: string;
    color?: string;
    colorId?: number;
  }[];

  // Options de paiement
  paymentMethod: 'PAYDUNYA' | 'PAYTECH' | 'CASH_ON_DELIVERY';
  initiatePayment: boolean;
  notes?: string;
}
```

### 2. Article du panier

```typescript
interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorId?: number;
  image?: string;
  vendorId?: number;
}
```

### 3. Réponse de création de commande

```typescript
interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    totalAmount: number;
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
    paymentMethod: string;
    payment: {
      token: string;
      paymentUrl?: string;
    };
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    orderItems: OrderItem[];
  };
}
```

---

## 🛒️ Flux de création de commande

### 1. Hook du panier

```typescript
// hooks/useCart.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorId?: number;
  image?: string;
  vendorId?: number;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: any, quantity = 1, options = {}) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.productId === product.id &&
        item.size === options.size &&
        item.color === options.color
      );

      if (existingItem) {
        // Mettre à jour la quantité
        return prevItems.map(item =>
          item.productId === product.id &&
          item.size === options.size &&
          item.color === options.color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Ajouter nouvel article
        return [...prevItems, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.mainImageUrl || product.image,
          vendorId: product.vendorId,
          ...options
        }];
      }
    });

    toast.success(`${product.name} ajouté au panier`);
  }, []);

  const removeFromCart = useCallback((productId: number, options = {}) => {
    setItems(prevItems => prevItems.filter(item =>
      !(item.productId === productId &&
        item.size === options.size &&
        item.color === options.color)
    ));

    toast.success('Article retiré du panier');
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, options = {}) => {
    if (quantity <= 0) {
      removeFromCart(productId, options);
      return;
    }

    setItems(prevItems => prevItems.map(item =>
      item.productId === productId &&
      item.size === options.size &&
      item.color === options.color
        ? { ...item, quantity }
        : item
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalAmount = useCallback(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  };
};
```

### 2. Formulaire de commande

```jsx
// components/OrderForm.jsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../services/orderService';
import { initiatePaydunyaPayment } from '../services/paymentService';

const OrderForm = () => {
  const { items, getTotalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm();

  const totalAmount = getTotalAmount();

  const onSubmit = async (data) => {
    if (items.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    setLoading(true);

    try {
      // Préparer les articles de commande
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        size: item.size,
        color: item.color,
        colorId: item.colorId
      }));

      const completeOrderData = {
        ...data,
        orderItems,
        totalAmount,
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true
      };

      const response = await createOrder(completeOrderData);

      if (response.success && response.data.payment?.token) {
        setOrderData(response.data);

        // Rediriger vers Paydunya
        const paymentUrl = `https://${
          response.data.payment.mode === 'test' ? 'paydunya.com/sandbox' : 'paydunya.com'
        }/checkout/invoice/${response.data.payment.token}`;

        window.location.href = paymentUrl;
      } else {
        throw new Error('Erreur lors de la création de la commande');
      }
    } catch (error) {
      console.error('Erreur commande:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form">
      <h2>Finaliser votre commande</h2>

      {/* Récapitulatif du panier */}
      <div className="cart-summary">
        <h3>Récapitulatif ({getTotalItems()} article{getTotalItems() > 1 ? 's' : ''})</h3>
        {items.map((item, index) => (
          <div key={index} className="cart-item">
            <img src={item.image} alt={item.name} className="item-image" />
            <div className="item-details">
              <h4>{item.name}</h4>
              {item.size && <span>Taille: {item.size}</span>}
              {item.color && <span>Couleur: {item.color}</span>}
              <p>{item.quantity} × {item.price} XOF = {item.quantity * item.price} XOF</p>
            </div>
          </div>
        ))}
        <div className="cart-total">
          <strong>Total: {totalAmount.toLocaleString()} XOF</strong>
        </div>
      </div>

      {/* Formulaire client et livraison */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-section">
          <h3>Informations personnelles</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <Controller
                name="customerInfo.firstName"
                control={control}
                rules={{ required: 'Prénom requis' }}
                render={({ field }) => (
                  <input {...field} placeholder="Prénom" />
                )}
              />
            </div>

            <div className="form-group">
              <label>Nom *</label>
              <Controller
                name="customerInfo.lastName"
                control={control}
                rules={{ required: 'Nom requis' }}
                render={({ field }) => (
                  <input {...field} placeholder="Nom" />
                )}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <Controller
                name="customerInfo.email"
                control={control}
                rules={{
                  required: 'Email requis',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email invalide'
                  }
                }}
                render={({ field }) => (
                  <input {...field} type="email" placeholder="email@example.com" />
                )}
              />
            </div>

            <div className="form-group">
              <label>Téléphone *</label>
              <Controller
                name="customerInfo.phone"
                control={control}
                rules={{
                  required: 'Téléphone requis',
                  pattern: {
                    value: /^[+]?[0-9]{9,15}$/,
                    message: 'Format de téléphone invalide'
                  }
                }}
                render={({ field }) => (
                  <input {...field} type="tel" placeholder="+22177xxxxxxx" />
                )}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Adresse de livraison</h3>

          <div className="form-group">
            <label>Adresse *</label>
            <Controller
              name="shippingDetails.street"
              control={control}
              rules={{ required: 'Adresse requise' }}
              render={({ field }) => (
                <input {...field} placeholder="123 Rue du Commerce" />
              )}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ville *</label>
              <Controller
                name="shippingDetails.city"
                control={control}
                rules={{ required: 'Ville requise' }}
                render={({ field }) => (
                  <input {...field} placeholder="Dakar" />
                )}
              />
            </div>

            <div className="form-group">
              <label>Code postal *</label>
              <Controller
                name="shippingDetails.postalCode"
                control={control}
                rules={{ required: 'Code postal requis' }}
                render={({ field }) => (
                  <input {...field} placeholder="10000" />
                )}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Pays *</label>
            <Controller
              name="shippingDetails.country"
              control={control}
              rules={{ required: 'Pays requis' }}
              render={({ field }) => (
                <input {...field} placeholder="Sénégal" />
              )}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Notes (optionnel)</h3>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea {...field} placeholder="Instructions spéciales pour la livraison..." rows={3} />
            )}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary"
          >
            {loading ? 'Traitement...' : `Commander et payer (${totalAmount.toLocaleString()} XOF)`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
```

### 3. Service de commande

```typescript
// services/orderService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface CreateOrderRequest {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingDetails: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  orderItems: {
    productId: number;
    quantity: number;
    unitPrice?: number;
    size?: string;
    color?: string;
    colorId?: number;
  }[];
  paymentMethod: 'PAYDUNYA' | 'PAYTECH' | 'CASH_ON_DELIVERY';
  initiatePayment: boolean;
  notes?: string;
  totalAmount?: number;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    payment: {
      token: string;
      paymentUrl?: string;
      mode: string;
    };
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    orderItems: any[];
  };
}

export const createOrder = async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur création commande:', error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('Erreur lors de la création de la commande');
  }
};

export const getOrderStatus = async (orderId: number) => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/orders/${orderId}`
    );
    return response.data;
  } catch (error) {
    console.error('Erreur statut commande:', error);
    throw error;
  }
};
```

---

## 💳 Intégration du paiement Paydunya

### 1. Service de paiement

```typescript
// services/paymentService.ts
import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    response_code: string;
    response_text: string;
    payment_url?: string;
    order_number?: string;
    payment_status?: string;
    total_amount?: number;
  };
}

export const getPaydunyaStatus = async (token: string): Promise<PaymentStatusResponse> => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYDUNYA_STATUS}/${token}`
    );

    return response.data;
  } catch (error) {
    console.error('Erreur statut Paydunya:', error);
    throw error;
  }
};

export const verifyPayment = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/payment/verify`,
      {
        params: { token }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    throw error;
  }
};
```

### 2. Page de succès de paiement

```jsx
// pages/PaymentSuccess.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPaydunyaStatus } from '../services/paymentService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [orderDetails, setOrderDetails] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyPaymentStatus();
    }
  }, [token]);

  const verifyPaymentStatus = async () => {
    try {
      setPaymentStatus('loading');

      // Attendre un peu pour permettre au webhook de se traiter
      setTimeout(async () => {
        const paydunyaResponse = await getPaydunyaStatus(token);

        if (paydunyaResponse.success) {
          setPaymentStatus('success');
          setOrderDetails(paydunyaResponse.data);
        } else {
          setPaymentStatus('failed');
        }
      }, 2000); // Attendre 2 secondes
    } catch (error) {
      console.error('Erreur vérification:', error);
      setPaymentStatus('error');
    }
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <div className="payment-loading">
            <div className="spinner"></div>
            <p>Vérification du paiement en cours...</p>
          </div>
        );

      case 'success':
        return (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h2>Paiement réussi !</h2>
            <p>Merci pour votre commande.</p>

            {orderDetails && (
              <div className="order-details">
                <h3>Détails de la commande</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Numéro:</span>
                    <span>{orderDetails.order_number || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Montant:</span>
                    <span>{orderDetails.total_amount?.toLocaleString() || 'N/A'} XOF</span>
                  </div>
                  <div className="detail-item">
                    <span>Statut:</span>
                    <span className="status-paid">{orderDetails.payment_status || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="actions">
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Retour à l'accueil
              </button>
              <button
                onClick={() => window.print()}
                className="btn-secondary"
              >
                Imprimer le reçu
              </button>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="payment-failed">
            <div className="error-icon">❌</div>
            <h2>Paiement échoué</h2>
            <p>Une erreur est survenue lors du traitement de votre paiement.</p>
            <p>Veuillez réessayer ou contacter le support.</p>

            <div className="actions">
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary"
              >
                Réessayer le paiement
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="payment-error">
            <div className="warning-icon">⚠️</div>
            <h2>Erreur de vérification</h2>
            <p>Impossible de vérifier le statut du paiement.</p>
            <p>Veuillez contacter le support si le problème persiste.</p>

            <div className="actions">
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary"
              >
                Retour à la commande
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="payment-status-container">
      {renderContent()}
    </div>
  );
};

export default PaymentSuccess;
```

### 3. Page d'annulation de paiement

```jsx
// pages/PaymentCancel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-cancel">
      <div className="cancel-icon">❌</div>
      <h2>Paiement annulé</h2>
      <p>Vous avez annulé le processus de paiement.</p>
      <p>Aucune commande n'a été finalisée.</p>

      <div className="actions">
        <button
          onClick={() => navigate('/checkout')}
          className="btn-primary"
        >
          Retour à la commande
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
```

### 4. Configuration du routing

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OrderForm from './components/OrderForm';
import CartSummary from './components/CartSummary';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cart" element={<CartSummary />} />
        <Route path="/checkout" element={<OrderForm />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 📦 Exemples de code complets

### 1. Composant de panier

```jsx
// components/CartSummary.jsx
import React from 'react';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';

const CartSummary = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotalAmount, getTotalItems } = useCart();

  if (getTotalItems() === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-icon">🛒️</div>
        <h3>Votre panier est vide</h3>
        <p>Ajoutez des articles à votre panier pour continuer.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Continuer vos achats
        </button>
      </div>
    );
  }

  return (
    <div className="cart-summary">
      <h2>Votre panier ({getTotalItems()} article{getTotalItems() > 1 ? 's' : ''})</h2>

      <div className="cart-items">
        {items.map((item, index) => (
          <div key={index} className="cart-item">
            <img src={item.image} alt={item.name} className="item-image" />
            <div className="item-details">
              <h4>{item.name}</h4>
              {item.size && <span className="item-badge">Taille: {item.size}</span>}
              {item.color && <span className="item-badge">Couleur: {item.color}</span>}
              <div className="item-quantity">
                <label>Quantité:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(
                    item.productId,
                    parseInt(e.target.value),
                    { size: item.size, color: item.color }
                  )}
                />
                <button
                  onClick={() => removeFromCart(
                    item.productId,
                    { size: item.size, color: item.color }
                  )}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
              <div className="item-price">
                {item.price} XOF × {item.quantity} = <strong>{item.price * item.quantity} XOF</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <div className="total-row">
          <span>Sous-total:</span>
          <span>{getTotalAmount().toLocaleString()} XOF</span>
        </div>
        <div className="total-row">
          <span>Frais de livraison:</span>
          <span>Calculé à la commande</span>
        </div>
        <div className="total-row total-main">
          <span><strong>Total:</strong></span>
          <span><strong>{getTotalAmount().toLocaleString()} XOF</strong></span>
        </div>
      </div>

      <div className="cart-actions">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Continuer vos achats
        </button>
        <button
          onClick={() => navigate('/checkout')}
          className="btn-primary"
        >
          Finaliser la commande
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
```

### 2. Hook de produits

```typescript
// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  mainImageUrl?: string;
  vendorId?: number;
  genre: string;
  categoryId: number;
  variations?: any[];
}

export const useProducts = (searchQuery?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PUBLIC_VENDOR_PRODUCTS}`;

      if (searchQuery) {
        url += `?adminProductName=${encodeURIComponent(searchQuery)}`;
      }

      const response = await axios.get(url);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts
  };
};
```

---

## ⚠️ Gestion des erreurs

### 1. Types d'erreurs et gestion

```typescript
// utils/errorHandler.ts
export const PAYMENT_ERRORS = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  INVALID_ORDER: 'Données de commande invalides',
  PAYMENT_FAILED: 'Échec du paiement',
  PAYMENT_CANCELLED: 'Paiement annulé',
  INSUFFICIENT_FUNDS: 'Fonds insuffisants',
  TECHNICAL_ERROR: 'Erreur technique temporaire',
  CART_EMPTY: 'Votre panier est vide',
  INVALID_PHONE: 'Format de numéro de téléphone invalide',
  INVALID_EMAIL: 'Format d\'email invalide'
};

export const getErrorMessage = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return message || PAYMENT_ERRORS.INVALID_ORDER;
      case 402:
        return message || PAYMENT_ERRORS.PAYMENT_FAILED;
      case 500:
        return PAYMENT_ERRORS.TECHNICAL_ERROR;
      default:
        return message || 'Une erreur est survenue';
    }
  }

  if (error.request) {
    return PAYMENT_ERRORS.NETWORK_ERROR;
  }

  return error.message || PAYMENT_ERRORS.TECHNICAL_ERROR;
};
```

### 2. Composant d'erreur globale

```jsx
// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-icon">⚠️</div>
          <h2>Une erreur est survenue</h2>
          <p>Nous sommes désolés, une erreur technique est survenue.</p>
          <details>
            <summary>Détails de l'erreur</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 🧪 Tests et validation

### 1. Tests du formulaire de commande

```typescript
// __tests__/OrderForm.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderForm from '../components/OrderForm';

// Mock du hook useCart
jest.mock('../hooks/useCart', () => ({
  useCart: () => ({
    items: [
      {
        productId: 1,
        name: 'Tshirt',
        price: 5000,
        quantity: 2,
        image: '/image.jpg'
      }
    ],
    getTotalAmount: () => 10000,
    getTotalItems: () => 2,
    clearCart: jest.fn()
  })
}));

describe('OrderForm', () => {
  test('should render form with cart items', () => {
    render(<OrderForm />);

    expect(screen.getByText(/Récapitulatif.*2 articles/)).toBeInTheDocument();
    expect(screen.getByText(/Total: 10,000 XOF/)).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    const submitButton = screen.getByRole('button', { name: /commander/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Prénom requis/)).toBeInTheDocument();
      expect(screen.getByText(/Email requis/)).toBeInTheDocument();
      expect(screen.getByText(/Téléphone requis/)).toBeInTheDocument();
    });
  });

  test('should submit valid form', async () => {
    const user = userEvent.setup();
    render(<OrderForm />);

    // Remplir le formulaire
    await user.type(screen.getByPlaceholderText(/prénom/i), 'John');
    await user.type(screen.getByPlaceholderText(/nom/i), 'Doe');
    await user.type(screen.getByPlaceholderText(/email/i), 'john@example.com');
    await user.type(screen.getByPlaceholderText(/téléphone/i), '775588836');
    await user.type(screen.getByPlaceholderText(/adresse/i), '123 Rue du Commerce');
    await user.type(screen.getByPlaceholderText(/ville/i), 'Dakar');
    await user.type(screen.getByPlaceholderText(/code postal/i), '10000');
    await user.type(screenByKeyPlaceholderText(/pays/i), 'Sénégal');

    const submitButton = screen.getByRole('button', { name: /commander/i });
    await user.click(submitButton);

    // Vérifier que le loading apparaît
    expect(screen.getByText(/Traitement.../)).toBeInTheDocument();
  });
});
```

### 2. Tests du service de paiement

```typescript
// __tests__/paymentService.test.js
import { getPaydunyaStatus } from '../services/paymentService';
import axios from 'axios';

jest.mock('axios');

describe('paymentService', () => {
  test('should return payment status', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          response_code: '00',
          response_text: 'Transaction Found',
          payment_status: 'completed',
          total_amount: 10000
        }
      }
    };

    axios.get.mockResolvedValue(mockResponse);

    const result = await getPaydunyaStatus('test_token');

    expect(result).toEqual(mockResponse.data);
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3004/paydunya/status/test_token'
    );
  });

  test('should handle payment failure', async () => {
    const mockError = new Error('Payment failed');
    axios.get.mockRejectedValue(mockError);

    await expect(getPaydunyaStatus('invalid_token')).rejects.toThrow('Payment failed');
  });
});
```

---

## ✅ Checklist de déploiement

### 🛠️ Avant de mettre en production

1. **Configuration API**
   - [ ] Mettre à jour les URLs de l'API vers le domaine de production
   - [ ] Configurer les URLs de callback HTTPS
   - [ ] Mettre à jour les clés Paydunya (mode live)

2. **Sécurité**
   - [ ] Valider toutes les entrées utilisateur
   - [ ] Implémenter la protection CSRF
   - [ ] Ajouter les headers de sécurité
   - [ ] Configurer HTTPS obligatoire

3. **Performance**
   - [ ] Optimiser les images et assets
   - [ ] Implémenter le lazy loading
   - [ ] Ajouter la gestion des erreurs
   - [ ] Mettre en cache les données statiques

4. **Monitoring**
   - [ ] Configurer Google Analytics ou équivalent
   - [ ] Ajouter le suivi des erreurs
   - [ ] Implémenter les logs de paiement
   - [ ] Configurer les webhooks Paydunya

### 🚀 Après déploiement

1. **Tests de validation**
   - [ ] Tester le flux de paiement complet
   - [ ] Vérifier les redirections
   - [ ] Tester les webhooks Paydunya
   - [ ] Valider les scénarios d'erreur

2. **Documentation**
   - [ ] Mettre à jour la documentation utilisateur
   - [ ] Créer les guides de support
   - [ ] Documenter les processus de gestion des erreurs
   - [ ] Préparer les FAQ client

3. **Support client**
   - [ ] Former l'équipe de support
   - [ ] Créer les modèles de réponse
   - [ ] Configurer les alertes de monitoring
   - [ ] Préparer les procédures de remboursement

---

## 🔗 Liens utiles

- [Documentation API Paydunya](https://developers.paydunya.com/doc/FR/introduction)
- [Guide d'intégration React](./REACT_INTEGRATION_GUIDE.md)
- [Support client PrintAlma](mailto:support@printalma.com)

---

*Ce guide est maintenu à jour avec les dernières versions de l'API. Dernière mise à jour: 04/11/2025*

**Pour toute question ou problème d'intégration, n'hésitez pas à contacter l'équipe technique de PrintAlma.*