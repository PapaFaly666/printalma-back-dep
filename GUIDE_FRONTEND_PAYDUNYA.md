# Guide Frontend - Intégration PayDunya Complète

## 🎯 Objectif

Ce guide explique comment intégrer complètement le système de paiement PayDunya dans votre frontend React/Next.js avec l'API backend NestJS déjà configurée.

## 📋 Prérequis

- Frontend React/Next.js avec TypeScript
- API backend disponible sur `http://localhost:3004`
- Configuration PayDunya opérationnelle (mode test/production)

---

## 🛠️ Architecture du Système

### Backend Endpoints Disponibles

| Endpoint | Méthode | Description | Authentification |
|----------|---------|-------------|-------------------|
| `/orders/guest` | POST | Créer commande (invité) | ❌ Non requise |
| `/paydunya/webhook` | POST | Webhook PayDunya (IPN) | ❌ Non requise |
| `/paydunya/status/:token` | GET | Vérifier statut paiement | ❌ Non requise |
| `/paydunya/test-config` | GET | Tester configuration PayDunya | ❌ Non requise |
| `/payment/success` | GET | Page succès redirection | ❌ Non requise |
| `/payment/cancel` | GET | Page annulation redirection | ❌ Non requise |

---

## 🚀 Étape 1: Service API Backend

### Créer le service de commande

```typescript
// src/services/orderService.ts
export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
}

export interface ShippingDetails {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
}

export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  phoneNumber: string;
  orderItems: OrderItem[];
  shippingDetails: ShippingDetails;
  paymentMethod: 'PAYDUNYA' | 'PAYTECH';
  initiatePayment: boolean;
}

export interface PaymentInfo {
  token: string;
  redirect_url: string;
  payment_url: string;
  mode: 'test' | 'live';
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    payment?: PaymentInfo;
  };
}

class OrderService {
  private baseUrl = 'http://localhost:3004';

  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la création de la commande');
      }

      return result;
    } catch (error) {
      console.error('[OrderService] Erreur:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du statut');
      }

      return await response.json();
    } catch (error) {
      console.error('[OrderService] Erreur statut:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
```

### Service de gestion des paiements

```typescript
// src/services/paymentService.ts
export interface PaymentStatus {
  success: boolean;
  data: {
    status: string;
    response_code: string;
    total_amount: number;
    payment_method: string;
  };
}

class PaymentService {
  private baseUrl = 'http://localhost:3004';

  async checkPaymentStatus(token: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/paydunya/status/${token}`);

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du paiement');
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentService] Erreur:', error);
      throw error;
    }
  }

  async testPayDunyaConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/paydunya/test-config`);
      return await response.json();
    } catch (error) {
      console.error('[PaymentService] Erreur config:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
```

---

## 🛒 Étape 2: Composant Formulaire de Commande

### Formulaire complet avec React Hook Form

```typescript
// src/components/OrderForm.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { orderService, CreateOrderRequest } from '../services/orderService';

interface OrderFormData {
  customerInfo: {
    name: string;
    email: string;
  };
  phoneNumber: string;
  shippingDetails: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  cartItems: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export const OrderForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderFormData>();

  // Exemple de panier (à adapter selon votre application)
  const cartItems = [
    {
      productId: 1,
      quantity: 1,
      unitPrice: 5000,
    }
  ];

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const orderRequest: CreateOrderRequest = {
        ...data,
        orderItems: cartItems,
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true,
      };

      const result = await orderService.createOrder(orderRequest);

      if (result.success && result.data.payment) {
        setOrderSuccess(true);
        setOrderData(result.data);

        // Redirection vers PayDunya
        setTimeout(() => {
          window.location.href = result.data.payment.payment_url;
        }, 2000);
      } else {
        throw new Error('Données de paiement incomplètes');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la commande');
      setIsLoading(false);
    }
  };

  if (orderSuccess && orderData?.payment) {
    return (
      <div className="order-success">
        <h2>🎉 Commande créée avec succès !</h2>
        <p>Numéro de commande: <strong>{orderData.orderNumber}</strong></p>
        <p>Montant: <strong>{orderData.totalAmount} FCFA</strong></p>
        <p>Redirection vers PayDunya en cours...</p>
        <a
          href={orderData.payment.payment_url}
          className="payment-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Accéder directement à la page de paiement
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="order-form">
      <h2>Finaliser ma commande</h2>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Informations client */}
      <div className="form-section">
        <h3>Informations personnelles</h3>

        <div className="form-group">
          <label>Nom complet</label>
          <input
            {...register('customerInfo.name', { required: 'Nom requis' })}
            placeholder="Votre nom complet"
          />
          {errors.customerInfo?.name && (
            <span className="error">{errors.customerInfo.name.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            {...register('customerInfo.email', {
              required: 'Email requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide'
              }
            })}
            placeholder="votre@email.com"
          />
          {errors.customerInfo?.email && (
            <span className="error">{errors.customerInfo.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Téléphone</label>
          <input
            {...register('phoneNumber', {
              required: 'Téléphone requis',
              pattern: {
                value: /^[0-9+]+$/,
                message: 'Numéro invalide'
              }
            })}
            placeholder="+221 77 123 45 67"
          />
          {errors.phoneNumber && (
            <span className="error">{errors.phoneNumber.message}</span>
          )}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="form-section">
        <h3>Adresse de livraison</h3>

        <div className="form-group">
          <label>Adresse</label>
          <input
            {...register('shippingDetails.street', { required: 'Adresse requise' })}
            placeholder="Rue, numéro, appartement..."
          />
          {errors.shippingDetails?.street && (
            <span className="error">{errors.shippingDetails.street.message}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ville</label>
            <input
              {...register('shippingDetails.city', { required: 'Ville requise' })}
              placeholder="Dakar"
            />
            {errors.shippingDetails?.city && (
              <span className="error">{errors.shippingDetails.city.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Code postal</label>
            <input
              {...register('shippingDetails.postalCode', { required: 'Code postal requis' })}
              placeholder="10000"
            />
            {errors.shippingDetails?.postalCode && (
              <span className="error">{errors.shippingDetails.postalCode.message}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Pays</label>
          <select
            {...register('shippingDetails.country', { required: 'Pays requis' })}
          >
            <option value="">Sélectionner un pays</option>
            <option value="Sénégal">Sénégal</option>
            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
            <option value="Mali">Mali</option>
            <option value="Burkina Faso">Burkina Faso</option>
          </select>
          {errors.shippingDetails?.country && (
            <span className="error">{errors.shippingDetails.country.message}</span>
          )}
        </div>
      </div>

      {/* Récapitulatif commande */}
      <div className="order-summary">
        <h3>Récapitulatif</h3>
        <div className="summary-items">
          {cartItems.map((item, index) => (
            <div key={index} className="summary-item">
              <span>Produit {item.productId}</span>
              <span>{item.quantity} × {item.unitPrice} FCFA</span>
            </div>
          ))}
        </div>
        <div className="summary-total">
          <strong>Total: {totalAmount} FCFA</strong>
        </div>
      </div>

      {/* Bouton de paiement */}
      <button
        type="submit"
        className="payment-button"
        disabled={isLoading}
      >
        {isLoading ? 'Traitement en cours...' : `Payer ${totalAmount} FCFA avec PayDunya`}
      </button>

      <p className="payment-info">
        🔒 Paiement sécurisé via PayDunya<br/>
        Vous serez redirigé vers la page de paiement PayDunya
      </p>
    </form>
  );
};
```

---

## 🎨 Étape 3: Styles CSS

### Styles pour le formulaire

```css
/* src/components/OrderForm.css */
.order-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.order-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin-bottom: 15px;
  color: #555;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.error-message {
  background: #fdecea;
  border: 1px solid #f5b7b1;
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.order-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.summary-items {
  margin-bottom: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.summary-total {
  text-align: right;
  font-size: 18px;
  color: #27ae60;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.payment-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.payment-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.payment-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.payment-info {
  text-align: center;
  margin-top: 15px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.order-success {
  text-align: center;
  padding: 40px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 10px;
}

.order-success h2 {
  color: #155724;
  margin-bottom: 20px;
}

.payment-link {
  display: inline-block;
  background: #28a745;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 20px;
}

.payment-link:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .order-form {
    padding: 15px;
  }
}
```

---

## 📊 Étape 4: Page de Suivi de Commande

### Composant de suivi de statut

```typescript
// src/components/OrderTracker.tsx
import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

interface OrderTrackerProps {
  paymentToken: string;
  orderNumber: string;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  paymentToken,
  orderNumber
}) => {
  const [status, setStatus] = useState<string>('pending');
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkPaymentStatus = async () => {
    setIsChecking(true);
    try {
      const result = await paymentService.checkPaymentStatus(paymentToken);
      setStatus(result.data.status);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (paymentToken) {
      checkPaymentStatus();

      // Vérifier automatiquement toutes les 30 secondes
      const interval = setInterval(checkPaymentStatus, 30000);

      return () => clearInterval(interval);
    }
  }, [paymentToken]);

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Paiement réussi ✅';
      case 'pending': return 'Paiement en cours ⏳';
      case 'cancelled': return 'Paiement annulé ❌';
      default: return 'Statut inconnu';
    }
  };

  return (
    <div className="order-tracker">
      <h3>Suivi de commande #{orderNumber}</h3>

      <div className="status-display">
        <div
          className="status-indicator"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="status-text">{getStatusText()}</span>
      </div>

      {status === 'pending' && (
        <div className="pending-actions">
          <p>Votre paiement est en cours de traitement.</p>
          <button
            onClick={checkPaymentStatus}
            disabled={isChecking}
            className="refresh-button"
          >
            {isChecking ? 'Vérification...' : 'Actualiser le statut'}
          </button>

          {lastCheck && (
            <p className="last-check">
              Dernière vérification: {lastCheck.toLocaleTimeString()}
            </p>
          )}

          <div className="payment-options">
            <a
              href={`https://paydunya.com/sandbox-checkout/invoice/${paymentToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="payment-link"
            >
              Revenir à la page de paiement
            </a>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="success-message">
          <h4>🎉 Paiement réussi !</h4>
          <p>Votre commande est confirmée et sera traitée prochainement.</p>
          <p>Vous recevrez une confirmation par email.</p>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="cancelled-message">
          <h4>❌ Paiement annulé</h4>
          <p>Le paiement a été annulé.</p>
          <p>Aucun montant n'a été débité de votre compte.</p>
          <button className="retry-button">
            Réessayer le paiement
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Étape 5: Gestion des Redirections

### Hook de gestion des retours PayDunya

```typescript
// src/hooks/usePaymentRedirect.ts
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaymentResult {
  status: 'success' | 'cancel' | 'error';
  token?: string;
  message?: string;
}

export const usePaymentRedirect = (): PaymentResult => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<PaymentResult>({
    status: 'error',
    message: 'Résultat de paiement inconnu'
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (window.location.pathname === '/payment/success') {
      setResult({
        status: 'success',
        token: token || undefined,
        message: 'Paiement effectué avec succès'
      });
    } else if (window.location.pathname === '/payment/cancel') {
      setResult({
        status: 'cancel',
        token: token || undefined,
        message: 'Paiement annulé par l\'utilisateur'
      });
    } else {
      setResult({
        status: 'error',
        message: 'Page de retour invalide'
      });
    }
  }, [searchParams]);

  return result;
};
```

### Page de retour après paiement

```typescript
// src/pages/PaymentReturn.tsx
import React from 'react';
import { usePaymentRedirect } from '../hooks/usePaymentRedirect';
import { OrderTracker } from '../components/OrderTracker';

export const PaymentReturn: React.FC = () => {
  const paymentResult = usePaymentRedirect();

  const renderContent = () => {
    switch (paymentResult.status) {
      case 'success':
        return (
          <div className="payment-success">
            <h1>🎉 Paiement Réussi !</h1>
            <p>{paymentResult.message}</p>
            {paymentResult.token && (
              <OrderTracker
                paymentToken={paymentResult.token}
                orderNumber="ORD-XXXXX" // À récupérer depuis le contexte
              />
            )}
          </div>
        );

      case 'cancel':
        return (
          <div className="payment-cancelled">
            <h1>❌ Paiement Annulé</h1>
            <p>{paymentResult.message}</p>
            <div className="cancel-actions">
              <button className="retry-button">
                Réessayer le paiement
              </button>
              <button className="home-button">
                Retour à l'accueil
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="payment-error">
            <h1>⚠️ Erreur</h1>
            <p>{paymentResult.message}</p>
            <button className="home-button">
              Retour à l'accueil
            </button>
          </div>
        );
    }
  };

  return (
    <div className="payment-return-container">
      {renderContent()}
    </div>
  );
};
```

---

## ⚙️ Étape 6: Configuration du Router

### Configuration des routes (React Router)

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrderForm } from './components/OrderForm';
import { PaymentReturn } from './pages/PaymentReturn';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commander" element={<OrderForm />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/mes-commandes" element={<MyOrders />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

---

## 🔧 Étape 7: Variables d'Environnement

### Configuration pour le frontend

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3004
NEXT_PUBLIC_PAYDUNYA_MODE=test
```

### Service avec variables d'environnement

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3004';
const PAYDUNYA_MODE = process.env.NEXT_PUBLIC_PAYDUNYA_MODE || 'test';

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // ... méthodes du service
}
```

---

## 📱 Étape 8: Optimisations Mobiles

### Design responsive

```css
/* Mobile-first styles */
@media (max-width: 768px) {
  .order-form {
    padding: 15px;
    margin: 10px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .payment-button {
    font-size: 14px;
    padding: 12px;
  }

  .order-summary {
    padding: 15px;
  }

  .status-display {
    flex-direction: column;
    text-align: center;
  }
}

/* Touch-friendly buttons */
@media (hover: none) and (pointer: coarse) {
  .payment-button,
  .retry-button,
  .refresh-button {
    min-height: 44px;
    font-size: 16px;
  }
}
```

---

## 🧪 Étape 9: Tests et Débogage

### Composant de test PayDunya

```typescript
// src/components/PayDunyaTest.tsx
import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';

export const PayDunyaTest: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConfig = async () => {
    setIsLoading(true);
    try {
      const result = await paymentService.testPayDunyaConfig();
      setConfig(result);
    } catch (error) {
      console.error('Test config error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-panel">
      <h3>Test Configuration PayDunya</h3>
      <button onClick={testConfig} disabled={isLoading}>
        {isLoading ? 'Test en cours...' : 'Tester la configuration'}
      </button>

      {config && (
        <div className="config-result">
          <h4>Résultats:</h4>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 Points d'Attention Importants

### 1. Gestion des erreurs
- Toujours vérifier les réponses de l'API
- Afficher des messages clairs à l'utilisateur
- Proposer des alternatives en cas d'échec

### 2. Sécurité
- Ne jamais stocker de clés API dans le frontend
- Utiliser HTTPS en production
- Valider toutes les entrées utilisateur

### 3. Expérience utilisateur
- Indicateurs de chargement clairs
- Messages de confirmation
- Redirections automatiques

### 4. Tests
- Tester en mode test PayDunya avant production
- Vérifier tous les cas d'erreur
- Tester sur mobile et desktop

---

## 🚀 Déploiement

### En production, changer les URLs:

```typescript
// Production URLs
const API_BASE_URL = 'https://votre-api.com';
const PAYDUNYA_MODE = 'live';
```

### Mettre à jour les URLs PayDunya:

```env
# Production
PAYDUNYA_CALLBACK_URL=https://votre-api.com/paydunya/webhook
PAYDUNYA_RETURN_URL=https://votre-frontend.com/payment/success
PAYDUNYA_CANCEL_URL=https://votre-frontend.com/payment/cancel
```

---

## 📞 Support

En cas de problème:

1. **Vérifier les logs** du backend
2. **Tester la configuration** PayDunya
3. **Vérifier les URLs** de redirection
4. **Consulter la documentation** PayDunya: https://developers.paydunya.com

---

✨ **Votre intégration PayDunya est maintenant prête pour la production !** ✨