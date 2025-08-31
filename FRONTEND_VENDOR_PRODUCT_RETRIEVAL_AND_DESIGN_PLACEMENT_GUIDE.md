# 🛒 Guide Frontend – Récupération Produit Vendeur & Placement Design

Ce guide montre **pas-à-pas** comment :
1. Récupérer la liste et les détails d’un produit vendeur (Architecture V2)
2. Obtenir la **délimitation d’impression** sur le mock-up
3. Charger la **position enregistrée** du design
4. Afficher le design là où il a été défini

> Toutes les routes sont protégées par cookie **auth_token** ou header `Authorization: Bearer <jwt>`.

---

## 1. Endpoints clefs

| Action | Méthode | URL | Output principal |
|--------|---------|-----|------------------|
| Lister produits | GET | `/vendor/products?limit=20&offset=0` | `products[]` (light) |
| Détail produit | GET | `/vendor/products/{productId}` | `data` (structure complète) |
| Position design | GET | `/api/vendor-products/{vpId}/designs/{designId}/position/direct` | `{ x,y,scale,rotation,… } \| null` |

> `vpId` (vendorProductId) = `id` du produit retourné par `/vendor/products`.

---

## 2. Structure *VendorProduct Detail*

```json
GET /vendor/products/28 →
{
  "success": true,
  "data": {
    "id": 28,
    "designApplication": {
      "designUrl": "https://res.cloudinary.com/.../design_9.png",
      "positioning": "CENTER",     // legacy fallback
      "scale": 0.6
    },
    "adminProduct": {
      "colorVariations": [
        {
          "id": 12,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [
            {
              "id": 101,
              "url": "https://res.cloudinary.com/.../mockup_front_white.webp",
              "viewType": "FRONT",
              "delimitations": [
                { "x": 150, "y": 200, "width": 200, "height": 200, "coordinateType": "PIXEL" }
              ]
            }
          ]
        }
      ]
    },
    "selectedColors": [{ "id": 12, "name": "Blanc", "colorCode": "#FFFFFF" }],
    "selectedSizes": [{ "id": 1, "sizeName": "S" }],
    "designId": 9,
    "createdAt": "2025-07-09T13:20:00.000Z"
  },
  "architecture": "v2_preserved_admin"
}
```

### Champs importants
* `designApplication.designUrl` – URL Cloudinary du design (PNG transparent)
* `adminProduct.colorVariations[].images[].delimitations[]` – **rectangle d’impression** sur l’image mock-up
  * `coordinateType` = `PIXEL` (absolu) ou `PERCENT` (0-100)
* `selectedColors` – couleurs réellement vendues (filtrer les `colorVariations` côté UI)
* `designId` – clé pour l’endpoint position

---

## 3. Étapes de récupération dans React

```ts
// services/vendorProductApi.ts
export async function fetchVendorProductDetail(vpId: number) {
  const res = await fetch(`/vendor/products/${vpId}`, { credentials: 'include' });
  const json = await res.json();
  return json.data;
}

export async function fetchDesignPosition(vpId: number, designId: number) {
  const res = await fetch(`/api/vendor-products/${vpId}/designs/${designId}/position/direct`, { credentials: 'include' });
  const { data } = await res.json();
  return data; // null si jamais sauvegardé
}
```

```tsx
// hooks/useVendorProduct.ts
export function useVendorProduct(vpId: number) {
  const [product, setProduct] = useState<any>();
  const [position, setPosition] = useState<any>();

  useEffect(() => {
    (async () => {
      const detail = await fetchVendorProductDetail(vpId);
      setProduct(detail);

      // Charger position custom
      if (detail.designId) {
        const pos = await fetchDesignPosition(vpId, detail.designId);
        setPosition(pos); // peut être null
      }
    })();
  }, [vpId]);

  return { product, position };
}
```

---

## 4. Calcul de la zone d’affichage

1. **Choisir le mock-up** :
   * Filtrer `colorVariations` pour garder uniquement la couleur sélectionnée → prendre `images[0]` (ou `viewType == 'FRONT'`).
2. **Prendre la première `delimitation`** (ou selon le `viewType`).
3. **Adapter les unités** :
   * Si `coordinateType == 'PERCENT'` → convertir en pixels après avoir chargé l’image (`img.width`/`img.height`).
4. **Appliquer la position enregistrée** :
   * Si `position` ≠ `null`, remplacer `x`,`y`,`scale`,`rotation`.
   * Sinon, démarrer au centre de la `delimitation` (
     ```js
     const centerX = delim.x + delim.width / 2;
     const centerY = delim.y + delim.height / 2;
     ```
     ) et `scale = designApplication.scale`.

---

## 5. Exemple Canvas (pseudo-code)

```js
// canvas = ref <canvas>
const ctx = canvas.getContext('2d');

// 1. Dessiner le mock-up
const mockup = await loadImage(imageUrl);
canvas.width = mockup.width;
canvas.height = mockup.height;
ctx.drawImage(mockup, 0, 0);

// 2. Charger le design
const design = await loadImage(designUrl);

// 3. Calcul final
const { x, y, scale, rotation } = position ?? {
  x: delim.x,
  y: delim.y,
  scale: designScale,
  rotation: 0
};

ctx.translate(x + design.width * scale / 2, y + design.height * scale / 2);
ctx.rotate((rotation * Math.PI) / 180);
ctx.scale(scale, scale);
ctx.drawImage(design, -design.width / 2, -design.height / 2);
```

---

## 6. Sauvegarde après modification

À chaque drag / zoom :
```ts
await fetch(`/api/vendor-products/${vpId}/designs/${designId}/position/direct`, {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ x, y, scale, rotation })
});
```

> Le backend mettra à jour `ProductDesignPosition` **et** la clé `positioning` du `VendorDesignTransform`.

---

## 7. Gestion des erreurs courantes

| Code | Cause fréquente | Correctif |
|------|-----------------|-----------|
| 403 `Ce produit ne vous appartient pas` | `vpId` ne correspond pas au vendeur connecté | Rafraîchir `/vendor/products` pour obtenir le bon `id`. |
| 404 `Produit introuvable` | `vpId` = `baseProductId` (admin) au lieu du **vendorProductId** | Utiliser l’`id` retourné par `/vendor/products`. |
| 404 `Design introuvable` | `designId` invalide ou non lié au vendeur | Vérifier la liste `/vendor/designs`. |

---

## 8. Workflow résumé

1. `GET /vendor/products` → afficher la liste.
2. Sélection → `GET /vendor/products/{id}`.
3. Récupérer `designUrl`, `designId`, `delimitation`.
4. `GET /api/vendor-products/{id}/designs/{designId}/position/direct`.
5. Dessiner le mock-up + design dans la zone `delimitation` avec la position.
6. Sur drag → `PUT …/position/direct` (throttle 500 ms).
7. Sur « Enregistrer » → `POST /vendor/design-transforms` (avec `transforms` + `lastModified`).

---
📐 **Votre éditeur est maintenant capable de replacer automatiquement le design exactement là où il avait été défini !** 