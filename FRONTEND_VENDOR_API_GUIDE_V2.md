# Guide Front-End – API Vendeur (Architecture v2 : Mockups par couleur)

> Version : 2025-07-01 – backend commit « mockups-by-color v2 »
>
> Toutes les routes ci-dessous sont préfixées par `/api` (ex. `https://api.printalma.com/api/vendor/products`).
> Authentification : **JWT Bearer Token** transmis via l'en-tête `Authorization: Bearer <token>`.
> Toutes les réponses ont la forme :
>
> ```json
> {
>   "success": true,
>   "data": { ... },
>   "message": "…",       // facultatif
>   "architecture": "v2_mockups_by_color" // quand pertinent
> }
> ```

---

## Sommaire
1. [Flux global](#flux-global)
2. [Schémas & types](#schémas--types)
3. [Endpoints CRUD produit vendeur](#1-créer-lister-mettre-à-jour)
4. [Mockups & maintenance](#2-mockups-et-maintenance)
5. [Statistiques & santé](#3-statistiques-et-santé)
6. [Erreurs standard](#erreurs-standard)

---

## Flux global
```
Vendeur connecté ─┬─▶ POST /vendor/products         (création + génération asynchrone des mockups)
                 │
                 ├─▶ GET  /vendor/products/:id/mockups          (suivi de génération)
                 │
                 ├─▶ (optionnel) POST /vendor/products/:id/generate-mockups
                 │
                 ├─▶ PUT /vendor/products/:id/publish          (publication manuelle si design validé)
                 │
                 └─▶ GET  /vendor/stats / health-report        (dashboards)
```

---

## Schémas & types

### 1. Couleur sélectionnée
```ts
interface SelectedColor {
  id: number;          // ColorVariation.id
  name: string;        // "Rouge"
  colorCode: string;   // "#ff0000"
}
```

### 2. Base64 images finales
Clé spéciale **`design`** obligatoire : design original 100 % qualité.  
Chaque autre clé = nom de couleur (ou `default`).
```json
{
  "design":  "data:image/png;base64,iVBORw0KG...",
  "Rouge":   "data:image/png;base64,iVBORw0KG...",
  "Noir":    "data:image/png;base64,iVBORw0KG...",
  "default": "data:image/png;base64,iVBORw0KG..."
}
```

### 3. Réponse standard `VendorProduct` (extraits)
```jsonc
{
  "id": 101,
  "vendorName": "T-shirt Dragon",
  "price": 25000,
  "status": "DRAFT",           // PUBLISHED | DRAFT | PENDING
  "design": {
    "id": 88,
    "imageUrl": "https://.../designs/dragon.png",
    "isValidated": true
  },
  "colorVariations": [
    {
      "id": 12,
      "name": "Rouge",
      "colorCode": "#ff0000",
      "images": [
        {
          "id": 555,
          "url": "https://.../vendor-mockups/mockup_101_12.jpg",
          "generationStatus": "COMPLETED"
        }
      ]
    }
  ],
  "mockups": {
    "completed": 3,
    "generating": 0,
    "failed": 0,
    "expected": 3
  }
}
```

---

## 1. Créer / lister / mettre à jour

### POST `/vendor/products` – **Créer un produit vendeur**
Démarre automatiquement la génération de mockups couleur (asynchrone).

Body (`Content-Type: application/json`):
```jsonc
{
  "baseProductId": 4,
  "designId": 88,                       // obligatoire en v2
  "vendorPrice": 25000,
  "vendorName": "T-shirt Dragon Rouge",
  "vendorDescription": "T-shirt premium avec design dragon.",
  "vendorStock": 100,
  "basePriceAdmin": 19000,
  "selectedSizes": [{ "id": 1, "sizeName": "S" }],
  "selectedColors": [
    { "id": 12, "name": "Rouge", "colorCode": "#ff0000" },
    { "id": 13, "name": "Noir",  "colorCode": "#000000" }
  ],
  "finalImagesBase64": { /* voir §2 */ },
  "forcedStatus": "PENDING"            // ou "DRAFT" (option)
}
```
Réponse `
201 Created`
```jsonc
{
  "success": true,
  "productId": 101,
  "status": "DRAFT",           // voir logique workflow
  "needsValidation": false,
  "imagesProcessed": 3,
  "mockupGeneration": {
    "status": "STARTED",
    "message": "Génération des mockups lancée en arrière-plan"
  },
  "architecture": "v2_mockups_by_color"
}
```

### GET `/vendor/products`
Paramètres : `limit` (par défaut 20) · `offset` · `status` (`all|published|draft`) · `search`

Réponse 200 :
```jsonc
{
  "success": true,
  "data": {
    "products": [ /* tableau VendorProduct abrégé */ ],
    "pagination": { "total": 42, "page": 1, ... },
    "healthMetrics": {
      "overallHealthScore": 97,
      "architectureVersion": "v2_mockups_by_color"
    }
  }
}
```

### GET `/vendor/products/:id`
Détails complets d'un produit (images + métriques).

### PUT `/vendor/products/:id/publish`
Publie un produit **DRAFT** dont le design est déjà validé.
Body vide.

### DELETE / PATCH
(non implémenté dans cette version)

---

## 2. Mockups et maintenance

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/vendor/products/:id/mockups` | Liste tous les mockups (par couleur) + stats |
| POST | `/vendor/products/:id/generate-mockups` | (Re)génère les mockups pour **toutes** les couleurs.  Body optionnel :`{ "forceRegenerate": true }`. |
| POST | `/vendor/products/:id/regenerate-failed-mockups` | Tente uniquement les mockups en `FAILED`. |
| GET | `/vendor/products/migration-status` | Progression de migration v1 ➜ v2 pour le vendeur |
| GET | `/vendor/products/health-report` | Score santé images + problèmes détectés |
| POST | `/vendor/products/fix-image-mixing` | Diagnostique / corrige anciens mélanges (body `{ "dryRun": true, "autoFix": false }`) |

**Statuts de génération** : `GENERATING`, `COMPLETED`, `FAILED`.

---

## 3. Statistiques et santé

### GET `/vendor/stats`
```jsonc
{
  "success": true,
  "stats": {
    "totalProducts": 25,
    "publishedProducts": 18,
    "draftProducts": 7,
    "totalRevenue": 625000,
    "averagePrice": 25000
  },
  "calculatedAt": "2025-07-01T09:30:00.000Z"
}
```

### GET `/vendor/products/health-report`
Résumé des problèmes par produit (associations couleur, images manquantes, etc.).

---

## Erreurs standard
| Code HTTP | Raison | Payload type |
|-----------|--------|--------------|
| 400 | Données invalides / logique métier | `{ "statusCode":400,"message":"…" }` |
| 403 | Accès interdit (design d'un autre vendeur, etc.) | idem |
| 404 | Ressource introuvable | idem |
| 500 | Erreur interne | idem |

---

## Notes d'intégration front-end
1. **Toujours envoyer `designId`** : le backend ne gère plus les `designUrl` blob côté vendeur.
2. La génération de mockups est **asynchrone** ; afficher un loader ou badge « en cours » jusqu'à `generationStatus === COMPLETED` pour toutes les couleurs.
3. La première URL `mockupUrl` terminée est renvoyée dans `mockupUrl` ; elle peut servir de miniature.
4. En cas d'échec (`FAILED`), proposer un bouton ✨ « Regénérer » → POST `/regenerate-failed-mockups`.
5. Le champ `architectureVersion` dans les réponses garantit que le backend tourne bien en v2.
6. Garder une taille max ≈ 100 MB pour `finalImagesBase64` ; le backend refuse au-delà.

---

### Exemple d'appel `fetch` (création)
```js
const res = await fetch("/api/vendor/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

---

**Fin du document – bon coding !** 