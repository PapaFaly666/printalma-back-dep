/**
 * Validateur d'URLs pour Paytech - Solution complète
 * Résout les problèmes de validation d'URLs de redirection
 */

export class URLValidator {
  /**
   * Valider une URL selon les critères de Paytech
   * @param {string} url - URL à valider
   * @param {string} fieldName - Nom du champ pour les messages d'erreur
   * @returns {Object} - Résultat de validation
   */
  static validateURL(url, fieldName = 'URL') {
    const errors = [];
    const warnings = [];

    if (!url) {
      errors.push(`${fieldName} est requise`);
      return { isValid: false, errors, warnings, cleanUrl: null };
    }

    // Nettoyer l'URL
    let cleanUrl = url.trim();

    // Ajouter http:// si manquant (localhost uniquement)
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
        cleanUrl = 'http://' + cleanUrl;
        warnings.push('http:// ajouté pour localhost en développement');
      } else {
        cleanUrl = 'https://' + cleanUrl;
        warnings.push('https:// ajouté par défaut');
      }
    }

    // Validation de l'URL
    try {
      const urlObj = new URL(cleanUrl);

      // Protocole valide
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push(`${fieldName} doit utiliser http ou https`);
      }

      // En production, exiger HTTPS
      if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
        errors.push(`${fieldName} doit utiliser HTTPS en production`);
      }

      // Validation de base
      if (!urlObj.hostname) {
        errors.push(`${fieldName} doit avoir un nom d'hôte valide`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        cleanUrl: urlObj.toString()
      };

    } catch (error) {
      errors.push(`${fieldName} n'est pas une URL valide: ${error.message}`);
      return { isValid: false, errors, warnings, cleanUrl: null };
    }
  }

  /**
   * Valider toutes les URLs de paiement
   * @param {Object} paymentData - Données de paiement
   * @returns {Object} - Résultat de validation
   */
  static validatePaymentURLs(paymentData) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      cleanedData: { ...paymentData }
    };

    // Valider success_url
    if (paymentData.success_url) {
      const successValidation = this.validateURL(paymentData.success_url, 'success_url');
      if (!successValidation.isValid) {
        result.isValid = false;
        result.errors.push(...successValidation.errors);
      } else {
        result.warnings.push(...successValidation.warnings);
        result.cleanedData.success_url = successValidation.cleanUrl;
      }
    }

    // Valider cancel_url
    if (paymentData.cancel_url) {
      const cancelValidation = this.validateURL(paymentData.cancel_url, 'cancel_url');
      if (!cancelValidation.isValid) {
        result.isValid = false;
        result.errors.push(...cancelValidation.errors);
      } else {
        result.warnings.push(...cancelValidation.warnings);
        result.cleanedData.cancel_url = cancelValidation.cleanUrl;
      }
    }

    // Valider ipn_url (optionnel)
    if (paymentData.ipn_url) {
      const ipnValidation = this.validateURL(paymentData.ipn_url, 'ipn_url');
      if (!ipnValidation.isValid) {
        result.isValid = false;
        result.errors.push(...ipnValidation.errors);
      } else {
        result.warnings.push(...ipnValidation.warnings);
        result.cleanedData.ipn_url = ipnValidation.cleanUrl;
      }
    }

    return result;
  }

  /**
   * Créer des URLs de redirection automatiques
   * @param {Object} options - Options de configuration
   * @returns {Object} - URLs générées
   */
  static createRedirectURLs(options = {}) {
    const {
      baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      successPath = '/payment/success',
      cancelPath = '/payment/cancel',
      ipnPath = null // IPN optionnel
    } = options;

    const urls = {
      success_url: `${baseUrl}${successPath}`,
      cancel_url: `${baseUrl}${cancelPath}`
    };

    if (ipnPath) {
      urls.ipn_url = `${baseUrl}${ipnPath}`;
    }

    return urls;
  }

  /**
   * Obtenir une URL de base sécurisée selon l'environnement
   * @param {string} path - Chemin à ajouter
   * @returns {string} - URL complète
   */
  static getSecureURL(path = '') {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let baseUrl;

    if (isDevelopment || isLocalhost) {
      baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
    } else {
      baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://votre-site.com';
    }

    return baseUrl + path;
  }

  /**
   * Nettoyer et formater une URL de redirection
   * @param {string} url - URL à nettoyer
   * @returns {string} - URL nettoyée
   */
  static sanitizeURL(url) {
    if (!url) return null;

    let cleanUrl = url.trim();

    // Ajouter http:// si nécessaire (localhost)
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
        cleanUrl = 'http://' + cleanUrl;
      } else {
        cleanUrl = 'https://' + cleanUrl;
      }
    }

    try {
      return new URL(cleanUrl).toString();
    } catch {
      return null;
    }
  }

  /**
   * Valider que l'URL est accessible depuis le frontend
   * @param {string} url - URL à valider
   * @returns {boolean} - True si l'URL est valide pour le frontend
   */
  static isValidFrontendURL(url) {
    try {
      const urlObj = new URL(url);
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://localhost',
      ];

      // En développement, permettre localhost
      if (process.env.NODE_ENV === 'development') {
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
          return true;
        }
      }

      // Vérifier si l'origine correspond
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      return urlObj.origin === currentOrigin || allowedOrigins.includes(urlObj.origin);

    } catch {
      return false;
    }
  }
}

// Export pour utilisation immédiate
if (typeof module !== 'undefined' && module.exports) {
  module.exports = URLValidator;
} else {
  window.URLValidator = URLValidator;
}