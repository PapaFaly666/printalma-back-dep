/**
 * React Hook - usePaytech
 * Hook personnalisé pour gérer les paiements Paytech dans React
 */

import { useState, useCallback } from 'react';
import { PaytechService } from './paytech-service';

export const usePaytech = (baseUrl = 'http://localhost:3004') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const paytechService = new PaytechService(baseUrl);

  /**
   * Initialiser un paiement
   * @param {Object} paymentRequest - Données du paiement
   * @param {Function} onSuccess - Callback en cas de succès
   * @param {Function} onError - Callback en cas d'erreur
   */
  const initiatePayment = useCallback(async (paymentRequest, onSuccess, onError) => {
    setLoading(true);
    setError(null);

    try {
      // Valider les données
      paytechService.validatePaymentData(paymentRequest);

      // Créer les données de paiement avec les URLs par défaut
      const paymentData = paytechService.createPaymentData(paymentRequest);

      // Initialiser le paiement
      const response = await paytechService.initializePayment(paymentData);

      setPaymentData(response.data);

      // Rediriger vers Paytech
      window.location.href = response.data.redirect_url;

      // Callback de succès
      if (onSuccess) {
        onSuccess(response.data);
      }

    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'initialisation du paiement';
      setError(errorMessage);
      setLoading(false);

      // Callback d'erreur
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [paytechService]);

  /**
   * Vérifier le statut d'un paiement
   * @param {string} token - Token du paiement
   * @returns {Promise<Object>} - Statut du paiement
   */
  const checkStatus = useCallback(async (token) => {
    setLoading(true);
    setError(null);

    try {
      const status = await paytechService.checkPaymentStatus(token);
      setLoading(false);
      return status;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la vérification du statut';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [paytechService]);

  /**
   * Tester la configuration
   * @returns {Promise<Object>} - Configuration
   */
  const testConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config = await paytechService.testConfiguration();
      setLoading(false);
      return config;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du test de configuration';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [paytechService]);

  /**
   * Réinitialiser l'état
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentData(null);
  }, []);

  return {
    // État
    loading,
    error,
    paymentData,

    // Actions
    initiatePayment,
    checkStatus,
    testConfig,
    reset
  };
};

export default usePaytech;