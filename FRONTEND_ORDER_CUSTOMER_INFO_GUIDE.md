# 📄 Guide Frontend: Afficher les Informations Client des Commandes

## 🎯 Vue d'Ensemble

Ce guide explique comment récupérer et afficher les informations du client (utilisateur) associées aux commandes PrintAlma à partir des endpoints de l'API.

**Base URL pour les Commandes:** `http://localhost:3004/orders`

**Authentification:** Toutes les requêtes nécessitent les cookies d'authentification (`credentials: 'include'`) et un token JWT valide.

---

## 📚 Table des Matières

1.  [Structure des Données Client](#1-structure-des-données-client)
2.  [Récupérer Toutes les Commandes (Admin)](#2-récupérer-toutes-les-commandes-admin)
3.  [Récupérer une Commande Spécifique](#3-récupérer-une-commande-spécifique)
4.  [Récupérer les Commandes de l'Utilisateur Connecté](#4-récupérer-les-commandes-de-lutilisateur-connecté)
5.  [Exemples d'Utilisation Frontend](#5-exemples-dutilisation-frontend)

---

## 1. Structure des Données Client

Dans les réponses des endpoints de commande, les informations du client qui a passé la commande sont incluses dans un objet `user` imbriqué dans l'objet de la commande.

### Objet `user` (Client)

```json
{
  // ... autres champs de la commande ...
  "user": {
    "id": 42,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "role": "USER", // Peut être "USER", "ADMIN", "SUPERADMIN"
    "avatar": "https://example.com/path/to/avatar.jpg", // URL de l'avatar, peut être null
    "isActive": true, // Si le compte utilisateur est actif
    "createdAt": "2023-01-15T10:00:00.000Z"
    // D'autres champs de profil utilisateur pourraient être disponibles ici
  }
  // ... autres champs de la commande ...
}
```

**Champs Clés à Utiliser :**

*   `user.id`: ID unique du client.
*   `user.firstName`: Prénom du client.
*   `user.lastName`: Nom de famille du client.
*   `user.email`: Adresse e-mail du client.
*   `user.avatar`: Pour afficher une image de profil.

---

## 2. Récupérer Toutes les Commandes (Admin)

Cet endpoint est généralement utilisé dans le backoffice admin pour lister toutes les commandes.

*   **Endpoint :** `GET /orders`
*   **Accès :** ADMIN, SUPERADMIN
*   **Paramètres de Requête (Optionnels) :**
    *   `page` (number, défaut: 1) : Numéro de la page pour la pagination.
    *   `limit` (number, défaut: 10) : Nombre d'éléments par page.
    *   `status` (string) : Filtrer par statut de commande (ex: `PENDING`, `CONFIRMED`).

### Exemple de Réponse (Abrégé)

```javascript
// Requête: GET http://localhost:3004/orders?limit=1

{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "CMD20241127001",
        "totalAmount": 89.99,
        "status": "CONFIRMED",
        "user": { // <--- Informations du client ici
          "id": 42,
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean.dupont@example.com"
        },
        "orderItems": [ /* ... */ ]
      }
      // ... potentiellement d'autres commandes
    ],
    "total": 150,
    "page": 1,
    "totalPages": 15
  },
  "message": "Commandes récupérées avec succès"
}
```

### Utilisation Frontend (Admin)

Pour chaque commande dans la liste `orders`, vous pouvez accéder à `order.user.firstName`, `order.user.lastName`, etc., pour afficher qui a passé la commande.

```javascript
// Exemple React pour afficher le nom du client dans une liste de commandes (admin)
function AdminOrderList({ orders }) {
  return (
    <ul>
      {orders.map(order => (
        <li key={order.id}>
          Commande #{order.orderNumber} - Client: {order.user.firstName} {order.user.lastName}
          <p>Email: {order.user.email}</p>
          {/* ... autres détails de la commande ... */}
        </li>
      ))}
    </ul>
  );
}
```

---

## 3. Récupérer une Commande Spécifique

Permet d'obtenir les détails d'une seule commande, y compris les informations du client.

*   **Endpoint :** `GET /orders/:id` (remplacer `:id` par l'ID de la commande)
*   **Accès :**
    *   ADMIN, SUPERADMIN : Peuvent accéder à n'importe quelle commande.
    *   Utilisateur connecté : Peut accéder uniquement à ses propres commandes.

### Exemple de Réponse (Abrégé)

```javascript
// Requête: GET http://localhost:3004/orders/123

{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "CMD20241127001",
    "totalAmount": 89.99,
    "status": "CONFIRMED",
    "shippingAddress": "123 Rue Principale, Ville",
    "user": { // <--- Informations du client ici
      "id": 42,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "avatar": null
    },
    "orderItems": [ /* ... */ ]
    // ... autres champs de la commande
  },
  "message": "Commande récupérée avec succès"
}
```

### Utilisation Frontend (Détail de Commande)

Sur une page de détail de commande, vous pouvez afficher les informations complètes du client.

```javascript
// Exemple React pour afficher les détails du client sur une page de commande
function OrderDetailPage({ order }) {
  if (!order) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Commande #{order.orderNumber}</h1>
      <h2>Informations Client</h2>
      {order.user.avatar && <img src={order.user.avatar} alt="Avatar client" width="50" />}
      <p>Nom: {order.user.firstName} {order.user.lastName}</p>
      <p>Email: {order.user.email}</p>
      <p>Adresse de livraison: {order.shippingAddress}</p>
      {/* ... reste des détails de la commande ... */}
    </div>
  );
}
```

---

## 4. Récupérer les Commandes de l'Utilisateur Connecté

Permet à un utilisateur de voir sa propre liste de commandes.

*   **Endpoint :** `GET /orders/my-orders`
*   **Accès :** Utilisateur connecté (nécessite un token JWT valide)

### Exemple de Réponse (Abrégé)

La réponse est un tableau de commandes. Chaque commande dans le tableau aura la même structure que celle de `GET /orders/:id`, avec l'objet `user` représentant l'utilisateur connecté.

```javascript
// Requête: GET http://localhost:3004/orders/my-orders

{
  "success": true,
  "data": [
    {
      "id": 123,
      "orderNumber": "CMD20241127001",
      "totalAmount": 89.99,
      "status": "CONFIRMED",
      "user": { // <--- Informations de l'utilisateur connecté
        "id": 42, // L'ID correspondra à l'utilisateur authentifié
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com"
      },
      "orderItems": [ /* ... */ ]
    },
    // ... autres commandes de l'utilisateur
  ],
  "message": "Commandes de l'utilisateur récupérées avec succès"
}
```

### Utilisation Frontend (Espace Client)

Dans un espace client, vous pouvez lister les commandes de l'utilisateur. Bien que les informations `user` soient présentes, elles sont souvent redondantes car l'utilisateur consulte ses propres informations. Elles peuvent néanmoins être utiles pour confirmation ou si le profil de l'utilisateur a changé depuis la commande.

```javascript
// Exemple React pour lister les commandes dans un espace client
function UserOrdersPage({ orders }) {
  return (
    <div>
      <h1>Mes Commandes</h1>
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h3>Commande #{order.orderNumber}</h3>
          <p>Status: {order.status}</p>
          <p>Montant Total: {order.totalAmount} €</p>
          {/* L'affichage de order.user.firstName ici est optionnel,
              car l'utilisateur est déjà connecté et connaît son nom. */}
          {/* ... lien vers le détail de la commande ... */}
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Exemples d'Utilisation Frontend

### a. Afficher le nom complet du client

```javascript
const clientName = (order.user.firstName && order.user.lastName) 
  ? `${order.user.firstName} ${order.user.lastName}` 
  : order.user.email; // Fallback à l'email si nom/prénom manquants
```

### b. Afficher un avatar avec fallback

```javascript
const avatarUrl = order.user.avatar || '/path/to/default-avatar.png';
// <img src={avatarUrl} alt={`Avatar de ${clientName}`} />
```

### c. Contacter le client (Admin)

Dans une interface admin, vous pourriez vouloir un bouton "Contacter par email" :

```javascript
// <a href={`mailto:${order.user.email}`}>Contacter {clientName}</a>
```

### d. Vérifier le rôle du client (si nécessaire)

```javascript
if (order.user.role === 'USER') {
  // Logique spécifique pour les clients standards
}
```

---

## ⚠️ Important: Formatage du `shippingAddress` (Côté Frontend)

Le backend attend le champ `shippingAddress` comme une **chaîne de caractères unique** lors de la création d'une commande (`POST /orders`). Pour éviter les problèmes de "undefined undefined" dans l'adresse stockée (comme vu dans votre exemple de réponse), le frontend est responsable de construire cette chaîne correctement.

**Problème:** Si le formulaire d'adresse du frontend a des champs optionnels (ex: prénom/nom de livraison, société, appartement) qui sont laissés vides, et que le frontend les concatène directement, cela produira des "undefined" dans la chaîne.

**Solution (Côté Frontend):** Avant d'envoyer la requête de création de commande, construisez la chaîne `shippingAddress` en vérifiant chaque composant de l'adresse et en ignorant ceux qui sont vides ou `undefined`.

### Exemple de Construction Robuste de `shippingAddress` (JavaScript Frontend)

```javascript
// Supposons un objet addressForm provenant de votre formulaire
const addressForm = {
  firstName: shippingDetails.firstName, // Peut être vide/undefined
  lastName: shippingDetails.lastName,   // Peut être vide/undefined
  company: shippingDetails.company,     // Peut être vide/undefined
  street: shippingDetails.street,       // Ex: "123 Rue Principale"
  apartment: shippingDetails.apartment, // Ex: "Appt 4B", peut être vide/undefined
  city: shippingDetails.city,           // Ex: "Rufisque"
  region: shippingDetails.region,       // Ex: "Dakar", peut être vide/undefined
  postalCode: shippingDetails.postalCode, // Peut être vide/undefined
  country: shippingDetails.country      // Ex: "Sénégal"
};

const addressParts = [];

// Ligne 1: Prénom Nom (ou Société si prénom/nom vides)
const nameLine = [`${addressForm.firstName || ''}`, `${addressForm.lastName || ''}`].join(' ').trim();
if (nameLine) {
  addressParts.push(nameLine);
} else if (addressForm.company) {
  addressParts.push(addressForm.company.trim());
}

// Ligne 2: Société (si nom/prénom ET société sont présents)
if (nameLine && addressForm.company) {
  addressParts.push(addressForm.company.trim());
}

// Ligne 3: Rue et appartement/numéro
const streetLine = [`${addressForm.street || ''}`, `${addressForm.apartment || ''}`].join(' ').trim();
if (streetLine) {
  addressParts.push(streetLine);
}

// Ligne 4: Ville, Région CodePostal
const cityLineParts = [];
if (addressForm.city) cityLineParts.push(addressForm.city.trim());
if (addressForm.region) cityLineParts.push(addressForm.region.trim());
if (addressForm.postalCode) cityLineParts.push(addressForm.postalCode.trim());
const cityLine = cityLineParts.join(', ').trim();
if (cityLine) {
  addressParts.push(cityLine);
}

// Ligne 5: Pays (si présent)
if (addressForm.country) {
  addressParts.push(addressForm.country.trim());
}

// Concaténer toutes les parties valides avec des sauts de ligne (\n)
const shippingAddressString = addressParts.filter(part => part).join('\n');

// Utiliser shippingAddressString dans le payload de la requête POST /orders
const orderPayload = {
  shippingAddress: shippingAddressString,
  phoneNumber: '...',
  orderItems: [/* ... */],
  notes: '...'
};

// fetch('http://localhost:3004/orders', { method: 'POST', body: JSON.stringify(orderPayload), ... })
```

En suivant cette approche, vous vous assurez que la chaîne `shippingAddress` envoyée au backend est propre et ne contient pas de valeurs "undefined", ce qui résoudra le problème d'affichage que vous avez observé.

---

Ce guide devrait fournir à votre équipe frontend toutes les informations nécessaires pour intégrer correctement l'affichage des données client liées aux commandes. Assurez-vous que le service `OrderService` du backend inclut bien la relation `user` lors de la récupération des commandes (ce qui est le cas par défaut avec Prisma si la relation est définie dans le schéma). 