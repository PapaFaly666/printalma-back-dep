/**
 * Service de commande complet avec intégration Paytech
 * Ce service gère la création de commandes et l'initialisation des paiements
 */

class OrderService {
  constructor(baseUrl = 'http://localhost:3004') {
    this.baseUrl = baseUrl;
  }

  /**
   * Créer une commande avec paiement Paytech
   * @param {Object} orderData - Données de la commande
   * @param {string} userToken - Token JWT de l'utilisateur
   * @returns {Promise<Object>} - Résultat de la création
   */
  async createOrderWithPayment(orderData, userToken) {
    try {
      console.log('🛒 Création de commande avec paiement...', orderData);

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!result.success) {
        console.error('❌ Erreur création commande:', result);
        throw new Error(result.message || 'Erreur lors de la création de la commande');
      }

      console.log('✅ Commande créée avec succès:', result.data);
      return result;

    } catch (error) {
      console.error('❌ OrderService Error:', error);
      throw error;
    }
  }

  /**
   * Créer une commande rapide pour un produit
   * @param {Object} product - Produit à acheter
   * @param {number} quantity - Quantité
   * @param {string} userToken - Token JWT
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat de la création
   */
  async createQuickOrder(product, quantity = 1, userToken, options = {}) {
    try {
      console.log('🛍️ Création commande rapide pour:', product.name);

      // Obtenir les informations de l'utilisateur depuis le localStorage
      const userInfo = this.getUserInfo();

      const orderData = {
        shippingDetails: {
          shippingName: userInfo.fullName || `${userInfo.firstName} ${userInfo.lastName}`,
          shippingStreet: userInfo.address || 'Adresse à compléter',
          shippingCity: userInfo.city || 'Dakar',
          shippingRegion: userInfo.region || 'Dakar',
          shippingPostalCode: userInfo.postalCode || '12345',
          shippingCountry: userInfo.country || 'Sénégal'
        },
        phoneNumber: userInfo.phone || options.phoneNumber || '775588834',
        notes: options.notes || '',
        orderItems: [{
          productId: product.id,
          quantity: quantity,
          size: product.selectedSize || options.size || "M",
          color: product.selectedColor || options.color || "Blanc",
          colorId: product.selectedColorId || options.colorId || null
        }],
        paymentMethod: "PAYTECH",
        initiatePayment: true
      };

      return this.createOrderWithPayment(orderData, userToken);

    } catch (error) {
      console.error('❌ Erreur commande rapide:', error);
      throw error;
    }
  }

  /**
   * Obtenir les commandes de l'utilisateur connecté
   * @param {string} userToken - Token JWT
   * @returns {Promise<Array>} - Liste des commandes
   */
  async getUserOrders(userToken) {
    try {
      console.log('📋 Récupération des commandes utilisateur...');

      const response = await fetch(`${this.baseUrl}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des commandes');
      }

      console.log('✅ Commandes récupérées:', result.data.length);
      return result.data;

    } catch (error) {
      console.error('❌ Get orders error:', error);
      throw error;
    }
  }

  /**
   * Obtenir le statut d'une commande spécifique
   * @param {number} orderId - ID de la commande
   * @param {string} userToken - Token JWT
   * @returns {Promise<Object>} - Détails de la commande
   */
  async getOrderStatus(orderId, userToken) {
    try {
      console.log(`🔍 Vérification statut commande #${orderId}...`);

      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération du statut');
      }

      console.log('✅ Statut commande:', result.data);
      return result.data;

    } catch (error) {
      console.error('❌ Get order status error:', error);
      throw error;
    }
  }

  /**
   * Créer une commande depuis le panier
   * @param {Array} cartItems - Articles du panier
   * @param {Object} shippingInfo - Informations de livraison
   * @param {string} userToken - Token JWT
   * @returns {Promise<Object>} - Résultat de la création
   */
  async createOrderFromCart(cartItems, shippingInfo, userToken) {
    try {
      console.log('🛒 Création commande depuis panier...');

      const userInfo = this.getUserInfo();

      const orderData = {
        shippingDetails: {
          shippingName: shippingInfo.fullName || `${userInfo.firstName} ${userInfo.lastName}`,
          shippingStreet: shippingInfo.street || userInfo.address,
          shippingCity: shippingInfo.city || userInfo.city,
          shippingRegion: shippingInfo.region || userInfo.region,
          shippingPostalCode: shippingInfo.postalCode || userInfo.postalCode,
          shippingCountry: shippingInfo.country || userInfo.country
        },
        phoneNumber: shippingInfo.phone || userInfo.phone,
        notes: shippingInfo.notes || '',
        orderItems: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.selectedSize || item.size,
          color: item.selectedColor || item.color,
          colorId: item.selectedColorId || item.colorId
        })),
        paymentMethod: "PAYTECH",
        initiatePayment: true
      };

      return this.createOrderWithPayment(orderData, userToken);

    } catch (error) {
      console.error('❌ Erreur commande depuis panier:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les informations de livraison de l'utilisateur
   * @param {Object} shippingInfo - Nouvelles informations de livraison
   */
  updateUserInfo(shippingInfo) {
    try {
      const userInfo = this.getUserInfo();
      const updatedUserInfo = { ...userInfo, ...shippingInfo };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      console.log('✅ Infos utilisateur mises à jour:', updatedUserInfo);
    } catch (error) {
      console.error('❌ Erreur mise à jour infos utilisateur:', error);
    }
  }

  /**
   * Obtenir les informations de l'utilisateur depuis le localStorage
   * @returns {Object} - Informations utilisateur
   */
  getUserInfo() {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : {};
    } catch (error) {
      console.error('❌ Erreur récupération infos utilisateur:', error);
      return {};
    }
  }

  /**
   * Valider les données de commande avant envoi
   * @param {Object} orderData - Données à valider
   * @returns {Object} - Données validées
   */
  validateOrderData(orderData) {
    const errors = [];

    // Validation des détails de livraison
    if (!orderData.shippingDetails?.shippingName) {
      errors.push('Le nom complet est requis');
    }
    if (!orderData.shippingDetails?.shippingStreet) {
      errors.push('L\'adresse de livraison est requise');
    }
    if (!orderData.shippingDetails?.shippingCity) {
      errors.push('La ville est requise');
    }

    // Validation du téléphone
    if (!orderData.phoneNumber || orderData.phoneNumber.length < 8) {
      errors.push('Le numéro de téléphone est invalide');
    }

    // Validation des articles
    if (!orderData.orderItems || orderData.orderItems.length === 0) {
      errors.push('Au moins un article est requis');
    }

    orderData.orderItems?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`L'article ${index + 1} n'a pas d'ID produit valide`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`L'article ${index + 1} a une quantité invalide`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Erreurs de validation: ${errors.join(', ')}`);
    }

    return orderData;
  }

  /**
   * Calculer le total de la commande
   * @param {Array} orderItems - Articles de la commande
   * @returns {number} - Total calculé
   */
  calculateOrderTotal(orderItems) {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Formater le montant pour Paytech
   * @param {number} amount - Montant à formater
   * @returns {number} - Montant formaté (entier)
   */
  formatAmountForPaytech(amount) {
    return Math.round(amount);
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean} - Statut d'authentification
   */
  isUserAuthenticated() {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    return !!(token && userInfo);
  }

  /**
   * Obtenir le token JWT de l'utilisateur
   * @returns {string|null} - Token JWT ou null
   */
  getUserToken() {
    return localStorage.getItem('userToken');
  }

  /**
   * Déconnecter l'utilisateur
   */
  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    console.log('👋 Utilisateur déconnecté');
  }

  /**
   * Logger les actions pour le débogage
   * @param {string} action - Action effectuée
   * @param {Object} data - Données associées
   */
  log(action, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OrderService] ${action}:`, data);
    }
  }
}

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OrderService };
} else {
  window.OrderService = OrderService;
}

// Export par défaut pour ES6
export { OrderService };