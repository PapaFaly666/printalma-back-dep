/**
 * Service Commission Frontend - VERSION CORRIGÉE
 * 
 * Résout le problème "Token d'authentification requis"
 * Compatible avec `include credentials`
 */

import axios from 'axios';

class CommissionService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    
    // Configuration axios avec credentials
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true, // CRUCIAL pour inclure les cookies
      timeout: 30000, // 30 secondes
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configuration des intercepteurs
   */
  setupInterceptors() {
    // Intercepteur de requête - ajoute automatiquement le token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('🚨 Erreur intercepteur request:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse - gère les erreurs auth
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupération sécurisée du token
   * Essaie plusieurs sources de stockage
   */
  getAuthToken() {
    let token = null;

    // 1. Essayer localStorage (plus courant)
    const localStorageKeys = ['adminToken', 'authToken', 'token', 'access_token'];
    for (const key of localStorageKeys) {
      token = localStorage.getItem(key);
      if (token) {
        console.log(`✅ Token trouvé dans localStorage: ${key}`);
        break;
      }
    }

    // 2. Essayer sessionStorage
    if (!token) {
      for (const key of localStorageKeys) {
        token = sessionStorage.getItem(key);
        if (token) {
          console.log(`✅ Token trouvé dans sessionStorage: ${key}`);
          break;
        }
      }
    }

    // 3. Essayer les cookies
    if (!token) {
      const cookieKeys = ['adminToken', 'authToken', 'token'];
      for (const key of cookieKeys) {
        token = this.getCookieValue(key);
        if (token) {
          console.log(`✅ Token trouvé dans cookie: ${key}`);
          break;
        }
      }
    }

    // 4. Essayer un store global (Redux, Zustand, etc.)
    if (!token && typeof window !== 'undefined') {
      // Redux
      if (window.__REDUX_STORE__) {
        token = window.__REDUX_STORE__.getState()?.auth?.token;
      }
      
      // Zustand ou autre store global
      if (!token && window.authStore) {
        token = window.authStore.getState()?.token;
      }

      if (token) {
        console.log('✅ Token trouvé dans store global');
      }
    }

    if (!token) {
      console.warn('🚨 Aucun token d\'authentification trouvé');
      throw new Error('Token d\'authentification requis');
    }

    // Vérifier que le token n'est pas expiré
    if (!this.isTokenValid(token)) {
      console.warn('🚨 Token expiré');
      this.clearStoredTokens();
      throw new Error('Token d\'authentification expiré');
    }

    return token;
  }

  /**
   * Vérification de validité du token JWT
   */
  isTokenValid(token) {
    if (!token || typeof token !== 'string') return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      
      // Vérifier l'expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }

      // Vérifier le rôle admin
      if (payload.role && !['ADMIN', 'SUPERADMIN'].includes(payload.role)) {
        console.warn('🚨 Token valide mais rôle insuffisant:', payload.role);
        throw new Error('Permissions insuffisantes - Accès administrateur requis');
      }

      return true;
    } catch (error) {
      console.warn('🚨 Token invalide:', error.message);
      return false;
    }
  }

  /**
   * Lecture d'un cookie
   */
  getCookieValue(name) {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Nettoie tous les tokens stockés
   */
  clearStoredTokens() {
    const keys = ['adminToken', 'authToken', 'token', 'access_token'];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Nettoyer les cookies (nécessite de connaître le chemin et domaine)
    keys.forEach(key => {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  /**
   * Gestion des erreurs d'authentification
   */
  handleAuthError() {
    console.warn('🚨 Erreur d\'authentification détectée');
    
    this.clearStoredTokens();
    
    // Redirection vers login (évite les boucles)
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      const currentPath = window.location.pathname;
      console.log(`🔄 Redirection vers login depuis ${currentPath}`);
      
      // Stocker la page actuelle pour redirection après login
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }

  /**
   * Wrapper sécurisé pour les appels API
   */
  async makeSecureRequest(requestFn, errorContext = 'API call') {
    try {
      // Vérification préalable de l'auth
      this.getAuthToken(); // Lance une erreur si pas de token valide
      
      const result = await requestFn();
      return result;

    } catch (error) {
      console.error(`❌ Erreur ${errorContext}:`, error);

      // Gestion spécifique des erreurs auth
      if (error.message?.includes('Token') || error.message?.includes('auth')) {
        return {
          success: false,
          error: 'AUTH_REQUIRED',
          message: 'Vous devez être connecté en tant qu\'administrateur'
        };
      }

      // Gestion des erreurs HTTP
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'HTTP_ERROR',
          message: error.response.data?.message || `Erreur HTTP ${error.response.status}`
        };
      }

      // Gestion des erreurs réseau
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Erreur de connexion au serveur'
      };
    }
  }

  /**
   * Mettre à jour la commission d'un vendeur - VERSION SÉCURISÉE
   */
  async updateVendorCommission(vendorId, commissionRate) {
    return this.makeSecureRequest(async () => {
      console.log('📡 Mise à jour commission:', { vendorId, commissionRate, timestamp: new Date().toISOString() });

      const response = await this.api.put(`/admin/vendors/${vendorId}/commission`, {
        commissionRate: parseFloat(commissionRate)
      });
      
      console.log('✅ Commission mise à jour avec succès');
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    }, 'updateVendorCommission');
  }

  /**
   * Obtenir la commission d'un vendeur
   */
  async getVendorCommission(vendorId) {
    return this.makeSecureRequest(async () => {
      const response = await this.api.get(`/admin/vendors/${vendorId}/commission`);
      
      return {
        success: true,
        data: response.data.data
      };
    }, 'getVendorCommission');
  }

  /**
   * Obtenir toutes les commissions
   */
  async getAllVendorCommissions() {
    return this.makeSecureRequest(async () => {
      const response = await this.api.get('/admin/vendors/commissions');
      
      return {
        success: true,
        data: response.data.data
      };
    }, 'getAllVendorCommissions');
  }

  /**
   * Obtenir les statistiques des commissions
   */
  async getCommissionStats() {
    return this.makeSecureRequest(async () => {
      const response = await this.api.get('/admin/commission-stats');
      
      return {
        success: true,
        data: response.data.data
      };
    }, 'getCommissionStats');
  }

  /**
   * Obtenir l'historique des changements
   */
  async getCommissionHistory(vendorId) {
    return this.makeSecureRequest(async () => {
      const response = await this.api.get(`/admin/vendors/${vendorId}/commission/history`);
      
      return {
        success: true,
        data: response.data.data
      };
    }, 'getCommissionHistory');
  }

  /**
   * Utilitaires pour le frontend
   */
  validateCommissionRate(rate) {
    const numRate = parseFloat(rate);
    return !isNaN(numRate) && numRate >= 0 && numRate <= 100;
  }

  formatCFA(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  calculateRevenueSplit(totalAmount, commissionRate) {
    const commission = (totalAmount * commissionRate) / 100;
    const vendorRevenue = totalAmount - commission;
    
    return {
      totalAmount,
      commissionRate,
      commissionAmount: Math.round(commission * 100) / 100,
      vendorRevenue: Math.round(vendorRevenue * 100) / 100
    };
  }

  /**
   * Debug - affiche les informations de debug
   */
  debugAuth() {
    console.group('🔍 Debug Authentification Commission Service');
    
    try {
      const token = this.getAuthToken();
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      console.log('✅ Token trouvé et valide');
      console.log('👤 Utilisateur:', {
        id: payload.sub || payload.id,
        email: payload.email,
        role: payload.role,
        exp: new Date(payload.exp * 1000).toLocaleString()
      });
    } catch (error) {
      console.log('❌ Problème auth:', error.message);
    }
    
    console.log('🌐 Configuration API:', {
      baseURL: this.baseURL,
      withCredentials: true
    });
    
    console.groupEnd();
  }
}

export default new CommissionService();