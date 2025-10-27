/**
 * React Hook - usePaytech avec validation d'URLs
 * Version mise à jour pour résoudre les problèmes d'URLs
 */

import { useState, useCallback, useEffect } from 'react';

export const usePaytech = (baseUrl = 'http://localhost:3004') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Valider et nettoyer les URLs
  const validateAndCleanURL = useCallback((url) => {
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
      new URL(cleanUrl); // Valider l'URL
      return cleanUrl;
    } catch (error) {
      throw new Error(`URL invalide: ${error.message}`);
    }
  }, []);

  // Obtenir les URLs de redirection par défaut
  const getDefaultRedirectURLs = useCallback(() => {
    const origin = window.location.origin;
    return {
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`
    };
  }, []);

  // Valider les données de paiement
  const validatePaymentData = useCallback((paymentData) => {
    const cleanedData = { ...paymentData };
    const warnings = [];
    const defaultURLs = getDefaultRedirectURLs();

    // Valider et nettoyer success_url
    if (cleanedData.success_url) {
      try {
        cleanedData.success_url = validateAndCleanURL(cleanedData.success_url);
      } catch (error) {
        throw new Error(`success_url invalide: ${error.message}`);
      }
    } else {
      cleanedData.success_url = defaultURLs.success_url;
      warnings.push('success_url non fourni, utilisation de la valeur par défaut');
    }

    // Valider et nettoyer cancel_url
    if (cleanedData.cancel_url) {
      try {
        cleanedData.cancel_url = validateAndCleanURL(cleanedData.cancel_url);
      } catch (error) {
        throw new Error(`cancel_url invalide: ${error.message}`);
      }
    } else {
      cleanedData.cancel_url = defaultURLs.cancel_url;
      warnings.push('cancel_url non fourni, utilisation de la valeur par défaut');
    }

    // Valider ipn_url (optionnel)
    if (cleanedData.ipn_url) {
      try {
        cleanedData.ipn_url = validateAndCleanURL(cleanedData.ipn_url);
      } catch (error) {
        throw new Error(`ipn_url invalide: ${error.message}`);
      }
    }

    // Valider les champs requis
    const requiredFields = ['item_name', 'item_price', 'ref_command', 'command_name'];
    for (const field of requiredFields) {
      if (!cleanedData[field] || cleanedData[field].toString().trim().length === 0) {
        throw new Error(`Le champ '${field}' est requis`);
      }
    }

    if (cleanedData.item_price <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    if (cleanedData.item_price < 100) {
      throw new Error('Le montant minimum est de 100 XOF');
    }

    if (cleanedData.item_price > 1000000) {
      throw new Error('Le montant maximum est de 1 000 000 XOF');
    }

    setValidationWarnings(warnings);
    return cleanedData;
  }, [validateAndCleanURL, getDefaultRedirectURLs]);

  // Initialiser un paiement
  const initiatePayment = useCallback(async (paymentRequest, onSuccess, onError) => {
    setLoading(true);
    setError(null);
    setValidationWarnings([]);

    try {
      // Valider et nettoyer les données
      const cleanedData = validatePaymentData(paymentRequest);

      // Préparer les données avec validation d'environnement
      const paymentData = {
        ...cleanedData,
        env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
        currency: cleanedData.currency || 'XOF'
      };

      // Créer l'objet PaytechService
      const service = new (class PaytechService {
        constructor(baseUrl) {
          this.baseUrl = baseUrl;
        }

        async initializePayment(data) {
          const response = await fetch(`${this.baseUrl}/paytech/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Erreur');
          return result;
        }
      })(baseUrl);

      // Initialiser le paiement
      const response = await service.initializePayment(paymentData);

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
  }, [validatePaymentData, baseUrl]);

  // Créer un paiement simple (usage rapide)
  const createSimplePayment = useCallback(async (productName, amount, reference = null, onSuccess, onError) => {
    const origin = window.location.origin;

    const paymentData = {
      item_name: productName,
      item_price: amount,
      ref_command: reference || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      command_name: `Achat de ${productName}`,
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`
    };

    await initiatePayment(paymentData, onSuccess, onError);
  }, [initiatePayment]);

  // Vérifier le statut d'un paiement
  const checkStatus = useCallback(async (token) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/paytech/status/${token}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la vérification du statut');
      }

      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la vérification du statut';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [baseUrl]);

  // Tester la configuration
  const testConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/paytech/test-config`);
      const result = await response.json();
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du test de configuration';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [baseUrl]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentData(null);
    setValidationWarnings([]);
  }, []);

  // Effacer les warnings après 5 secondes
  useEffect(() => {
    if (validationWarnings.length > 0) {
      const timer = setTimeout(() => {
        setValidationWarnings([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [validationWarnings]);

  return {
    // État
    loading,
    error,
    paymentData,
    validationWarnings,

    // Actions
    initiatePayment,
    createSimplePayment,
    checkStatus,
    testConfig,
    reset,

    // Utilitaires
    validatePaymentData,
    getDefaultRedirectURLs
  };
};

// Hook pour gérer les retours de paiement
export const usePaytechReturn = () => {
  const [status, setStatus] = useState('loading');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const refCommand = urlParams.get('ref_command');

      if (!token) {
        setStatus('error');
        setError('Token de paiement manquant');
        return;
      }

      try {
        // Vérifier le statut du paiement
        const service = new (class {
          async checkStatus(token) {
            const response = await fetch(`http://localhost:3004/paytech/status/${token}`);
            return await response.json();
          }
        })();

        const paymentStatus = await service.checkStatus(token);

        setPaymentInfo({
          token,
          refCommand,
          status: paymentStatus.data?.status || 'UNKNOWN',
          amount: paymentStatus.data?.amount
        });

        if (paymentStatus.data?.status === 'PAID') {
          setStatus('success');
          // Rediriger après 3 secondes
          setTimeout(() => {
            window.location.href = '/orders';
          }, 3000);
        } else if (paymentStatus.data?.status === 'PENDING') {
          setStatus('pending');
          // Revérifier après 5 secondes
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        } else {
          setStatus('failed');
        }

      } catch (error) {
        setStatus('error');
        setError('Erreur lors de la vérification du paiement');
      }
    };

    handlePaymentReturn();
  }, []);

  return {
    status,
    paymentInfo,
    error
  };
};

export default usePaytech;