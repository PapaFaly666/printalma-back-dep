# 🛣️ Front-End – Endpoints V2 : à utiliser / à éviter (Designs & Produits)

Ce document fait le tri entre les **bonnes** routes de l’API V2 et les anciennes qui provoquent des `404` ou des erreurs de droits. Gardez-le ouvert pendant vos dev front.

> Base URL dev : `http://localhost:3004`
> Toutes les requêtes en `credentials: 'include'`.

---

## ✅ Endpoints OFFICIELS (Architecture V2)

| Domaine | Méthode | Endpoint | Description rapide |
|---------|---------|----------|--------------------|
| Design  | POST    | `/vendor/designs` | Créer un nouveau design (imageBase64 ou multipart). |
| Design  | GET     | `/vendor/designs` | Lister les designs du vendeur (query : `limit`, `offset`, `status`, `search`). |
| Produit | POST    | `/vendor/products` | Créer un **VendorProduct** à partir d’un `designId`. |
| Produit | GET     | `/vendor/products` | Lister les produits vendeurs (query : `limit`, `offset`, `status`, `search`). |
| Produit | GET     | `/vendor/products/:id` | Détails d’un produit vendeur. |
| Transforms | POST | `/vendor/design-transforms/save` | Sauvegarder position/échelle du design sur le produit. |
| Transforms | GET  | `/vendor/design-transforms/:vendorProductId` | Récupérer les transforms pour hydratation éditeur. |
| Stats (optionnel) | GET | `/vendor/stats` | Quelques métriques globaux vendeur. |

---

## 🚫 Endpoints DÉPRÉCIÉS ou INEXISTANTS

| Mauvaise route | Pourquoi il ne faut plus l’utiliser / Alternative |
|----------------|---------------------------------------------------|
| `/vendor/design-product` (GET) | ✖️ **N’existe plus**. Utilisez **GET `/vendor/products`** ou **GET `/vendor/products/:id`**. |
| `/vendor/design-products` | ✖️ Obsolète. Même alternative que ci-dessus. |
| `/api/vendor/design-transforms/save` | ✖️ Ancien namespace `api/`. Utilisez **POST `/vendor/design-transforms/save`**. |
| `/api/vendor/design-transforms/load` | ✖️ Remplacé par **GET `/vendor/design-transforms/:vendorProductId`**. |
| `/vendor/design-transforms` (POST direct sans `/save`) | ✖️ Alias legacy retiré. Ajoutez `/save`. |
| `/vendor/designs/:id` (GET) | ✖️ Pas implémenté côté vendeur. Pour un détail design utilisez **GET `/api/designs/:id`** *(route admin/générique)* ou gardez la liste `/vendor/designs`. |
| `/api/designs` (POST multipart) | ✖️ Ancienne création de design via namespace `api`. Préférez **POST `/vendor/designs`**. |
| `/api/vendor/products` (tout) | ✖️ Legacy v1. Préférez `/vendor/products`. |

---

## 🎯 Remplacement spécifique de `/vendor/design-product`

| Ancienne route | Nouvelle route | Méthode | Reply type |
|----------------|---------------|---------|------------|
| `/vendor/design-product` | `/vendor/products` | GET | Liste paginée des **VendorProducts** (inclut `designId`, `designUrl`, statut, etc.) |
| *(détail)* `/vendor/design-product/:id` | `/vendor/products/:id` | GET | Détail complet du produit vendeur |

### 1. GET `/vendor/products` – Exemple d’appel
```ts
// Tous les produits du vendeur (20 premiers)
const res = await fetch(`${API}/vendor/products?limit=20&offset=0`, {
  credentials: 'include',
});
const { success, data } = await res.json();
```

Réponse type (200):
```json
{
  "success": true,
  "data": {
    "total": 2,
    "items": [
      {
        "id": 2,
        "vendorName": "Tshirt Dragon Mystique",
        "status": "PENDING",
        "designId": 42,
        "designUrl": "https://res.cloudinary.com/...",
        "baseProductId": 1,
        "selectedColors": [...],
        "selectedSizes": [...]
      }
    ]
  }
}
```

### 2. GET `/vendor/products/:id` – Exemple d’appel
```ts
const res = await fetch(`${API}/vendor/products/${productId}`, {
  credentials: 'include',
});
const detail = await res.json();
```

Réponse type (200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "vendorName": "Tshirt Dragon Mystique",
    "status": "PENDING",
    "designId": 42,
    "design": {
      "name": "Dragon Mystique",
      "category": "LOGO",
      "imageUrl": "https://res.cloudinary.com/...",
      "isValidated": false
    },
    "baseProduct": {
      "id": 1,
      "name": "T-shirt 180 g"
    },
    "selectedColors": [...],
    "selectedSizes": [...],
    "createdAt": "2023-10-25T12:34:00.000Z"
  }
}
```

**Mise à jour Front** : remplacez tous les appels à `getDesignProducts()` ou `/vendor/design-product` par la liste / détail ci-dessus (`/vendor/products`).

---

## Flux complet recommandé (succès garanti)

```mermaid
graph LR
A[POST /vendor/designs \n-> designId] --> B[POST /vendor/products \n(designId) -> vendorProductId]
B --> C[GET /vendor/design-transforms/:vendorProductId \n(chargement initial)]
C --> D[POST /vendor/design-transforms/save \n(màj après édition)]
```

---

## Exemple compact (React / fetch)

```ts
// 1. Création design
const { data: design } = await fetch(`${API}/vendor/designs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name, category, imageBase64 }),
}).then(r => r.json());

// 2. Création produit vendeur
const { productId: vendorProductId } = await fetch(`${API}/vendor/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ baseProductId, designId: design.designId, vendorName, vendorPrice }),
}).then(r => r.json());

// 3. Chargement transforms (si éditeur)
const { data } = await fetch(`${API}/vendor/design-transforms/${vendorProductId}`, {
  credentials: 'include',
}).then(r => r.json());

// 4. Sauvegarde transforms
await fetch(`${API}/vendor/design-transforms/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ vendorProductId, designUrl, transforms, lastModified: Date.now() }),
});
```

---

**TL;DR** : Si votre console affiche une requête commençant par `/api/` ou `/vendor/design-product`, c’est l’ancienne API. Mettez-à-jour l’appel pour suivre les routes ci-dessus.  
Votre backend V2 ne répondra qu’aux endpoints listés dans la section ✅. 