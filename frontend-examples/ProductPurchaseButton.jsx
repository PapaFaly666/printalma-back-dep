import React, { useState, useEffect } from 'react';
import { useOrder } from '../hooks/useOrder';

/**
 * Composant de bouton d'achat complet avec gestion Paytech
 *
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.product - Produit à acheter
 * @param {string} props.className - Classes CSS supplémentaires
 * @param {boolean} props.showShippingForm - Afficher le formulaire de livraison
 * @param {Function} props.onSuccess - Callback en cas de succès
 * @param {Function} props.onError - Callback en cas d'erreur
 * @param {Object} props.defaultOptions - Options par défaut
 */
const ProductPurchaseButton = ({
  product,
  className = '',
  showShippingForm = false,
  onSuccess,
  onError,
  defaultOptions = {}
}) => {
  const { createQuickOrder, loading, error, currentOrder } = useOrder();

  // État du composant
  const [quantity, setQuantity] = useState(defaultOptions.quantity || 1);
  const [selectedSize, setSelectedSize] = useState(defaultOptions.size || 'M');
  const [selectedColor, setSelectedColor] = useState(defaultOptions.color || 'Blanc');
  const [showForm, setShowForm] = useState(showShippingForm);
  const [userToken, setUserToken] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // État pour le formulaire de livraison
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    street: '',
    city: 'Dakar',
    region: 'Dakar',
    postalCode: '12345',
    country: 'Sénégal',
    phone: '',
    notes: ''
  });

  // Récupérer le token utilisateur et les infos
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');

    setUserToken(token);

    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setShippingInfo(prev => ({
          ...prev,
          fullName: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim(),
          street: parsed.address || '',
          city: parsed.city || 'Dakar',
          region: parsed.region || 'Dakar',
          postalCode: parsed.postalCode || '12345',
          country: parsed.country || 'Sénégal',
          phone: parsed.phone || ''
        }));
      } catch (error) {
        console.error('Erreur parsing user info:', error);
      }
    }
  }, []);

  // Gérer l'achat
  const handlePurchase = async () => {
    if (!userToken) {
      setShowLoginPrompt(true);
      return;
    }

    // Validation des informations de livraison si formulaire affiché
    if (showForm) {
      if (!shippingInfo.fullName || !shippingInfo.street || !shippingInfo.phone) {
        alert('Veuillez compléter les informations de livraison');
        return;
      }
    }

    try {
      // Préparer le produit avec les sélections
      const productWithOptions = {
        ...product,
        selectedSize,
        selectedColor
      };

      // Options pour la commande
      const orderOptions = {
        notes: shippingInfo.notes,
        phoneNumber: shippingInfo.phone
      };

      await createQuickOrder(productWithOptions, quantity, userToken, orderOptions);

      if (onSuccess) {
        onSuccess(currentOrder);
      }

      // Mettre à jour les infos utilisateur si formulaire affiché
      if (showForm) {
        localStorage.setItem('userInfo', JSON.stringify({
          ...JSON.parse(localStorage.getItem('userInfo') || '{}'),
          address: shippingInfo.street,
          city: shippingInfo.city,
          region: shippingInfo.region,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone
        }));
      }

    } catch (error) {
      console.error('Purchase error:', error);
      if (onError) {
        onError(error.message);
      } else {
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  // Calculer le prix total
  const totalPrice = (product.price || 0) * quantity;

  // Si pas de token utilisateur, afficher l'invite de connexion
  if (!userToken) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 mb-4">Connectez-vous pour effectuer un achat</p>
        </div>

        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
          <button
            onClick={() => window.location.href = '/register'}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Créer un compte
          </button>
        </div>

        {showLoginPrompt && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Vous devez être connecté pour pouvoir acheter des produits.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Options du produit */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4">Options du produit</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité
            </label>
            <input
              type="number"
              min="1"
              max={product.stock || 10}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Taille */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {product.sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          {/* Couleur */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {product.colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Prix total */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">
              {totalPrice.toLocaleString()} XOF
            </span>
          </div>
        </div>
      </div>

      {/* Formulaire de livraison (optionnel) */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Informations de livraison</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                value={shippingInfo.fullName}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                value={shippingInfo.phone}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="77XXXXXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <input
                type="text"
                value={shippingInfo.street}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre adresse complète"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Région
              </label>
              <input
                type="text"
                value={shippingInfo.region}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={shippingInfo.postalCode}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <input
                type="text"
                value={shippingInfo.country}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={shippingInfo.notes}
                onChange={(e) => setShippingInfo(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Instructions spéciales pour la livraison..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Bouton d'achat principal */}
      <button
        onClick={handlePurchase}
        disabled={loading || !product.stock || product.stock < quantity}
        className={`w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg ${className}`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            <span>Traitement en cours...</span>
          </div>
        ) : product.stock && product.stock < quantity ? (
          `Stock insuffisant (${product.stock} disponibles)`
        ) : (
          `Acheter ${quantity} × ${totalPrice.toLocaleString()} XOF`
        )}
      </button>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de commande */}
      {currentOrder && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold">Commande créée avec succès !</p>
              <p className="text-sm">Numéro: #{currentOrder.orderNumber}</p>
              <p className="text-sm">Montant: {currentOrder.totalAmount.toLocaleString()} XOF</p>
              {currentOrder.paymentData && (
                <p className="text-sm mt-1">Redirection vers la page de paiement...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Options supplémentaires */}
      <div className="flex justify-between items-center text-sm">
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showForm ? 'Masquer' : 'Afficher'} les détails de livraison
        </button>

        <div className="text-gray-500">
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Paiement sécurisé Paytech
          </span>
        </div>
      </div>

      {/* Informations sur le produit */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold mb-1">Processus d'achat :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Cliquez sur "Acheter" pour créer votre commande</li>
              <li>Vous serez redirigé vers la page de paiement sécurisée Paytech</li>
              <li>Effectuez le paiement avec votre méthode préférée</li>
              <li>Recevez une confirmation et suivez votre commande</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPurchaseButton;