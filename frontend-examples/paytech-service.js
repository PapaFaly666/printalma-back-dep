/**
 * Paytech Service - Exemple d'implémentation JavaScript/TypeScript
 * Pour les applications React, Vue, Angular ou Vanilla JS
 */

class PaytechService {
  constructor(baseUrl = 'http://localhost:3004') {
    this.baseUrl = baseUrl;
  }

  /**
   * Initialiser un paiement Paytech
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - Réponse de Paytech
   */
  async initializePayment(paymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'initialisation du paiement');
      }

      return result;
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * @param {string} token - Token du paiement
   * @returns {Promise<Object>} - Statut du paiement
   */
  async checkPaymentStatus(token) {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/status/${token}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la vérification du statut');
      }

      return result;
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }

  /**
   * Tester la configuration Paytech
   * @returns {Promise<Object>} - État de la configuration
   */
  async testConfiguration() {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/test-config`);
      return await response.json();
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }

  /**
   * Valider les données de paiement
   * @param {Object} paymentData - Données à valider
   * @returns {boolean} - True si valide
   */
  validatePaymentData(paymentData) {
    const requiredFields = ['item_name', 'item_price', 'ref_command', 'command_name'];

    for (const field of requiredFields) {
      if (!paymentData[field] || paymentData[field].toString().trim().length === 0) {
        throw new Error(`Le champ '${field}' est requis`);
      }
    }

    if (paymentData.item_price <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    return true;
  }

  /**
   * Créer des données de paiement par défaut
   * @param {Object} options - Options personnalisées
   * @returns {Object} - Données de paiement
   */
  createPaymentData(options = {}) {
    const defaultData = {
      currency: 'XOF',
      env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
      success_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`,
    };

    return { ...defaultData, ...options };
  }
}

// Export pour Node.js ou utiliser comme script global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaytechService;
} else {
  window.PaytechService = PaytechService;
}