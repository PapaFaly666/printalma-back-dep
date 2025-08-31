# Guide d’intégration Front-End : API Design Transforms

Ce document explique comment le front-end (React, Vue, etc.) peut :

1. Sauvegarder les transformations (position / redimensionnement) d’un design sur un produit vendeur ;
2. Récupérer ces transformations pour afficher exactement le même placement dans l’interface.

> Base URL (local) : `http://localhost:3004`

---

> **Important :** dans l’API le champ s’appelle `vendorProductId` (l’identifiant du produit vendeur).  
> Si vous utilisez encore `productId`, il est conservé comme alias pour compatibilité, mais **préférez `vendorProductId`**.

## 1. POST /vendor/design-transforms/save

| Méthode | URL                                                |
|---------|----------------------------------------------------|
| POST    | `/vendor/design-transforms/save`                   |

### 1.1 Payload (JSON)

```json
{
  "vendorProductId": 2,
  "designUrl": "https://…/design.png", // URL Cloudinary du design
  "transforms": {
    "0": {
      "x": 25,   // % (0-100) – position horizontale du centre
      "y": 30,   // % (0-100) – position verticale du centre
      "scale": 0.8 // facteur relatif (1 = taille originale)
    }
  },
  "lastModified": 1672531200000      // timestamp ms (⚠️ obligatoire pour conflit)
}
```

* **`vendorProductId`** : identifiant du `VendorProduct`.
* **`transforms`** : objet clé/valeur. Chaque clé (`"0"`, `"1"`, …) représente un calque/design. Pour la V1 nous envoyons uniquement la clé `"0"`.
* **`x` / `y`** : position en pourcentage par rapport au conteneur (0 = gauche/haut, 100 = droite/bas). L’unité % facilite la responsivité.
* **`scale`** : facteur multiplicatif (ex. `0.5` = 50 %, `1.2` = 120 %).

### 1.2 Exemple – `fetch` (React)

```ts
// utils/designTransforms.ts
export async function saveDesignTransform({
  vendorProductId,
  designUrl,
  x,
  y,
  scale,
}: {
  vendorProductId: number;
  designUrl: string;
  x: number;
  y: number;
  scale: number;
}) {
  const body = {
    vendorProductId,
    designUrl,
    transforms: {
      0: { x, y, scale },
    },
    lastModified: Date.now(),
  };

  const res = await fetch(`${process.env.REACT_APP_API}/vendor/design-transforms/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // ⚠️ cookies de session
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Échec de la sauvegarde');
  return res.json();
}
```

### 1.3 Réponse 

```json
{
  "success": true,
  "message": "Transformations sauvegardées",
  "data": {
    "id": 26,                    // id interne de l’enregistrement
    "lastModified": "2023-01-01T00:00:00.000Z"
  }
}
```

> Stockez éventuellement `data.id` et la date pour le contrôle optimiste ou pour détecter les conflits de modification.

---

## 2. GET /vendor/design-transforms/:vendorProductId

| Méthode | URL                                      |
|---------|------------------------------------------|
| GET     | `/vendor/design-transforms/42`           |

### 2.1 Réponse

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

### 2.2 Exemple – `fetch`

```ts
export async function getDesignTransform(vendorProductId: number) {
  const res = await fetch(`${process.env.REACT_APP_API}/vendor/design-transforms/${vendorProductId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Impossible de récupérer les transforms');
  return res.json();
}
```

---

## 3. Rendu visuel dans l’éditeur / aperçu

L’objectif est de représenter le design dans un conteneur (mock-up) en respectant :

* la **position** (`x`, `y`) exprimée en % (plus simple : transform : translate(-50%, -50%) pour centrer sur les coordonnées)
* le **scale** sur la taille de l’image

Exemple React / Tailwind :

```tsx
interface Transform { x: number; y: number; scale: number; }

function DesignMockup({ designUrl, transform }: { designUrl: string; transform: Transform }) {
  return (
    <div className="relative w-full aspect-square bg-gray-100">
      {/* calque design */}
      <img
        src={designUrl}
        alt="design"
        className="absolute top-0 left-0 origin-center"
        style={{
          width: `${transform.scale * 100}%`,
          height: 'auto',
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

1. **Rendu initial**
   * GET `/vendor/design-transforms/:productId` → charger les valeurs existantes → hydratation de l’éditeur.
2. **Édition par l’utilisateur**
   * Mettre à jour `x`, `y`, `scale` dans le state local.
3. **Sauvegarde**
   * POST `/vendor/design-transforms/save` avec les nouvelles valeurs.
4. **Sécurisation / conflits**
   * Envoyer `lastModified` (timestamp du dernier fetch). Si l’API retourne `409 Conflict`, recharger avant d’écraser.

---

## 5. Erreurs possibles

| Code | Signification                            |
|------|------------------------------------------|
| 400  | Payload invalide                         |
| 401  | Non authentifié (token/cookie expiré)    |
| 403  | Le produit ne vous appartient pas        |
| 409  | Conflit : une version plus récente existe|
| 500  | Erreur serveur                           |

---

### TL;DR

```ts
const { data } = await getDesignTransform(vendorProductId);
setTransform(data.transforms[0]);
// … user bouge l’image …
await saveDesignTransform({ vendorProductId, designUrl, ...transform });
```

---

## Glossaire : qu’est-ce que le `vendorProductId` ?

| Terme              | Description courte |
|--------------------|--------------------|
| **VendorProduct**  | Le « produit personnalisé » créé par un vendeur à partir d’un *base product* (ex. T-shirt, poster, mug) proposé par l’administrateur. Il contient le **design** appliqué, le prix fixé par le vendeur, son statut de publication, etc. |
| **vendorProductId**| Identifiant unique de ce `VendorProduct` dans la base. C’est ce que l’API attend pour savoir **sur quel produit vendu par le vendeur** appliquer / lire les transformations du design. |

En pratique, côté front :

1. Le vendeur choisit d’abord un *base product* (par ex. « Poster A3 ») disponible dans le catalogue admin.
2. Une fois son design importé, le back crée un **VendorProduct** (statut `DRAFT` ou `PENDING`). L’API de création vous renvoie son `id` : **c’est le `vendorProductId`.**
3. Lors du placement / redimensionnement du design, vous devrez envoyer cet `vendorProductId` pour :
   * sauvegarder les transforms (`POST /vendor/design-transforms/save`)
   * relire ultérieurement ces mêmes transforms (`GET /vendor/design-transforms/:vendorProductId`).

> Astuce : si vous naviguez dans une page de détail produit (ex. `/vendor/products/42/editor`), gardez `42` dans votre state/URL et réutilisez-le comme `vendorProductId` dans les appels ci-dessus.


Avec ce guide, le front-end dispose de tout le nécessaire pour :

* charger le positionnement existant ;
* rendre visuellement le design au bon emplacement ;
* sauvegarder à nouveau les modifications. 