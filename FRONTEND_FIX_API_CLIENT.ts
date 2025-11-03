/**
 * SOLUTION COMPLÈTE POUR CORRIGER L'ERREUR "UNAUTHORIZED"
 *
 * Ce fichier contient le code corrigé à utiliser dans votre frontend
 * pour résoudre l'erreur Unauthorized sur /paydunya/payment
 *
 * IMPORTANT: Le backend fonctionne correctement sans authentification !
 * Le problème vient de l'intercepteur Axios qui ajoute automatiquement
 * le token JWT même pour les endpoints publics.
 */

// ============================================================================
// SOLUTION 1: CONFIGURATION API AVEC EXCLUSION DES ENDPOINTS PUBLICS
// ============================================================================
// Fichier: src/lib/api.ts (ou votre fichier de configuration API)

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// ✅ Liste des endpoints qui ne nécessitent PAS d'authentification
const PUBLIC_ENDPOINTS = [
  '/paydunya/payment',        // ⭐ IMPORTANT: Endpoint de paiement
  '/paydunya/status/',
  '/paydunya/test-config',
  '/paydunya/callback',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * Vérifie si une URL correspond à un endpoint public
 */
const isPublicEndpoint = (url: string = ''): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Client API principal avec gestion des endpoints publics
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

/**
 * Intercepteur de requête - Ajoute le token JWT sauf pour les endpoints publics
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';

    console.log(`[API] 📤 ${config.method?.toUpperCase()} ${url}`);

    // ✅ NE PAS ajouter le token pour les endpoints publics
    if (isPublicEndpoint(url)) {
      console.log('[API] 🔓 Endpoint public - Pas de token ajouté');
      return config;
    }

    // ✅ Ajouter le token pour les endpoints protégés
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] 🔐 Token JWT ajouté');
    } else {
      console.log('[API] ⚠️ Pas de token disponible');
    }

    return config;
  },
  (error) => {
    console.error('[API] ❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse - Gère les erreurs
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    console.error(`[API] ❌ ${status} ${url}`, error.response?.data);

    // ✅ Rediriger vers login SEULEMENT pour les endpoints protégés
    if (status === 401) {
      if (!isPublicEndpoint(url)) {
        console.log('[API] 🔒 Token invalide - Redirection vers login');
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      } else {
        console.error('[API] ⚠️ Erreur 401 sur endpoint public - Vérifier le backend');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ============================================================================
// SOLUTION 2: SERVICE DE PAIEMENT AVEC GESTION EXPLICITE
// ============================================================================
// Fichier: src/services/payment.service.ts

import type {
  PayDunyaPaymentRequest,
  PayDunyaPaymentResponse,
  PaymentStatus,
} from '../types/payment';

export class PaymentService {
  /**
   * ⭐ Initialiser un paiement PayDunya
   * IMPORTANT: Cet endpoint est PUBLIC - pas besoin d'authentification
   */
  static async initializePayment(
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ): Promise<PayDunyaPaymentResponse> {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174';
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';

    const payload: PayDunyaPaymentRequest = {
      invoice: {
        total_amount: amount,
        description: `Commande Printalma #${orderNumber}`,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        channels: ['orange-money-senegal', 'wave-senegal'],
      },
      store: {
        name: 'Printalma Store',
        tagline: 'Impression de qualité professionnelle',
        phone: '+221338234567',
        website_url: frontendUrl,
      },
      actions: {
        callback_url: `${backendUrl}/paydunya/callback`,
        return_url: `${frontendUrl}/orders/${orderNumber}/success`,
        cancel_url: `${frontendUrl}/orders/${orderNumber}/cancel`,
      },
      custom_data: {
        order_number: orderNumber,
        user_id: customer.email,
        platform: 'web',
      },
    };

    try {
      console.log('[PaymentService] 🔄 Initialisation paiement:', { orderNumber, amount });

      // ✅ Utiliser apiClient configuré avec gestion des endpoints publics
      const response = await apiClient.post<PayDunyaPaymentResponse>(
        '/paydunya/payment',
        payload
      );

      console.log('[PaymentService] ✅ Paiement initialisé:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('[PaymentService] ❌ Erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de l\'initialisation du paiement'
      );
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * Cet endpoint est également PUBLIC
   */
  static async checkPaymentStatus(token: string): Promise<PaymentStatus> {
    try {
      console.log('[PaymentService] 🔍 Vérification statut:', token);

      const response = await apiClient.get<PaymentStatus>(
        `/paydunya/status/${token}`
      );

      console.log('[PaymentService] ✅ Statut:', response.data.data.status);
      return response.data;

    } catch (error: any) {
      console.error('[PaymentService] ❌ Erreur statut:', error);
      throw error;
    }
  }
}

// ============================================================================
// SOLUTION 3: ALTERNATIVE AVEC FETCH (SI AXIOS POSE PROBLÈME)
// ============================================================================

export class PaymentServiceFetch {
  /**
   * Version avec fetch natif (bypass axios)
   */
  static async initializePayment(
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ): Promise<PayDunyaPaymentResponse> {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174';

    const payload = {
      invoice: {
        total_amount: amount,
        description: `Commande Printalma #${orderNumber}`,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        channels: ['orange-money-senegal', 'wave-senegal'],
      },
      store: {
        name: 'Printalma Store',
        tagline: 'Impression de qualité',
      },
      actions: {
        callback_url: `${backendUrl}/paydunya/callback`,
        return_url: `${frontendUrl}/orders/${orderNumber}/success`,
        cancel_url: `${frontendUrl}/orders/${orderNumber}/cancel`,
      },
      custom_data: {
        order_number: orderNumber,
        user_id: customer.email,
      },
    };

    try {
      console.log('[PaymentServiceFetch] 🔄 Initialisation:', orderNumber);

      // ✅ NE PAS inclure Authorization dans les headers
      const response = await fetch(`${backendUrl}/paydunya/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ⭐ PAS de Authorization ici !
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('[PaymentServiceFetch] ✅ Succès:', data);
      return data;

    } catch (error: any) {
      console.error('[PaymentServiceFetch] ❌ Erreur:', error);
      throw error;
    }
  }
}

// ============================================================================
// HOOK REACT PERSONNALISÉ
// ============================================================================
// Fichier: src/hooks/usePayment.ts

import { useState } from 'react';

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[usePayment] 🚀 Démarrage paiement:', { orderNumber, amount });

      // ✅ Utiliser le service avec la configuration corrigée
      const response = await PaymentService.initializePayment(
        orderNumber,
        amount,
        customer
      );

      if (response.success && response.data.redirect_url) {
        console.log('[usePayment] ✅ Redirection vers PayDunya:', response.data.redirect_url);
        // Rediriger vers PayDunya
        window.location.href = response.data.redirect_url;
        return response;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du paiement';
      console.error('[usePayment] ❌ Erreur:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PaymentService.checkPaymentStatus(token);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de vérification';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    checkStatus,
    isLoading,
    error,
  };
};

// ============================================================================
// TESTS DE VÉRIFICATION
// ============================================================================

/**
 * Test 1: Vérifier que l'endpoint est accessible sans token
 */
export const testPayDunyaEndpoint = async () => {
  console.log('🧪 Test: Endpoint PayDunya sans authentification');

  try {
    const response = await fetch('http://localhost:3004/paydunya/test-config');
    const data = await response.json();

    if (data.success) {
      console.log('✅ Backend PayDunya opérationnel');
      return true;
    } else {
      console.error('❌ Backend PayDunya non configuré');
      return false;
    }
  } catch (error) {
    console.error('❌ Impossible de contacter le backend:', error);
    return false;
  }
};

/**
 * Test 2: Vérifier que l'intercepteur fonctionne correctement
 */
export const testInterceptor = () => {
  console.log('🧪 Test: Vérification de l\'intercepteur');

  // Tester avec un endpoint public
  const publicUrl = '/paydunya/payment';
  const isPublic = isPublicEndpoint(publicUrl);

  if (isPublic) {
    console.log('✅ Endpoint PayDunya détecté comme public');
    return true;
  } else {
    console.error('❌ Endpoint PayDunya non détecté comme public');
    return false;
  }
};

/**
 * Test 3: Vérifier la configuration CORS
 */
export const testCORS = async () => {
  console.log('🧪 Test: Configuration CORS');

  try {
    const response = await fetch('http://localhost:3004/paydunya/test-config', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174',
      },
    });

    if (response.ok) {
      console.log('✅ CORS configuré correctement');
      return true;
    } else {
      console.error('❌ Erreur CORS:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur CORS:', error);
    return false;
  }
};

// ============================================================================
// INSTRUCTIONS D'UTILISATION
// ============================================================================

/**
 * ÉTAPES POUR CORRIGER L'ERREUR "UNAUTHORIZED":
 *
 * 1. Remplacer votre fichier src/lib/api.ts par la SOLUTION 1 ci-dessus
 *
 * 2. Remplacer votre fichier src/services/payment.service.ts par la SOLUTION 2
 *
 * 3. Tester la configuration:
 *    - Ouvrir la console du navigateur
 *    - Exécuter: await testPayDunyaEndpoint()
 *    - Vérifier que vous voyez: "✅ Backend PayDunya opérationnel"
 *
 * 4. Tester un paiement:
 *    - Créer une commande
 *    - Cliquer sur "Payer"
 *    - Vérifier dans Network que /paydunya/payment ne contient PAS de header Authorization
 *    - Vous devriez être redirigé vers PayDunya
 *
 * 5. En cas de problème persistant:
 *    - Vider le cache du navigateur
 *    - Supprimer localStorage.clear()
 *    - Recharger la page
 *
 * SUPPORT:
 * - Documentation: FIX_UNAUTHORIZED_ERROR.md
 * - Guide complet: FRONTEND_INTEGRATION_PAYDUNYA.md
 * - Référence rapide: PAYDUNYA_API_QUICK_REFERENCE.md
 */

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export { apiClient, PaymentService, PaymentServiceFetch, usePayment };
export { testPayDunyaEndpoint, testInterceptor, testCORS };
