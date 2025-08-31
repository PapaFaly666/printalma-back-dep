# Système de Commandes - Documentation

## Vue d'ensemble

Le système de commandes permet aux utilisateurs de passer des commandes de produits et aux administrateurs de les gérer. Il comprend :

- Création de commandes par les utilisateurs
- Gestion des statuts de commandes par les administrateurs
- Suivi des commandes
- Gestion automatique du stock

## Modèles de données

### Order (Commande)
- `id`: Identifiant unique
- `orderNumber`: Numéro de commande unique (format: CMD20241225XXXX)
- `userId`: ID de l'utilisateur qui a passé la commande
- `status`: Statut de la commande (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REJECTED)
- `totalAmount`: Montant total de la commande
- `shippingAddress`: Adresse de livraison
- `phoneNumber`: Numéro de téléphone
- `notes`: Notes optionnelles
- `validatedBy`: ID de l'administrateur qui a validé la commande
- `validatedAt`: Date de validation

### OrderItem (Article de commande)
- `id`: Identifiant unique
- `orderId`: ID de la commande
- `productId`: ID du produit
- `quantity`: Quantité commandée
- `unitPrice`: Prix unitaire au moment de la commande
- `size`: Taille sélectionnée (optionnel)
- `color`: Couleur sélectionnée (optionnel)

## Statuts de commande

1. **PENDING**: Commande en attente de validation
2. **CONFIRMED**: Commande confirmée par l'admin
3. **PROCESSING**: Commande en cours de traitement
4. **SHIPPED**: Commande expédiée
5. **DELIVERED**: Commande livrée
6. **CANCELLED**: Commande annulée par l'utilisateur
7. **REJECTED**: Commande rejetée par l'admin

## Endpoints API

### Pour les utilisateurs

#### Créer une commande
```
POST /orders
Authorization: Bearer token
Content-Type: application/json

{
  "shippingAddress": "123 Rue de la Paix, Paris",
  "phoneNumber": "+33123456789",
  "notes": "Livraison en matinée",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "size": "M",
      "color": "Rouge"
    },
    {
      "productId": 2,
      "quantity": 1,
      "size": "L"
    }
  ]
}
```

#### Voir ses commandes
```
GET /orders/my-orders
Authorization: Bearer token
```

#### Voir une commande spécifique
```
GET /orders/:id
Authorization: Bearer token
```

#### Annuler une commande
```
DELETE /orders/:id/cancel
Authorization: Bearer token
```

### Pour les administrateurs

#### Voir toutes les commandes
```
GET /orders/admin/all?page=1&limit=10&status=PENDING
Authorization: Bearer token (Admin/SuperAdmin)
```

#### Mettre à jour le statut d'une commande
```
PATCH /orders/:id/status
Authorization: Bearer token (Admin/SuperAdmin)
Content-Type: application/json

{
  "status": "CONFIRMED",
  "notes": "Commande validée et en cours de préparation"
}
```

#### Statistiques des commandes
```
GET /orders/admin/statistics
Authorization: Bearer token (Admin/SuperAdmin)
```

## Règles de gestion

### Création de commande
1. Vérification de la disponibilité des produits
2. Vérification du stock suffisant
3. Calcul automatique du montant total
4. Génération d'un numéro de commande unique
5. Décrémentation automatique du stock

### Transitions de statut autorisées
- PENDING → CONFIRMED, REJECTED, CANCELLED
- CONFIRMED → PROCESSING, CANCELLED
- PROCESSING → SHIPPED, CANCELLED
- SHIPPED → DELIVERED
- DELIVERED → (aucune transition)
- CANCELLED → (aucune transition)
- REJECTED → (aucune transition)

### Annulation de commande
- Seules les commandes PENDING peuvent être annulées par l'utilisateur
- L'annulation remet automatiquement le stock
- Les admins peuvent annuler à tout moment (sauf DELIVERED)

## Exemples d'utilisation

### Frontend - Créer une commande

```javascript
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Commande créée:', result.data);
      // Rediriger vers la page de confirmation
    } else {
      console.error('Erreur:', result.message);
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
  }
};

// Exemple d'utilisation
const orderData = {
  shippingAddress: "123 Rue de la Paix, 75001 Paris",
  phoneNumber: "+33123456789",
  notes: "Livraison en matinée de préférence",
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      color: "Bleu"
    }
  ]
};

createOrder(orderData);
```

### Frontend - Interface admin pour valider une commande

```javascript
const updateOrderStatus = async (orderId, status, notes) => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status, notes })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Statut mis à jour:', result.data);
      // Actualiser la liste des commandes
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Exemple d'utilisation
updateOrderStatus(123, 'CONFIRMED', 'Commande validée et en préparation');
```

## Sécurité

- Authentification JWT requise pour tous les endpoints
- Les utilisateurs ne peuvent voir que leurs propres commandes
- Seuls les admins peuvent modifier les statuts de commandes
- Validation des données d'entrée avec class-validator
- Vérification des autorisations à chaque étape

## Installation et configuration

1. Appliquer la migration Prisma :
```bash
npx prisma migrate dev --name add-order-system
```

2. Générer le client Prisma :
```bash
npx prisma generate
```

3. Le module OrderModule est automatiquement importé dans AppModule

## Tests

Pour tester le système de commandes, vous pouvez utiliser les scripts de test fournis ou utiliser un client REST comme Postman avec les endpoints documentés ci-dessus.

## Améliorations futures possibles

1. Notifications par email lors des changements de statut
2. Système de paiement intégré
3. Calcul automatique des frais de livraison
4. Historique détaillé des modifications
5. Rapports et analytics avancés
6. API webhooks pour intégrations tierces 