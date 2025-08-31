# 📘 GUIDE FRONTEND — Toujours utiliser `vendorProduct.id`

Ce document synthétise **UNE seule règle** : _tous les appels API qui touchent à un produit **doivent** utiliser l’ID vendeur (`vendorProduct.id`) et **jamais** l’ID admin (`baseProductId`)._

---

## 1. Contexte

| Propriété | Exemple | À quoi ça sert ? |
|-----------|---------|------------------|
| `baseProductId` | `2` | Référence du produit **catalogue** (admin). Ne sert qu’à lier au produit source. |
| `vendorProduct.id` | `47` | Identifiant du **produit vendeur** créé par le vendeur. **C’est lui qui détermine les permissions**. |

Le backend vérifie systématiquement :
```ts
vendorProduct.vendorId === req.user.id
```
Si vous envoyez `productId = baseProductId`, il ne trouvera aucun VendorProduct ⇒ 403.

---

## 2. Fonction helper : `resolveVendorProductId`

`src/helpers/vendorProductHelpers.ts`
```ts
export function resolveVendorProductId(anyIdOrObject: unknown, vendorProducts: any[]): number | null {
  // 1. Objet complet ↠ vendorProduct.id
  if (typeof anyIdOrObject === 'object' && anyIdOrObject && 'id' in anyIdOrObject) {
    return (anyIdOrObject as any).id;
  }
  // 2. Nombre : peut être vendorProduct.id OU baseProductId
  if (typeof anyIdOrObject === 'number') {
    // direct
    const direct = vendorProducts.find(vp => vp.id === anyIdOrObject);
    if (direct) return direct.id;
    // mapping base → vendor
    const mapped = vendorProducts.find(vp => vp.baseProductId === anyIdOrObject);
    if (mapped) return mapped.id;
  }
  return null;
}
```

---

## 3. Points d’intégration à corriger

1. **Sauvegarde position isolée**
   ```diff
   const vpId = resolveVendorProductId(product, vendorProducts); // ✅
   const url  = `/api/vendor-products/${vpId}/designs/${design.id}/position/direct`;
   ```

2. **Transformations design**
   ```diff
   POST /vendor/design-transforms
-  { productId: product.id, ... }
+  { productId: resolveVendorProductId(product, vendorProducts), ... }
   ```

3. **Hook de chargement position / transforms**
   ```diff
-const vpId = product?.id;
+const vpId = resolveVendorProductId(product, vendorProducts);

 useEffect(() => {
   if (!vpId || !design?.id) return;
   loadPosition(vpId, design.id);
 }, [vpId, design?.id]);
   ```

---

## 4. Exemple complet

```ts
// 1. Charger produits
const { data } = await api.get('/vendor/products');
const vendorProducts = data.data.products;

// 2. Sélection d’un produit (vient de la UI ou d’un baseProductId)
const currentVpId = resolveVendorProductId(selectedProduct, vendorProducts);
if (!currentVpId) throw new Error('VendorProduct introuvable');

// 3. Sauvegarder la position isolée
await api.put(`/api/vendor-products/${currentVpId}/designs/${design.id}/position/direct`, pos, {
  withCredentials: true,
});
```

---

## 5. Checklist QA

- [ ] DevTools ► Toutes les URLs contiennent `/vendor-products/<37-…>` jamais `/vendor-products/2`.
- [ ] Plus aucun 403 « Ce produit ne vous appartient pas ».
- [ ] Les positions/transforms sont créés en **une** requête (pas d’autoFix).

---

## 6. Pense-bête

🔑 `vendorProduct.id` = clé de la sécurité.  
🚫 N’envoyez **jamais** `baseProductId` aux endpoints `/api/*` ou `/vendor/*`.

_Suivez cette règle et toutes les 403 disparaîtront !_ 
 
 
 
 