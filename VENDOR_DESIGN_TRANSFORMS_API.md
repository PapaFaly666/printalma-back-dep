# Guide d’intégration : Vendeur – Design Transforms API

> Base URL locale : `http://localhost:3004`
>
> Tous les appels nécessitent les cookies de session → `credentials: 'include'`.

---

## Sommaire

- POST `/vendor/designs` (création de design)
- POST `/vendor/design-transforms/save`
- GET `/vendor/design-transforms/:vendorProductId`
- Rendu visuel (éditeur / aperçu)
- Cycle complet d’utilisation
- Codes d’erreur
- Glossaire

---

## POST /vendor/designs

| Méthode | URL |
|---------|-----|
| POST | `/vendor/designs` |

### Payload (JSON)

```json
{
  "name": "Dragon Mystique",
  "description": "Illustration détaillée de dragon.",
  "category": "LOGO",
  "imageBase64": "data:image/png;base64,iVBORw0K...",
  "tags": ["dragon", "fantasy"]
}
```

* **`name`** : nom interne affiché dans le tableau de designs.
* **`category`** : catégorie (`LOGO`, `PATTERN`, `ILLUSTRATION`, `TYPOGRAPHY`, `ABSTRACT`, …).
* **`imageBase64`** : chaîne `data:image/...;base64,` contenant l’image (PNG/JPEG, max ≈ 10 Mo).
* **`description`**, **`tags`** : facultatifs.

### Exemple `fetch`

```ts
await fetch(`${API}/vendor/designs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Dragon Mystique',
    category: 'LOGO',
    imageBase64,
    description: 'Illustration détaillée de dragon.',
    tags: ['dragon', 'fantasy'],
  }),
});
```

### Réponse (201)

```json
{
  "success": true,
  "designId": 42,
  "message": "Design \"Dragon Mystique\" créé avec succès",
  "designUrl": "https://res.cloudinary.com/..."
}
```

---

## POST /vendor/products

| Méthode | URL |
|---------|-----|
| POST | `/vendor/products` |

### Payload (JSON)

```json
{
  "baseProductId": 10,
  "designId": 42,
  "vendorName": "T-shirt Dragon Mystique",
  "vendorDescription": "T-shirt coton bio avec illustration de dragon.",
  "vendorPrice": 24.9,
  "vendorStock": 150,
  "selectedColors": [
    { "id": 1, "name": "Black", "colorCode": "#000000" }
  ],
  "selectedSizes": [
    { "id": 3, "sizeName": "L" }
  ],
  "postValidationAction": "AUTO_PUBLISH",
  "productStructure": {
    "adminProduct": {
      "id": 10,
      "name": "T-shirt unisexe 180 g"  // info indicative côté front
    },
    "designApplication": { "scale": 0.8 }
  }
}
```

Principaux champs :

* **`baseProductId`** : identifiant du *base product* administrateur (le support).
* **`designId`** : design à appliquer (doit appartenir au vendeur).
* **`vendorName` / `vendorDescription`** : métadonnées boutique.
* **`vendorPrice`**, **`vendorStock`** : prix final et stock initial.
* **`selectedColors`** / **`selectedSizes`** : variantes proposées.
* **`postValidationAction`** : `AUTO_PUBLISH` (publier dès validation) ou `TO_DRAFT` (rester en brouillon).
* **`productStructure`** : objet technique (ex. échelle par défaut du design).

### Exemple `fetch`

```ts
await fetch(`${API}/vendor/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(productData),
});
```

### Réponse (201)

```json
{
  "success": true,
  "productId": 123,
  "message": "Produit créé avec design \"Dragon Mystique\"",
  "status": "PUBLISHED",          // ou "DRAFT" / "PENDING"
  "needsValidation": false,
  "designId": 42,
  "designUrl": "https://res.cloudinary.com/..."
}
```

---

## 1. POST /vendor/design-transforms/save

| Méthode | URL                              |
|---------|----------------------------------|
| POST    | `/vendor/design-transforms/save` |

### 1.1 Payload (JSON)

```json
{
  "vendorProductId": 2,
  "designUrl": "https://…/design.png",
  "transforms": {
    "0": { "x": 25, "y": 30, "scale": 0.8 }
  },
  "lastModified": 1672531200000
}
```

* **`vendorProductId`** : identifiant du `VendorProduct`.
* **`transforms`** : objet clé/valeur. Pour la V1 seule la clé `"0"` est utilisée.
* **`x` / `y`** : position en pourcentage (0 = gauche/haut, 100 = droite/bas).
* **`scale`** : facteur multiplicatif (1 = taille originale).
* **`lastModified`** : timestamp (ms) pour la détection de conflits.

### 1.2 Exemple `fetch` (React)

```ts
await fetch(`${API}/vendor/design-transforms/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',                     // <-- cookies envoyés
  body: JSON.stringify(payload),
});
```

### 1.3 Réponse (200)

```json
{
  "success": true,
  "message": "Transformations sauvegardées",
  "data": {
    "id": 26,
    "lastModified": "2023-01-01T00:00:00.000Z"
  }
}
```

---

## 2. GET /vendor/design-transforms/:vendorProductId

| Méthode | URL                                    |
|---------|----------------------------------------|
| GET     | `/vendor/design-transforms/42`         |

### 2.1 Réponse (200)

```json
{
  "success": true,
  "data": {
    "vendorProductId": 42,
    "designUrl": "https://…/design.png",
    "transforms": {
      "0": { "x": 25, "y": 30, "scale": 0.8 }
    },
    "lastModified": "2023-01-01T00:00:00.000Z"
  }
}
```

### 2.2 Exemple `fetch`

```ts
await fetch(`${API}/vendor/design-transforms/${vendorProductId}`, {
  credentials: 'include',
});
```

---

## 3. Rendu visuel dans l’éditeur / aperçu

```tsx
interface Transform { x: number; y: number; scale: number; }

function DesignMockup({ designUrl, transform }: { designUrl: string; transform: Transform }) {
  return (
    <div className="relative w-full aspect-square">
      <img
        src={designUrl}
        alt="design"
        className="absolute top-0 left-0 origin-center"
        style={{
          width: `${transform.scale * 100}%`,
          left: `${transform.x}%`,
          top: `${transform.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
```

---

## 4. Cycle complet

0. **Création du design** : `POST /vendor/designs` (si le design n’existe pas encore).  
1. **Création du produit** : `POST /vendor/products` avec le `designId`.  
2. **Chargement des transformations** : `GET /vendor/design-transforms/:vendorProductId`.  
3. **Édition** : l’utilisateur déplace/redimensionne → met à jour `x`, `y`, `scale`.  
4. **Sauvegarde** : `POST /vendor/design-transforms/save` avec les nouvelles valeurs.  
5. **Gestion des conflits** : si le back renvoie **409 Conflict**, recharger puis réessayer.

---

## 5. Codes d’erreur

| Code | Signification                                 |
|------|-----------------------------------------------|
| 400  | Payload invalide                              |
| 401  | Non authentifié (cookie manquant/expiré)      |
| 403  | Le produit ne vous appartient pas             |
| 409  | Conflit : version plus récente déjà stockée   |
| 500  | Erreur serveur                                |

---

## 6. Glossaire

| Terme              | Description                                                                                                             |
|--------------------|-------------------------------------------------------------------------------------------------------------------------|
| **VendorProduct**  | Produit personnalisé créé par un vendeur à partir d’un *base product* (T-shirt, mug…). Il contient le design appliqué.  |
| **vendorProductId**| Identifiant unique de ce `VendorProduct`. À envoyer dans chaque appel de Design Transforms.                              |

---

### TL;DR

```ts
// 1. Charger les transforms
const { data } = await fetch(`${API}/vendor/design-transforms/${vpId}`, { credentials: 'include' }).then(r => r.json());

// 2. Éditer…

// 3. Sauvegarder
await fetch(`${API}/vendor/design-transforms/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ vendorProductId: vpId, designUrl, transforms, lastModified: Date.now() }),
});
``` 