/**
 * EXEMPLES DE COMPOSANTS REACT - INTÉGRATION PAYDUNYA
 *
 * Ces composants sont prêts à l'emploi et peuvent être copiés directement
 * dans votre projet React/Next.js
 *
 * Dépendances requises:
 * - react-router-dom (pour la navigation)
 * - axios (pour les appels API)
 */

// ============================================
// 1. CONFIGURATION ET UTILITAIRES
// ============================================

// api/orders.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

export const ordersAPI = {
  /**
   * Créer une commande avec paiement PayDunya
   */
  async createGuestOrder(orderData) {
    const response = await axios.post(`${API_BASE_URL}/orders/guest`, {
      ...orderData,
      paymentMethod: 'PAYDUNYA',
      initiatePayment: true,
    });
    return response.data;
  },

  /**
   * Récupérer le détail d'une commande
   */
  async getOrder(orderId) {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
    return response.data;
  },

  /**
   * Vérifier le statut de paiement via PayDunya
   */
  async checkPaymentStatus(token) {
    const response = await axios.get(`${API_BASE_URL}/paydunya/status/${token}`);
    return response.data;
  },
};

// ============================================
// 2. HOOK PERSONNALISÉ - POLLING DU STATUT
// ============================================

// hooks/usePaymentPolling.js
import { useState, useEffect } from 'react';
import { ordersAPI } from '../api/orders';

/**
 * Hook pour surveiller automatiquement le statut de paiement
 *
 * @param {number} orderId - ID de la commande à surveiller
 * @param {number} maxAttempts - Nombre maximum de tentatives (défaut: 10)
 * @param {number} interval - Intervalle entre les vérifications en ms (défaut: 3000)
 * @returns {Object} { status, order, error }
 */
export function usePaymentPolling(orderId, maxAttempts = 10, interval = 3000) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'paid' | 'failed' | 'timeout' | 'error'
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setError('Order ID is required');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await ordersAPI.getOrder(orderId);
        const orderData = response.data;

        setOrder(orderData);

        if (orderData.paymentStatus === 'PAID') {
          setStatus('paid');
          return true; // Arrêter le polling
        }

        if (orderData.paymentStatus === 'FAILED') {
          setStatus('failed');
          return true; // Arrêter le polling
        }

        // Toujours en attente
        if (attempts >= maxAttempts - 1) {
          setStatus('timeout');
          return true; // Arrêter le polling
        }

        setAttempts(prev => prev + 1);
        return false; // Continuer le polling
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError(err.message);
        setStatus('error');
        return true; // Arrêter le polling en cas d'erreur
      }
    };

    // Première vérification immédiate
    checkStatus().then(shouldStop => {
      if (shouldStop) return;

      // Continuer le polling
      const intervalId = setInterval(async () => {
        const shouldStop = await checkStatus();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      }, interval);

      return () => clearInterval(intervalId);
    });
  }, [orderId, maxAttempts, interval, attempts]);

  return { status, order, error, attempts };
}

// ============================================
// 3. COMPOSANT CHECKOUT - CRÉATION DE COMMANDE
// ============================================

// components/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api/orders';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données du formulaire
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '+221',
    firstName: '',
    lastName: '',
    street: '',
    city: 'Dakar',
    region: 'Dakar',
    postalCode: '',
    country: 'Sénégal',
    notes: '',
  });

  // Panier (à adapter selon votre implémentation)
  const cartItems = [
    { productId: 1, quantity: 2, unitPrice: 5000, color: 'Blanc', size: 'M', name: 'T-shirt' }
  ];

  const totalAmount = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setError('Numéro de téléphone invalide');
      return false;
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Nom et prénom requis');
      return false;
    }

    if (!formData.street || !formData.city) {
      setError('Adresse complète requise');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await ordersAPI.createGuestOrder({
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        shippingDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        orderItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          color: item.color,
          size: item.size,
        })),
        totalAmount,
        notes: formData.notes,
      });

      const { data } = response;

      // Vérifier que le paiement a été initialisé
      if (!data.payment || !data.payment.redirect_url) {
        throw new Error('Erreur lors de l\'initialisation du paiement');
      }

      // Sauvegarder les informations importantes dans le localStorage
      localStorage.setItem('pendingOrderId', data.id);
      localStorage.setItem('pendingOrderNumber', data.orderNumber);
      localStorage.setItem('pendingPaymentToken', data.payment.token);
      localStorage.setItem('pendingOrderAmount', data.totalAmount);

      console.log('Order created:', data);
      console.log('Redirecting to:', data.payment.redirect_url);

      // Rediriger vers PayDunya
      window.location.href = data.payment.redirect_url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors de la création de la commande'
      );
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Finaliser ma commande</h1>
        <p>Paiement sécurisé par PayDunya</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Erreur:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Informations de contact */}
          <section className="form-section">
            <h2>📧 Informations de contact</h2>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Téléphone *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+221 77 123 45 67"
                required
              />
              <small>Format: +221 suivi de votre numéro</small>
            </div>
          </section>

          {/* Adresse de livraison */}
          <section className="form-section">
            <h2>📍 Adresse de livraison</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Prénom *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Nom *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="street">Adresse complète *</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Numéro, rue, quartier, point de repère"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">Ville *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">Code postal</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Instructions spéciales (optionnel)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Ex: Livrer après 18h, sonnez 2 fois, etc."
              />
            </div>
          </section>

          {/* Résumé de la commande */}
          <section className="form-section">
            <h2>📦 Résumé de la commande</h2>

            <div className="cart-summary">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">
                      {item.color} - {item.size} - Qté: {item.quantity}
                    </span>
                  </div>
                  <span className="item-price">
                    {(item.unitPrice * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              ))}

              <div className="cart-total">
                <strong>Total à payer:</strong>
                <strong className="total-amount">
                  {totalAmount.toLocaleString()} FCFA
                </strong>
              </div>
            </div>
          </section>

          {/* Méthodes de paiement */}
          <section className="form-section">
            <h2>💳 Méthode de paiement</h2>
            <div className="payment-methods">
              <p>Paiement sécurisé via PayDunya</p>
              <div className="payment-logos">
                <span>📱 Orange Money</span>
                <span>💰 Wave</span>
                <span>💳 Visa</span>
                <span>💳 Mastercard</span>
              </div>
            </div>
          </section>

          {/* Bouton de paiement */}
          <button
            type="submit"
            className="btn-pay"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Traitement en cours...
              </>
            ) : (
              <>
                Payer {totalAmount.toLocaleString()} FCFA
              </>
            )}
          </button>

          <p className="secure-notice">
            🔒 Paiement 100% sécurisé - Vos données sont protégées
          </p>
        </form>
      </div>
    </div>
  );
}

// ============================================
// 4. COMPOSANT PAGE DE SUCCÈS
// ============================================

// components/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePaymentPolling } from '../hooks/usePaymentPolling';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Récupérer l'ID de commande depuis le localStorage
  const orderId = localStorage.getItem('pendingOrderId');
  const orderNumber = localStorage.getItem('pendingOrderNumber');
  const orderAmount = localStorage.getItem('pendingOrderAmount');

  // Utiliser le hook de polling pour vérifier le statut
  const { status, order, error, attempts } = usePaymentPolling(orderId);

  useEffect(() => {
    // Si le paiement est confirmé, nettoyer le localStorage
    if (status === 'paid') {
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('pendingOrderNumber');
      localStorage.removeItem('pendingPaymentToken');
      localStorage.removeItem('pendingOrderAmount');
    }
  }, [status]);

  // État: Vérification en cours
  if (status === 'checking') {
    return (
      <div className="payment-page payment-checking">
        <div className="spinner-large"></div>
        <h1>Vérification de votre paiement...</h1>
        <p>Veuillez patienter quelques instants</p>
        <p className="attempts-count">Tentative {attempts + 1}/10</p>
      </div>
    );
  }

  // État: Timeout
  if (status === 'timeout') {
    return (
      <div className="payment-page payment-timeout">
        <div className="icon">⏳</div>
        <h1>Paiement en cours de traitement</h1>
        <p>Votre paiement prend plus de temps que prévu.</p>
        <p>Vous recevrez un email de confirmation dès que le paiement sera validé.</p>

        <div className="order-info">
          <p><strong>Numéro de commande:</strong> {orderNumber}</p>
          <p><strong>Montant:</strong> {orderAmount?.toLocaleString()} FCFA</p>
        </div>

        <div className="actions">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="btn-primary"
          >
            Voir ma commande
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="btn-secondary"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  // État: Erreur
  if (status === 'error' || error) {
    return (
      <div className="payment-page payment-error">
        <div className="icon">❌</div>
        <h1>Erreur de vérification</h1>
        <p>{error || 'Une erreur est survenue lors de la vérification'}</p>

        <div className="actions">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate('/support')}
            className="btn-secondary"
          >
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  // État: Paiement confirmé
  if (status === 'paid' && order) {
    return (
      <div className="payment-page payment-success">
        <div className="icon success">✅</div>
        <h1>Paiement confirmé !</h1>
        <p>Merci pour votre commande.</p>

        <div className="order-details">
          <h3>Détails de votre commande</h3>

          <div className="detail-row">
            <span>Numéro de commande:</span>
            <strong>{order.orderNumber}</strong>
          </div>

          <div className="detail-row">
            <span>Montant payé:</span>
            <strong>{order.totalAmount.toLocaleString()} FCFA</strong>
          </div>

          <div className="detail-row">
            <span>Statut:</span>
            <span className="status-badge status-confirmed">
              {order.status}
            </span>
          </div>

          <div className="detail-row">
            <span>Transaction:</span>
            <code>{order.transactionId}</code>
          </div>

          <div className="detail-row">
            <span>Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        <div className="next-steps">
          <h3>Prochaines étapes</h3>
          <ul>
            <li>✅ Un email de confirmation vous a été envoyé</li>
            <li>📦 Votre commande sera préparée dans les 24-48h</li>
            <li>🚚 Vous recevrez un email lors de l'expédition</li>
          </ul>
        </div>

        <div className="actions">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="btn-primary"
          >
            Voir les détails de ma commande
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="btn-secondary"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  // État: Paiement échoué
  if (status === 'failed' && order) {
    const failureReason = order.payment_info?.lastPaymentFailureReason;
    const isInsufficientFunds = order.payment_info?.insufficient_funds?.detected;

    return (
      <div className="payment-page payment-failed">
        <div className="icon">❌</div>
        <h1>Paiement échoué</h1>

        {isInsufficientFunds ? (
          <div className="failure-message">
            <p>💰 Fonds insuffisants dans votre compte</p>
            <p>Veuillez vérifier votre solde ou utiliser une autre méthode de paiement.</p>
          </div>
        ) : (
          <div className="failure-message">
            <p>Une erreur est survenue lors du paiement</p>
            {failureReason && <p className="failure-reason">{failureReason}</p>}
          </div>
        )}

        <div className="order-info">
          <p><strong>Commande:</strong> {order.orderNumber}</p>
          <p><strong>Montant:</strong> {order.totalAmount.toLocaleString()} FCFA</p>
        </div>

        <div className="actions">
          <button
            onClick={() => navigate(`/checkout?retry=${order.id}`)}
            className="btn-primary"
          >
            Réessayer le paiement
          </button>
          <button
            onClick={() => navigate('/support')}
            className="btn-secondary"
          >
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  // État par défaut
  return null;
}

// ============================================
// 5. COMPOSANT PAGE D'ANNULATION
// ============================================

// components/PaymentCancel.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get('reason') || 'Paiement annulé par l\'utilisateur';
  const orderId = localStorage.getItem('pendingOrderId');
  const orderNumber = localStorage.getItem('pendingOrderNumber');

  useEffect(() => {
    // Ne pas nettoyer le localStorage ici
    // L'utilisateur peut vouloir réessayer
  }, []);

  return (
    <div className="payment-page payment-cancel">
      <div className="icon">🚫</div>
      <h1>Paiement annulé</h1>

      <div className="cancel-message">
        <p>{reason}</p>
        <p>Aucun montant n'a été débité de votre compte.</p>
      </div>

      {orderNumber && (
        <div className="order-info">
          <p><strong>Commande:</strong> {orderNumber}</p>
          <p className="status-text">Votre commande est toujours en attente de paiement</p>
        </div>
      )}

      <div className="actions">
        {orderId && (
          <button
            onClick={() => navigate(`/checkout?retry=${orderId}`)}
            className="btn-primary"
          >
            Réessayer le paiement
          </button>
        )}

        <button
          onClick={() => {
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingOrderNumber');
            localStorage.removeItem('pendingPaymentToken');
            localStorage.removeItem('pendingOrderAmount');
            navigate('/cart');
          }}
          className="btn-secondary"
        >
          Retour au panier
        </button>

        <button
          onClick={() => navigate('/shop')}
          className="btn-link"
        >
          Continuer mes achats
        </button>
      </div>

      <div className="help-section">
        <p>Besoin d'aide ?</p>
        <button onClick={() => navigate('/support')}>
          Contacter le support
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXEMPLE DE STYLES CSS (optionnel)
// ============================================

/*
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.checkout-form {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-pay {
  width: 100%;
  padding: 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-pay:hover {
  background: #218838;
}

.btn-pay:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.payment-page {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.payment-page .icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.spinner-large {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/

export default {
  CheckoutPage,
  PaymentSuccess,
  PaymentCancel,
  usePaymentPolling,
  ordersAPI,
};
