# 📝 Documentation Front-End – Produits Vendeur (GET `/vendor/products`)

Ce document décrit les endpoints **GET `/vendor/products`** (liste) et **GET `/vendor/products/:id`** (détail) côté vendeur : paramètres supportés, exemples de requêtes et **réponses complètes** contenant toutes les données renvoyées par le backend (architecture _v2_preserved_admin_).

---

## 1. Endpoint Liste - GET `/vendor/products`

| Méthode | URL | Authentification |
|---------|-----|------------------|
| `GET`   | `/vendor/products` | Cookie JWT (VENDOR) |

### Paramètres de requête

| Nom | Type | Par défaut | Description |
|-----|------|-----------|-------------|
| `limit`  | `number` | `20`  | Nombre maximum d'éléments retournés (max : `100`). |
| `offset` | `number` | `0`   | Décalage pour la pagination. |
| `status` | `string` | _vide_ | Filtrer par statut (`PUBLISHED`, `PENDING`, `DRAFT`, `REJECTED`). |
| `search` | `string` | _vide_ | Recherche dans `vendorName`, `description`… |

### Exemple d'appel (fetch)

```ts
const res = await fetch("http://localhost:3004/vendor/products?limit=20&offset=0", {
  credentials: "include", // important : cookies JWT
});
const { success, data } = await res.json();
```

### Exemple **complet** de réponse (200)

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 31,
        "vendorName": "Tshirt",
        "originalAdminName": "Tshirt",
        "description": "Tshirt prenium",
        "price": 12000,
        "stock": 12,
        "status": "PENDING",
        "createdAt": "2025-07-09T16:30:18.501Z",
        "updatedAt": "2025-07-09T16:30:18.501Z",
        "adminProduct": {
          "id": 1,
          "name": "Tshirt",
          "description": "Tshirt prenium",
          "price": 12000,
          "colorVariations": [
            {
              "id": 1,
              "name": "Blanc",
              "colorCode": "#e5e6e1",
              "images": [
                {
                  "id": 1,
                  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018200/printalma/1752018198359-T-Shirt_Premium_Blanc.jpg",
                  "viewType": "Front",
                  "delimitations": [
                    {
                      "x": 158.7095343254858,
                      "y": 103.5952197959822,
                      "width": 166.6666600439286,
                      "height": 272.2222114050834,
                      "coordinateType": "PERCENTAGE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
          "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
          "positioning": "CENTER",
          "scale": 0.6,
          "mode": "PRESERVED"
        },
        "design": {
          "id": 9,
          "name": "solo-leveling-logo-01",
          "description": "",
          "category": "LOGO",
          "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
          "cloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
          "tags": [],
          "isValidated": false,
          "validatedAt": null,
          "createdAt": "2025-07-09T12:35:44.391Z"
        },
        "designTransforms": [
          {
            "id": 16,
            "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
            "transforms": {
              "0": {
                "x": -86,
                "y": -122,
                "scale": 0.375
              }
            },
            "lastModified": "2025-07-09T16:30:18.603Z",
            "createdAt": "2025-07-09T16:30:18.641Z"
          }
        ],
        "designPositions": [
          {
            "designId": 9,
            "position": {
              "x": -86,
              "y": -122,
              "scale": 0.375,
              "rotation": 0,
              "constraints": {}
            },
            "createdAt": "2025-07-09T16:30:18.520Z",
            "updatedAt": "2025-07-09T16:30:18.655Z"
          }
        ],
        "vendor": {
          "id": 2,
          "fullName": "Tasha Faly",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "Papa Faly",
          "profile_photo_url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018323/profile-photos/vendor_1752018320371_970296388.jpg"
        },
        "images": {
          "adminReferences": [
            {
              "colorName": "Blanc",
              "colorCode": "#e5e6e1",
              "adminImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018200/printalma/1752018198359-T-Shirt_Premium_Blanc.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 4,
          "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018200/printalma/1752018198359-T-Shirt_Premium_Blanc.jpg",
          "validation": {
            "isHealthy": true,
            "totalIssuesDetected": 0
          }
        },
        "selectedSizes": [
          { "id": 1, "sizeName": "XS" },
          { "id": 2, "sizeName": "S" },
          { "id": 3, "sizeName": "M" },
          { "id": 4, "sizeName": "L" },
          { "id": 5, "sizeName": "XL" },
          { "id": 6, "sizeName": "XXL" },
          { "id": 7, "sizeName": "3XL" }
        ],
        "selectedColors": [
          { "id": 1, "name": "Blanc", "colorCode": "#e5e6e1" },
          { "id": 2, "name": "Blue", "colorCode": "#2a68a7" },
          { "id": 3, "name": "Noir", "colorCode": "#000000" },
          { "id": 4, "name": "Rouge", "colorCode": "#b42827" }
        ],
        "designId": 9
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    },
    "healthMetrics": {
      "totalProducts": 2,
      "healthyProducts": 2,
      "unhealthyProducts": 0,
      "overallHealthScore": 100,
      "architecture": "v2_preserved_admin"
    }
  },
  "architecture": "v2_preserved_admin"
}
```

---

## 2. Endpoint Détail - GET `/vendor/products/:id`

| Méthode | URL | Authentification |
|---------|-----|------------------|
| `GET`   | `/vendor/products/:id` | Cookie JWT (VENDOR) |

### Paramètres de requête

| Nom | Type | Description |
|-----|------|-------------|
| `id` | `number` | ID du produit vendeur à récupérer |

### Exemple d'appel (fetch)

```ts
const res = await fetch("http://localhost:3004/vendor/products/32", {
  credentials: "include", // important : cookies JWT
});
const { success, data } = await res.json();
```

### Exemple **complet** de réponse (200)

```json
{
  "success": true,
  "data": {
    "id": 32,
    "vendorName": "Tshirt",
    "vendorDescription": "Tshirt prenium",
    "vendorPrice": 12000,
    "vendorStock": 12,
    "status": "PENDING",
    "adminProduct": {
      "id": 1,
      "name": "Tshirt",
      "description": "Tshirt prenium",
      "price": 12000,
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#e5e6e1",
          "images": [
            {
              "id": 1,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018200/printalma/1752018198359-T-Shirt_Premium_Blanc.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 2,
          "name": "Blue",
          "colorCode": "#2a68a7",
          "images": [
            {
              "id": 2,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018202/printalma/1752018201718-T-Shirt_Premium_Bleu.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 3,
          "name": "Noir",
          "colorCode": "#000000",
          "images": [
            {
              "id": 3,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018203/printalma/1752018203288-T-Shirt_Premium_Noir.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 4,
          "name": "Rouge",
          "colorCode": "#b42827",
          "images": [
            {
              "id": 4,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018205/printalma/1752018204914-T-Shirt_Premium_Rouge.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        }
      ]
    },
    "designApplication": {
      "hasDesign": true,
      "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
      "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
      "positioning": "CENTER",
      "scale": 0.6,
      "mode": "PRESERVED"
    },
    "design": {
      "id": 9,
      "name": "solo-leveling-logo-01",
      "description": "",
      "category": "LOGO",
      "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
      "cloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
      "tags": [],
      "isValidated": false,
      "validatedAt": null,
      "createdAt": "2025-07-09T12:35:44.391Z"
    },
    "designTransforms": [
      {
        "id": 16,
        "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
        "transforms": {
          "0": {
            "x": -86,
            "y": -122,
            "scale": 0.375
          }
        },
        "lastModified": "2025-07-09T16:30:18.603Z",
        "createdAt": "2025-07-09T16:30:18.641Z"
      }
    ],
    "designPositions": [
      {
        "designId": 9,
        "position": {
          "x": -86,
          "y": -122,
          "scale": 0.375,
          "rotation": 0,
          "constraints": {}
        },
        "createdAt": "2025-07-09T16:30:18.520Z",
        "updatedAt": "2025-07-09T16:30:18.655Z"
      }
    ],
    "vendor": {
      "id": 2,
      "fullName": "Tasha Faly",
      "shop_name": "Papa Faly"
    },
    "selectedSizes": [
      { "id": 1, "sizeName": "XS" },
      { "id": 2, "sizeName": "S" },
      { "id": 3, "sizeName": "M" },
      { "id": 4, "sizeName": "L" },
      { "id": 5, "sizeName": "XL" },
      { "id": 6, "sizeName": "XXL" },
      { "id": 7, "sizeName": "3XL" }
    ],
    "selectedColors": [
      { "id": 1, "name": "Blanc", "colorCode": "#e5e6e1" },
      { "id": 2, "name": "Blue", "colorCode": "#2a68a7" },
      { "id": 3, "name": "Noir", "colorCode": "#000000" },
      { "id": 4, "name": "Rouge", "colorCode": "#b42827" }
    ],
    "designId": 9,
    "createdAt": "2025-07-10T12:39:03.285Z",
    "updatedAt": "2025-07-10T12:39:03.285Z"
  },
  "architecture": "v2_preserved_admin"
}
```

---

## 3. Champs clés

| Champ | Description |
|-------|-------------|
| `products[]` | _(Liste seulement)_ Tableau des **VendorProducts** enrichis (un objet par produit). |
| `adminProduct` | Copie immuable du produit catalogue administrateur associé. |
| `design` | **NOUVEAU** - Métadonnées complètes du design utilisé. |
| `designTransforms` | **NOUVEAU** - Historique des transformations (position, scale…) appliquées au design. |
| `designPositions` | **NOUVEAU** - Position(s) finales appliquées pour le rendu/mocks. |
| `images.adminReferences` | _(Liste seulement)_ Images officielles du produit (une par couleur/angle). |
| `selectedSizes` / `selectedColors` | Variantes choisies par le vendeur. |
| `designId` | **NOUVEAU** - ID du design associé pour compatibilité. |
| `pagination` | _(Liste seulement)_ Informations de pagination classiques. |
| `healthMetrics` | _(Liste seulement)_ Indicateurs globaux de santé de catalogue (optionnel). |

---

## 4. Bonnes pratiques d'intégration

1. **Liste** : Utiliser `limit` / `offset` pour la pagination infinie (ex. _infinite scroll_ ou _load more_).
2. **Détail** : Utiliser l'ID du produit depuis la liste pour récupérer les détails complets.
3. Afficher rapidement les champs légers (nom, prix, statut) puis charger images/designs en lazy si nécessaire.
4. Mémoriser le mapping `id → designId` pour vos sous-composants d'édition.
5. Rafraîchir la liste (appel SWR ou React Query) après une action de publication / suppression.
6. **Nouveau** : Utiliser `design`, `designTransforms` et `designPositions` pour l'affichage enrichi.

---

**Dernière mise à jour** : 2025-07-10 