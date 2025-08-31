# API Référence – VendorDesignTransform & ProductDesignPosition

_Comment gérer **transformations** et **positionnements** de designs côté frontend._

---

## 1. VendorDesignTransform

| But | Table | Namespace |
|-----|-------|-----------|
| Sauver les **transformations** d’un design pour un produit vendeur | `vendor_design_transform` | `/vendor/design-transforms` |

### 1.1 POST `/vendor/design-transforms`
Sauvegarder ou mettre à jour les transformations.

```json
{
  "productId": 70,
  "designUrl": "https://res.cloudinary.com/demo/image/upload/v160000/design.png",
  "transforms": {
    "0": { "x": 25, "y": 30, "scale": 0.8 },
    "positioning": { "x": 25, "y": 30, "scale": 0.8, "rotation": 0,
                      "constraints": { "adaptive": true } }
  },
  "lastModified": 1699038457000
}
```

Réponse 200 :
```json
{
  "success": true,
  "message": "Transformations sauvegardées",
  "data": {
    "id": 1234,
    "lastModified": "2025-07-09T13:25:10.000Z"
  }
}
```
> Alias legacy : `POST /vendor/design-transforms/save`

### 1.2 GET `/vendor/design-transforms/{productId}?designUrl={url}`
Charge la dernière transformation.

```json
{
  "success": true,
  "data": {
    "productId": 70,
    "designUrl": "https://…/design.png",
    "transforms": {
      "0": { "x": 25, "y": 30, "scale": 0.8 },
      "positioning": { "x": 25, "y": 30, "scale": 0.8, "rotation": 0 }
    },
    "lastModified": 1699038457000
  }
}
```
`data` vaut `null` si aucune transformation.

### 1.3 Aide au positionnement

1. **GET** `/vendor-design-transforms/products/{productId}/design-positioning?designUrl={url}`
   ```json
   {
     "success": true,
     "data": {
       "positioning": { "x": 0, "y": 20, "width": 180, "height": 180, "rotation": 0 },
       "productType": "tshirt",
       "description": "T-shirt basique unisexe",
       "presets": { "front": { … }, "back": { … } }
     }
   }
   ```

2. **POST** `/vendor-design-transforms/products/{productId}/design-positioning`
   ```json
   {
     "designUrl": "https://…/design.png",
     "positioning": { "x": 5, "y": 25, "width": 160, "height": 160, "rotation": 5 }
   }
   → { "success": true, "message": "Positionnement personnalisé sauvegardé avec succès" }
   ```

3. **GET** `/vendor-design-transforms/products/{productId}/positioning-presets`
   ```json
   {
     "success": true,
     "data": {
       "productType": "mug",
       "description": "Mug 325 ml blanc",
       "presets": { "center": { … }, "wrap": { … } }
     }
   }
   ```

---

## 2. ProductDesignPosition

| Action | Méthode | URL | Corps | Réponse |
|--------|---------|-----|-------|---------|
| Upsert direct | PUT | `/api/vendor-products/{vpId}/designs/{designId}/position/direct` | `UpdateDesignPositionDto` | `{ success:true, message:'Position sauvegardée avec succès', data:{ x,y,scale,rotation,constraints } }` |
| Lire direct | GET | idem + `/direct` | – | `{ success:true, data:{ x,y,scale,rotation,constraints } \| null }` |
| Upsert (legacy) | PUT | `/api/vendor-products/{vpId}/designs/{designId}/position` | `UpdateDesignPositionDto` | `{ success:true, data:{ …record… } }` |
| Lire (legacy) | GET | idem | – | `{ success:true, data:{ position } }` |
| Supprimer | DELETE | idem (sans `/direct`) | – | `{ success:true }` |
| Debug | GET | idem + `/debug` | – | diagnostic détaillé |

### 2.1 Schema `UpdateDesignPositionDto`
```json
{
  "x": 25,
  "y": 30,
  "scale": 0.8,
  "rotation": 0,
  "constraints": {
    "adaptive": true,
    "area": "front"
  }
}
```

Notes :
* Utiliser **vendorProductId** (≠ baseProductId) pour `:vpId`.
* Les routes `/direct` renvoient un objet déjà prêt pour l’éditeur.
* Le backend vérifie la propriété du produit et du design → 403/404 en cas d’erreur.
* Un `PUT …/position/direct` met à jour la clé `positioning` dans VendorDesignTransform pour garder une source unique.

---

## 3. Workflow recommandé

1. `GET /vendor/design-transforms/{productId}?designUrl=…` → appliquer `transforms`.
2. Si pas de `positioning`, appeler `GET …/design-positioning` pour un placement auto.
3. À chaque modification, `PUT …/position/direct` (throttlé 500 ms).
4. Au clic « Enregistrer », `POST /vendor/design-transforms` avec les derniers `transforms` et `lastModified = Date.now()`.

---
Ce guide suffit pour intégrer la gestion des transformations & positionnements côté frontend sans explorer le backend. 