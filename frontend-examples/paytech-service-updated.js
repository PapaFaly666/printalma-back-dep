/**
 * Paytech Service - Version avec validation d'URLs
 * Résout le problème "successRedirectUrl doit être un URL"
 */

class PaytechService {
  constructor(baseUrl = 'http://localhost:3004') {
    this.baseUrl = baseUrl;
  }

  /**
   * Valider et nettoyer les URLs de paiement
   * @param {Object} paymentData - Données du paiement
   * @returns {Object} - Données validées et nettoyées
   */
  validateAndCleanPaymentData(paymentData) {
    const cleanedData = { ...paymentData };

    // URLs par défaut si non fournies
    const defaultURLs = this.getDefaultRedirectURLs();

    // Nettoyer success_url
    if (cleanedData.success_url) {
      cleanedData.success_url = this.sanitizeURL(cleanedData.success_url);
      if (!cleanedData.success_url) {
        throw new Error('success_url n\'est pas une URL valide');
      }
    } else {
      cleanedData.success_url = defaultURLs.success_url;
    }

    // Nettoyer cancel_url
    if (cleanedData.cancel_url) {
      cleanedData.cancel_url = this.sanitizeURL(cleanedData.cancel_url);
      if (!cleanedData.cancel_url) {
        throw new Error('cancel_url n\'est pas une URL valide');
      }
    } else {
      cleanedData.cancel_url = defaultURLs.cancel_url;
    }

    // Nettoyer ipn_url (optionnel)
    if (cleanedData.ipn_url) {
      cleanedData.ipn_url = this.sanitizeURL(cleanedData.ipn_url);
      if (!cleanedData.ipn_url) {
        throw new Error('ipn_url n\'est pas une URL valide');
      }
    }

    return cleanedData;
  }

  /**
   * Obtenir les URLs de redirection par défaut
   * @returns {Object} - URLs par défaut
   */
  getDefaultRedirectURLs() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    return {
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`
    };
  }

  /**
   * Nettoyer une URL
   * @param {string} url - URL à nettoyer
   * @returns {string|null} - URL nettoyée
   */
  sanitizeURL(url) {
    if (!url || typeof url !== 'string') return null;

    let cleanUrl = url.trim();

    // Ajouter http:// si nécessaire (pour localhost)
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
        cleanUrl = 'http://' + cleanUrl;
      } else {
        cleanUrl = 'https://' + cleanUrl;
      }
    }

    try {
      new URL(cleanUrl); // Valider l'URL
      return cleanUrl;
    } catch (error) {
      console.error('URL invalide:', error);
      return null;
    }
  }

  /**
   * Initialiser un paiement Paytech avec validation
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - Réponse de Paytech
   */
  async initializePayment(paymentData) {
    try {
      // Valider et nettoyer les données
      const cleanedData = this.validateAndCleanPaymentData(paymentData);

      // Valider les champs requis
      this.validateRequiredFields(cleanedData);

      console.log('🔗 Données de paiement validées:', cleanedData);

      const response = await fetch(`${this.baseUrl}/paytech/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
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
   * Valider les champs requis
   * @param {Object} paymentData - Données à valider
   */
  validateRequiredFields(paymentData) {
    const requiredFields = ['item_name', 'item_price', 'ref_command', 'command_name'];

    for (const field of requiredFields) {
      if (!paymentData[field] || paymentData[field].toString().trim().length === 0) {
        throw new Error(`Le champ '${field}' est requis`);
      }
    }

    if (paymentData.item_price <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    if (paymentData.item_price < 100) {
      throw new Error('Le montant minimum est de 100 XOF');
    }

    if (paymentData.item_price > 1000000) {
      throw new Error('Le montant maximum est de 1 000 000 XOF');
    }
  }

  /**
   * Créer des données de paiement valides
   * @param {Object} options - Options personnalisées
   * @returns {Object} - Données de paiement valides
   */
  createValidPaymentData(options = {}) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    const defaultData = {
      currency: 'XOF',
      env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`
    };

    const paymentData = { ...defaultData, ...options };

    // Valider et nettoyer
    return this.validateAndCleanPaymentData(paymentData);
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
   * Créer un paiement simplifié (usage rapide)
   * @param {string} productName - Nom du produit
   * @param {number} amount - Montant en XOF
   * @param {string} reference - Référence de commande (optionnel)
   * @returns {Promise<Object>} - Réponse de Paytech
   */
  async createSimplePayment(productName, amount, reference = null) {
    const paymentData = this.createValidPaymentData({
      item_name: productName,
      item_price: amount,
      ref_command: reference || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      command_name: `Achat de ${productName}`
    });

    return this.initializePayment(paymentData);
  }
}

// Utilitaires pour faciliter l'intégration
window.PaytechService = PaytechService;

// Exemple d'utilisation rapide
window.quickPaytech = {
  /**
   * Payer rapidement avec validation automatique des URLs
   */
  async pay: async (productName, amount) => {
    const service = new PaytechService();
    try {
      const response = await service.createSimplePayment(productName, amount);
      window.location.href = response.data.redirect_url;
    } catch (error) {
      console.error('Erreur de paiement:', error);
      alert(`Erreur: ${error.message}`);
    }
  },

  /**
   * Payer avec données personnalisées
   */
  payCustom: async (data) => {
    const service = new PaytechService();
    try {
      const response = await service.initializePayment(data);
      window.location.href = response.data.redirect_url;
    } catch (error) {
      console.error('Erreur de paiement:', error);
      alert(`Erreur: ${error.message}`);
    }
  }
};