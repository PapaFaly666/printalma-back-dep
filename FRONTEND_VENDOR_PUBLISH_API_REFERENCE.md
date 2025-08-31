# 📘 Frontend – Guide rapide API Publication Vendeur

Ce document récapitule **les endpoints à appeler depuis le front** pour publier un design et son produit associé. Toutes les requêtes utilisent `credentials: 'include'` pour envoyer les cookies de session.

> Base URL locale : `http://localhost:3004`

---

## 1. Créer un design

| Méthode | Endpoint               |
|---------|------------------------|
| POST    | `/vendor/designs`      |

Exemple :
```ts
await fetch(`${API}/vendor/designs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Dragon Mystique',
    category: 'LOGO',
    imageBase64,
  }),
});
```

Réponse attendue :
```json
{ "success": true, "designId": 42, "designUrl": "https://…" }
```

---

## 2. Créer un produit vendeur (à partir d’un design)

| Méthode | Endpoint           |
|---------|--------------------|
| POST    | `/vendor/products` |

Exemple :
```ts
await fetch(`${API}/vendor/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    baseProductId: 10,
    designId: 42,
    vendorName: 'T-shirt Dragon',
    vendorPrice: 24.9,
    vendorStock: 100,
    selectedColors: [{ id: 1, name: 'Black', colorCode: '#000' }],
    selectedSizes: [{ id: 3, sizeName: 'L' }],
    postValidationAction: 'AUTO_PUBLISH',
    productStructure: { designApplication: { scale: 0.8 } },
  }),
});
```

Réponse attendue :
```json
{ "success": true, "productId": 123, "status": "PENDING" }
```

> Note : la réponse contient `productId` (a.k.a. **vendorProductId**). Conservez-le pour les appels suivants.

---

## 3. Sauvegarder la position du design sur le produit

| Méthode | Endpoint                           |
|---------|------------------------------------|
| POST    | `/vendor/design-transforms/save`   |

Exemple :
```ts
await fetch(`${API}/vendor/design-transforms/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    vendorProductId: 123,        // ← id reçu à l’étape 2
    designUrl: 'https://…/dragon.png',
    transforms: { 0: { x: 30, y: 35, scale: 0.9 } },
    lastModified: Date.now(),
  }),
});
```

---

## 4. Récupérer la position du design (édition ultérieure)

| Méthode | Endpoint                                       |
|---------|------------------------------------------------|
| GET     | `/vendor/design-transforms/:vendorProductId`   |

Exemple :
```ts
await fetch(`${API}/vendor/design-transforms/${vendorProductId}`, {
  credentials: 'include',
});
```

---

## Récapitulatif du flux

1. POST `/vendor/designs` → `designId`
2. POST `/vendor/products` (avec `designId`) → `vendorProductId` (= `productId` dans la réponse)
3. POST `/vendor/design-transforms/save` (avec `vendorProductId`)
4. (optionnel) GET `/vendor/design-transforms/:vendorProductId` pour recharger

Voilà les points d’entrée corrects pour le front-end afin d’éviter d’appeler les anciennes routes (`/api/vendor/design-transforms/save`, etc.). 