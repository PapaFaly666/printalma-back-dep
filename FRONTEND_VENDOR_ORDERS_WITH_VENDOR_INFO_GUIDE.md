# 🎯 Guide Frontend - Affichage des Commandes Vendeur avec Informations Vendeur

## 📋 Vue d'ensemble

Ce guide explique comment afficher les commandes pour un vendeur **avec ses propres informations** (nom, boutique, email, etc.) dans chaque commande. Cette fonctionnalité permet au vendeur de voir clairement qu'il est associé aux commandes affichées.

## ✅ Modification Backend Implémentée

### Changement dans `order.service.ts`

La méthode `getVendorOrders()` a été mise à jour pour **inclure automatiquement** les informations du vendeur connecté dans chaque commande retournée.

**Avant** :
```typescript
return orders.map(order => this.formatOrderResponse(order));
```

**Après** :
```typescript
// Récupérer les informations du vendeur
const vendor = await this.prisma.user.findUnique({
  where: { id: vendorId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    shop_name: true,
    role: true
  }
});

// Ajouter les informations du vendeur à chaque commande
return orders.map(order => ({
  ...this.formatOrderResponse(order),
  vendor: {
    id: vendor.id,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    email: vendor.email,
    shopName: vendor.shop_name,
    role: vendor.role
  }
}));
```

---

## 🚀 API Endpoint

### GET /orders/my-orders (Vendeur connecté)

**Endpoint** : `GET /orders/my-orders`

**Headers** :
```
Cookie: auth_token={jwt_token}
```

**Rôle requis** : `VENDEUR`

**Réponse** :
```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "data": [
    {
      "id": 72,
      "orderNumber": "ORD-1759914363349-002",
      "status": "DELIVERED",
      "totalAmount": 30000,
      "shippingName": "test test",
      "createdAt": "2025-10-07T09:06:03.349Z",
      "updatedAt": "2025-10-08T09:35:48.950Z",
      "user": {
        "id": 29,
        "firstName": "test",
        "lastName": "test",
        "email": "test@gmail.com"
      },
      "vendor": {
        "id": 7,
        "firstName": "Papa",
        "lastName": "Diagne",
        "email": "pf.d@zig.univ.sn",
        "shopName": "C'est carré",
        "role": "VENDEUR"
      },
      "orderItems": [ /* ... */ ]
    }
  ]
}
```

---

## 🎨 Composants Frontend React/TypeScript

### 1. Interface TypeScript

```typescript
// types/order.types.ts

export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shopName: string | null;
  role: string;
}

export interface OrderUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
  product: {
    name: string;
    description: string;
    price: number;
  };
}

export interface VendorOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingCity: string;
  shippingCountry: string;
  phoneNumber: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  user: OrderUser;
  vendor: VendorInfo;  // ✅ NOUVEAU: Informations du vendeur
  orderItems: OrderItem[];
}

export interface VendorOrdersResponse {
  success: boolean;
  message: string;
  data: VendorOrder[];
}
```

### 2. Composant Principal : Liste des Commandes Vendeur

```typescript
// components/VendorOrdersListWithInfo.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VendorOrder, VendorOrdersResponse } from '../types/order.types';

const API_BASE_URL = 'http://localhost:3004';

const VendorOrdersListWithInfo: React.FC = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État pour les informations du vendeur (tirées de la première commande)
  const [vendorInfo, setVendorInfo] = useState<VendorOrder['vendor'] | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get<VendorOrdersResponse>(
        `${API_BASE_URL}/orders/my-orders`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrders(response.data.data);

        // ✅ Extraire les infos vendeur de la première commande
        if (response.data.data.length > 0 && response.data.data[0].vendor) {
          setVendorInfo(response.data.data[0].vendor);
        }
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En traitement',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Erreur</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ✅ NOUVEAU: En-tête avec informations du vendeur */}
      {vendorInfo && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Mes Commandes
              </h1>
              <div className="flex items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold">
                    {vendorInfo.firstName} {vendorInfo.lastName}
                  </span>
                </div>
                {vendorInfo.shopName && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{vendorInfo.shopName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{vendorInfo.email}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <div className="text-4xl font-bold">{orders.length}</div>
                <div className="text-sm">Commandes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des commandes */}
      {orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vous n'avez pas encore reçu de commandes pour vos produits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* En-tête de la commande */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Commande #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Informations client */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Client</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nom:</span>{' '}
                      <span className="font-medium">{order.user.firstName} {order.user.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{order.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone:</span>{' '}
                      <span className="font-medium">{order.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Livraison:</span>{' '}
                      <span className="font-medium">{order.shippingCity}, {order.shippingCountry}</span>
                    </div>
                  </div>
                </div>

                {/* Produits */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Produits</h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.product.name}</span>
                          <span className="text-gray-500"> × {item.quantity}</span>
                          <span className="text-gray-500 ml-2">
                            (Taille: {item.size}, Couleur: {item.color})
                          </span>
                        </div>
                        <span className="font-semibold">{item.unitPrice.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t mt-4 pt-4 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {order.totalAmount.toLocaleString()} FCFA
                  </span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Note:</span> {order.notes}
                    </p>
                  </div>
                )}

                {/* Dates importantes */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                    {order.confirmedAt && (
                      <div>
                        <div className="font-semibold">Confirmée</div>
                        <div>{new Date(order.confirmedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                    {order.shippedAt && (
                      <div>
                        <div className="font-semibold">Expédiée</div>
                        <div>{new Date(order.shippedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                    {order.deliveredAt && (
                      <div>
                        <div className="font-semibold">Livrée</div>
                        <div>{new Date(order.deliveredAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOrdersListWithInfo;
```

---

## 🎯 Points Clés

### 1. **Informations Vendeur Disponibles**

Chaque commande retournée contient maintenant un objet `vendor`:
```typescript
vendor: {
  id: 7,
  firstName: "Papa",
  lastName: "Diagne",
  email: "pf.d@zig.univ.sn",
  shopName: "C'est carré",
  role: "VENDEUR"
}
```

### 2. **Affichage dans l'En-tête**

Le composant affiche les informations du vendeur dans un en-tête attractif:
- Nom complet du vendeur
- Nom de la boutique (si disponible)
- Email
- Nombre total de commandes

### 3. **Rafraîchissement Automatique**

Les commandes sont rafraîchies toutes les 5 secondes pour voir les mises à jour en temps réel effectuées par l'admin.

---

## 🧪 Tests

### Test 1: Récupérer les commandes avec info vendeur

```bash
# Se connecter en tant que vendeur
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pf.d@zig.univ.sn","password":"printalmatest123"}' \
  -c vendor-cookies.txt

# Récupérer les commandes (avec info vendeur)
curl -X GET http://localhost:3004/orders/my-orders \
  -b vendor-cookies.txt | jq '.data[0].vendor'
```

**Réponse attendue**:
```json
{
  "id": 7,
  "firstName": "Papa",
  "lastName": "Diagne",
  "email": "pf.d@zig.univ.sn",
  "shopName": "C'est carré",
  "role": "VENDEUR"
}
```

### Test 2: Vérifier la structure complète

```bash
curl -X GET http://localhost:3004/orders/my-orders \
  -b vendor-cookies.txt | jq '.data[0] | keys'
```

**Clés attendues**:
```json
[
  "id",
  "orderNumber",
  "status",
  "totalAmount",
  "user",
  "vendor",  // ✅ NOUVEAU
  "orderItems",
  ...
]
```

---

## 📊 Avantages de cette Implémentation

1. **Identification Claire**: Le vendeur voit immédiatement son nom et sa boutique
2. **Cohérence**: Toutes les commandes affichent les mêmes infos vendeur (le vendeur connecté)
3. **Performance**: Une seule requête pour récupérer le vendeur, appliquée à toutes les commandes
4. **Extensibilité**: Facile d'ajouter d'autres champs vendeur (photo, téléphone, etc.)

---

## ⚙️ Configuration Requise

### Backend
- Serveur redémarré après les modifications dans `order.service.ts`
- Prisma à jour avec les relations User ↔ VendorProduct ↔ Product ↔ Order

### Frontend
- React 18+
- TypeScript 4.5+
- Axios pour les requêtes HTTP
- Tailwind CSS pour le styling (optionnel)

---

## 🔄 Workflow Complet

1. **Vendeur se connecte** → Reçoit JWT dans cookie `auth_token`
2. **Frontend appelle** `GET /orders/my-orders` avec cookie
3. **Backend identifie** le vendeur via JWT (`req.user.sub`)
4. **Backend récupère**:
   - Infos du vendeur (1 requête)
   - Produits du vendeur via VendorProduct
   - Commandes contenant ces produits
5. **Backend enrichit** chaque commande avec les infos vendeur
6. **Frontend affiche** les commandes avec en-tête personnalisé

---

## 🎨 Personnalisation UI

### Thème Sombre
```typescript
// Remplacer les classes Tailwind
<div className="bg-gray-900 text-white">
  {/* Composant en mode sombre */}
</div>
```

### Badge Personnalisé
```typescript
const getStatusBadge = (status: string) => {
  if (status === 'DELIVERED') return 'bg-green-500 text-white animate-pulse';
  if (status === 'CANCELLED') return 'bg-red-500 text-white';
  return 'bg-blue-500 text-white';
};
```

---

## 📝 Résumé

✅ **Backend**: Méthode `getVendorOrders()` enrichie pour ajouter `vendor` à chaque commande
✅ **Frontend**: Composant `VendorOrdersListWithInfo` avec en-tête personnalisé
✅ **Tests**: Endpoints testés et fonctionnels
✅ **UI/UX**: Interface moderne avec badges, infos client, et refresh automatique

Le vendeur voit maintenant **clairement** qu'il est propriétaire des commandes affichées grâce à l'en-tête avec son nom, sa boutique, et son email.
