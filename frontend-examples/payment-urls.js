/**
 * Configuration des URLs de paiement Paytech
 * À adapter selon votre projet
 */

const PAYMENT_CONFIG = {
  // Environnement
  NODE_ENV: process.env.NODE_ENV || 'development',

  // URLs de base
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://votre-site.com'
    : 'http://localhost:3000',

  BACKEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://votre-api.com'
    : 'http://localhost:3004',

  // URLs de redirection après paiement
  get SUCCESS_URL() {
    return `${this.FRONTEND_URL}/payment/success`;
  },

  get CANCEL_URL() {
    return `${this.FRONTEND_URL}/payment/cancel`;
  },

  get IPN_URL() {
    return `${this.BACKEND_URL}/paytech/ipn-callback`;
  },

  // Configuration Paytech
  PAYTECH_ENV: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
  CURRENCY: 'XOF',

  // Générer une référence de commande unique
  generateRefCommand(prefix = 'ORDER') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  },

  // URLs de test (mode développement)
  TEST_URLS: {
    // URLs actives de test
    'PAYTECH-SIMPLE-001': {
      token: '405gzopmh98s6qc',
      url: 'https://paytech.sn/payment/checkout/405gzopmh98s6qc',
      amount: 5000,
      status: 'PENDING'
    },

    // Exemple de paiement réussi
    'PAYTECH-SIMPLE-002': {
      token: 'eey3kpmh98snn8',
      url: 'https://paytech.sn/payment/checkout/eey3kpmh98snn8',
      amount: 7500,
      status: 'PAID'
    },

    // Exemple de paiement échoué
    'PAYTECH-SIMPLE-003': {
      token: 'fail-test-001',
      url: 'https://paytech.sn/payment/checkout/fail-test-001',
      amount: 10000,
      status: 'FAILED'
    }
  },

  // Créer une URL de test
  createTestUrl(orderNumber, amount) {
    return {
      token: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: 'https://paytech.sn/payment/checkout/' + `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount,
      status: 'PENDING'
    };
  },

  // Valider une URL de retour
  validateReturnUrl(url) {
    const urlObj = new URL(url);
    const allowedOrigins = [
      this.FRONTEND_URL,
      'http://localhost:3000',
      'https://paytech.sn'
    ];

    return allowedOrigins.includes(urlObj.origin);
  },

  // Extraire les paramètres de l'URL de retour
  extractReturnParams(url) {
    const urlObj = new URL(url);
    return {
      token: urlObj.searchParams.get('token'),
      ref_command: urlObj.searchParams.get('ref_command'),
      success: urlObj.pathname.includes('/success'),
      cancel: urlObj.pathname.includes('/cancel')
    };
  },

  // URLs des pages de paiement
  PAGES: {
    SUCCESS: '/payment/success',
    CANCEL: '/payment/cancel',
    ERROR: '/payment/error',
    ORDERS: '/orders'
  },

  // Construire l'URL complète d'une page
  buildPageUrl(page) {
    return `${this.FRONTEND_URL}${page}`;
  },

  // Log des URLs de paiement
  logUrls(paymentData, response) {
    console.group('🔗 URLs de paiement Paytech');
    console.log('📦 Commande:', paymentData.ref_command);
    console.log('💰 Montant:', paymentData.item_price, paymentData.currency);
    console.log('🔄 Redirection:', response.data.redirect_url);
    console.log('✅ Succès:', paymentData.success_url);
    console.log('❌ Annulation:', paymentData.cancel_url);
    console.log('📡 IPN:', paymentData.ipn_url);
    console.groupEnd();
  }
};

// Export pour Node.js ou utilisation globale
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PAYMENT_CONFIG;
} else {
  window.PAYMENT_CONFIG = PAYMENT_CONFIG;
}