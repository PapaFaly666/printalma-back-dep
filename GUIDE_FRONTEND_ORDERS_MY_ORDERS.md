# Guide Frontend - Endpoint `/orders/my-orders`

## Description
L'endpoint `/orders/my-orders` permet aux vendeurs de récupérer toutes leurs commandes, que ce soit :
- Les commandes où ils sont l'utilisateur (nouvelles commandes invitées)
- Les commandes contenant leurs produits vendus (commandes clients)

## URL de l'API
```
GET http://localhost:3004/orders/my-orders
```

## Headers requis
```http
Content-Type: application/json
Authorization: Bearer <token_jwt>
Cookie: <auth_cookie>
```

## Réponse de l'API

### Structure principale
```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "data": [
    // Tableau de commandes
  ]
}
```

### Structure d'une commande
```json
{
  "id": 367,
  "orderNumber": "ORD-1764592087263",
  "userId": 6,
  "status": "CONFIRMED",
  "totalAmount": 9200,
  "phoneNumber": "789084423",
  "email": "werenoi@gmail.com",
  "paymentMethod": "PAYDUNYA",
  "paymentStatus": "PAID",
  "transactionId": "test_V6BsJ1HGdV",
  "createdAt": "2025-12-01T12:28:08.802Z",
  "updatedAt": "2025-12-01T12:28:26.801Z",

  // Informations de livraison
  "shippingName": "Werenoi OBA",
  "shippingStreet": "Carre",
  "shippingCity": "Fatick",
  "shippingCountry": "Sénégal",
  "shippingAddressFull": "Carre, Fatick, Sénégal",

  // Livraison (optionnel)
  "deliveryType": "city",
  "deliveryFee": 3200,
  "deliveryTime": "2-4 jours",

  // Métadonnées de livraison complètes
  "deliveryMetadata": {
    "tarif": {
      "amount": 3200,
      "currency": "XOF",
      "description": "Livraison standard au Sénégal",
      "deliveryTime": "2-4 jours"
    },
    "location": {
      "name": "Fatick",
      "type": "city",
      "countryCode": "SN",
      "countryName": "Sénégal"
    }
  },

  // Articles commandés
  "orderItems": [
    // Voir structure ci-dessous
  ],

  // Client
  "user": {
    "id": 6,
    "firstName": "Khaby",
    "lastName": "Lame",
    "email": "khaby@gmail.com",
    "phone": "778820042",
    "profile_photo_url": "https://...",
    "shop_name": "Lame"
  },

  // Vendeur (pour compatibilité)
  "vendor": {
    "id": 6,
    "firstName": "Khaby",
    "lastName": "Lame",
    "email": "khaby@gmail.com",
    "shopName": "Lame",
    "role": "VENDEUR"
  },

  // Informations de paiement
  "payment_info": {
    "status": "PAID",
    "status_text": "Payé",
    "status_icon": "✅",
    "status_color": "#28A745",
    "method": "PAYDUNYA",
    "method_text": "PayDunya",
    "transaction_id": "test_V6BsJ1HGdV",
    "attempts_count": 1,
    "recent_attempts": [
      {
        "attempt_number": 1,
        "status": "PENDING",
        "attempted_at": "2025-12-01T12:28:16.683Z",
        "payment_method": "paydunya"
      }
    ]
  },

  // Informations client (complètes)
  "customer_info": {
    "user_id": 6,
    "user_firstname": "Khaby",
    "user_lastname": "Lame",
    "user_email": "khaby@gmail.com",
    "user_phone": "778820042",
    "shipping_name": "Werenoi OBA",
    "shipping_email": "werenoi@gmail.com",
    "shipping_phone": "789084423",
    "full_name": "Werenoi OBA"
  }
}
```

### Structure d'un article de commande (OrderItem)
```json
{
  "id": 382,
  "productId": 1,
  "quantity": 1,
  "unitPrice": 6000,
  "totalPrice": 6000,
  "size": "X",
  "color": "Blanc",
  "colorId": 1,
  "vendorProductId": 25,

  // Produit de base
  "product": {
    "id": 1,
    "name": "Tshirt",
    "description": "C'est carré",
    "price": 6000,
    "status": "PUBLISHED",
    "orderedColorName": "Blanc",
    "orderedColorHexCode": "#ffffff",
    "orderedColorImageUrl": "https://..."
  },

  // Variation de couleur
  "colorVariation": {
    "id": 1,
    "name": "Blanc",
    "colorCode": "#ffffff",
    "productId": 1
  },

  // 🎨 DESIGN PERSONNALISÉ
  "designId": 9,
  "designMetadata": {
    "appliedAt": "2025-12-01T12:27:30.347Z",
    "designName": "khaby",
    "designCategory": "CUSTOM",
    "designImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1764549544/designs/6/1764549539952-khaby.jpg"
  },
  "designPositions": {
    "x": 0.5,
    "y": 0.5,
    "scale": 0.6,
    "rotation": 0,
    "constraints": {
      "maxScale": 2,
      "minScale": 0.1
    },
    "designWidth": 200,
    "designHeight": 200
  },
  "mockupUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761751317/printalma/1761751317062-Polo_blanc.jpg",

  // 🎨 SYSTÈME MULTI-VUES (si utilisé)
  "customizationIds": {},
  "designElementsByView": {},
  "viewsMetadata": [],

  // 🎨 DÉLIMITATIONS et VARIATIONS
  "delimitation": {
    "x": 411.60,
    "y": 327.50,
    "width": 376.67,
    "height": 466.67,
    "coordinateType": "PERCENTAGE",
    "referenceWidth": 1200,
    "referenceHeight": 1200
  },
  "delimitations": [
    {
      "x": 411.60,
      "y": 327.50,
      "width": 376.67,
      "height": 466.67,
      "coordinateType": "PERCENTAGE"
    }
  ],
  "colorVariationData": {
    "id": 1,
    "name": "Blanc",
    "colorCode": "#ffffff",
    "images": [
      {
        "id": 1,
        "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761751317/printalma/1761751317062-Polo_blanc.jpg",
        "delimitations": [
          {
            "x": 411.60,
            "y": 327.50,
            "width": 376.67,
            "height": 466.67,
            "coordinateType": "PERCENTAGE"
          }
        ]
      }
    ]
  },

  // Indicateurs de personnalisation
  "isCustomizedProduct": true,
  "customization": null
}
```

## Statuts possibles

### Statuts de commande (`status`)
- `PENDING` : En attente de validation
- `CONFIRMED` : Confirmée, en préparation
- `PROCESSING` : En cours de traitement
- `SHIPPED` : Expédiée
- `DELIVERED` : Livrée
- `CANCELLED` : Annulée
- `REJECTED` : Rejetée

### Statuts de paiement (`paymentStatus`)
- `PENDING` : En attente de paiement
- `PAID` : Payée
- `FAILED` : Échouée
- `CANCELLED` : Annulée
- `REFUNDED` : Remboursée
- `PROCESSING` : En traitement

### Méthodes de paiement (`paymentMethod`)
- `PAYDUNYA` : PayDunya
- `PAYTECH` : PayTech
- `CASH_ON_DELIVERY` : Paiement à la livraison
- `WAVE` : Wave
- `ORANGE_MONEY` : Orange Money

## Intégration Frontend

### Exemple React avec Axios
```jsx
import axios from 'axios';
import { useState, useEffect } from 'react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3004/orders/my-orders', {
        withCredentials: true, // Pour inclure les cookies
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des commandes');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher le statut avec couleur
  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { text: 'En attente', color: '#FFA500', icon: '⏳' },
      'CONFIRMED': { text: 'Confirmée', color: '#007BFF', icon: '✅' },
      'PROCESSING': { text: 'En cours', color: '#17A2B8', icon: '🔄' },
      'SHIPPED': { text: 'Expédiée', color: '#6F42C1', icon: '🚚' },
      'DELIVERED': { text: 'Livrée', color: '#28A745', icon: '🎉' },
      'CANCELLED': { text: 'Annulée', color: '#DC3545', icon: '❌' },
      'REJECTED': { text: 'Rejetée', color: '#6C757D', icon: '🚫' }
    };

    const config = statusConfig[status] || { text: status, color: '#6C757D', icon: '❓' };

    return (
      <span style={{
        backgroundColor: config.color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {config.icon} {config.text}
      </span>
    );
  };

  // Fonction pour afficher le statut de paiement
  const getPaymentStatus = (paymentInfo) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: paymentInfo.status_color }}>
          {paymentInfo.status_icon}
        </span>
        <span>{paymentInfo.status_text}</span>
        {paymentInfo.method_text && (
          <span style={{ fontSize: '12px', color: '#6C757D' }}>
            ({paymentInfo.method_text})
          </span>
        )}
      </div>
    );
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h1>Mes commandes</h1>

      {orders.length === 0 ? (
        <p>Vous n'avez aucune commande pour le moment.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#fff'
          }}>
            {/* En-tête de la commande */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Commande #{order.orderNumber}
                </h3>
                <p style={{ margin: '4px 0', color: '#6C757D', fontSize: '14px' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                {getStatusBadge(order.status)}
              </div>
            </div>

            {/* Informations client et paiement */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <h4>Client</h4>
                <p><strong>Nom :</strong> {order.customer_info?.full_name}</p>
                <p><strong>Email :</strong> {order.customer_info?.shipping_email}</p>
                <p><strong>Téléphone :</strong> {order.customer_info?.shipping_phone}</p>
                <p><strong>Adresse :</strong> {order.shippingAddressFull}</p>
              </div>

              <div>
                <h4>Paiement</h4>
                {getPaymentStatus(order.payment_info)}
                <p><strong>Montant :</strong> {order.totalAmount.toLocaleString()} XOF</p>
                {order.deliveryFee > 0 && (
                  <p><strong>Frais de livraison :</strong> {order.deliveryFee.toLocaleString()} XOF</p>
                )}
                <p><strong>Sous-total :</strong> {order.subtotal?.toLocaleString()} XOF</p>
                {order.transactionId && (
                  <p><strong>Transaction :</strong> {order.transactionId}</p>
                )}
              </div>
            </div>

            {/* Articles commandés */}
            <div>
              <h4>Articles commandés</h4>
              {order.orderItems.map((item, index) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  {/* Image du produit */}
                  <div style={{ width: '80px', height: '80px' }}>
                    {item.mockupUrl ? (
                      <img
                        src={item.mockupUrl}
                        alt={item.product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        fontSize: '10px',
                        textAlign: 'center'
                      }}>
                        Pas d'image
                      </div>
                    )}
                  </div>

                  {/* Détails du produit */}
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px 0' }}>
                      {item.product.name}
                      {item.isCustomizedProduct && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          backgroundColor: '#28A745',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          🎨 Personnalisé
                        </span>
                      )}
                    </h5>

                    <p style={{ margin: '2px 0', fontSize: '14px', color: '#6C757D' }}>
                      {item.quantity} × {item.unitPrice.toLocaleString()} XOF
                    </p>

                    {/* Détails personnalisation */}
                    {item.isCustomizedProduct && item.designMetadata && (
                      <div style={{ fontSize: '12px', color: '#6C757D' }}>
                        <p style={{ margin: '2px 0' }}>
                          <strong>Design :</strong> {item.designMetadata.designName}
                        </p>
                        <p style={{ margin: '2px 0' }}>
                          <strong>Couleur :</strong> {item.color} ({item.colorCode})
                        </p>
                        {item.size && (
                          <p style={{ margin: '2px 0' }}>
                            <strong>Taille :</strong> {item.size}
                          </p>
                        )}
                      </div>
                    )}

                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                      Total : {item.totalPrice?.toLocaleString() || (item.unitPrice * item.quantity).toLocaleString()} XOF
                    </p>
                  </div>

                  {/* Aperçu du design si personnalisé */}
                  {item.isCustomizedProduct && item.designMetadata?.designImageUrl && (
                    <div style={{ width: '60px', height: '60px' }}>
                      <img
                        src={item.designMetadata.designImageUrl}
                        alt="Design"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Informations de livraison */}
            {order.deliveryMetadata && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <h4>Informations de livraison</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p><strong>Type :</strong> {order.deliveryType === 'city' ? 'Ville' : 'Région'}</p>
                    <p><strong>Lieu :</strong> {order.deliveryMetadata.location?.name}</p>
                    <p><strong>Pays :</strong> {order.deliveryMetadata.location?.countryName}</p>
                  </div>
                  <div>
                    <p><strong>Transporteur :</strong> {order.transporteurName || 'Livraison standard'}</p>
                    <p><strong>Frais :</strong> {order.deliveryFee.toLocaleString()} XOF</p>
                    <p><strong>Délai :</strong> {order.deliveryTime}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
```

### Exemple avec Fetch natif
```javascript
async function getMyOrders() {
  try {
    const response = await fetch('http://localhost:3004/orders/my-orders', {
      method: 'GET',
      credentials: 'include', // Pour inclure les cookies
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('Commandes récupérées:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    throw error;
  }
}
```

## Points importants à noter

### 1. Produits personnalisés
- Un produit est personnalisé si `isCustomizedProduct` est `true`
- Les informations de design sont dans `designMetadata`
- L'image du design est dans `designMetadata.designImageUrl`
- Le mockup (produit avec design) est dans `mockupUrl`

### 2. Informations de livraison
- Si `deliveryMetadata` existe, la commande a des informations de livraison détaillées
- Les frais de livraison sont inclus dans `totalAmount`
- Le sous-total des produits est dans `subtotal`

### 3. Gestion des erreurs
- L'API retourne toujours `{ success: boolean, message: string, data: any }`
- En cas d'erreur HTTP (401, 403, 500), vérifiez `response.data.message`

### 4. Authentification
- Nécessite un token JWT valide ou un cookie d'authentification
- L'utilisateur doit avoir le rôle `VENDEUR` pour voir ses commandes

### 5. Pagination
- Actuellement, l'endpoint retourne toutes les commandes sans pagination
- Pour les gros volumes, envisagez d'ajouter une pagination côté backend

## Test rapide avec cURL
```bash
# Avec token JWT
curl -X GET 'http://localhost:3004/orders/my-orders' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT' \
  -H 'Content-Type: application/json'

# Avec cookie (si vous utilisez des sessions)
curl -X GET 'http://localhost:3004/orders/my-orders' \
  -H 'Content-Type: application/json' \
  --cookie 'auth=votre_cookie_auth'
```

## Débogage

### Commandes vides
Si vous ne voyez pas de commandes :
1. Vérifiez que l'utilisateur a le rôle `VENDEUR`
2. Vérifiez que vous avez des produits validés dans `VendorProduct`
3. Vérifiez les logs du backend pour d'éventuelles erreurs

### Problèmes d'images
Si les images ne s'affichent pas :
1. Vérifiez les URLs dans `mockupUrl` et `designImageUrl`
2. Assurez-vous que les URLs Cloudinary sont accessibles
3. Vérifiez les CORS si nécessaire

### Filtrage incorrect
Si vous voyez des commandes d'autres vendeurs :
1. Vérifiez la logique dans `getVendorOrders()` dans `order.service.ts`
2. Assurez-vous que `vendorProduct.vendorId` correspond bien à l'utilisateur connecté