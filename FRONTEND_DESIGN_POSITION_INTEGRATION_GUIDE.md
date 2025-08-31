# 🎨 Guide Frontend – Affichage & Sauvegarde des Positions de Design

> Objectif : faire en sorte que la position définie dans la page **Sell Design** s'applique à l'aperçu des produits et soit correctement enregistrée en base.

---

## 1. Contexte rapide

1. Le backend attend des **IDs réels** :
   * `vendorProductId` (63, 51, …)
   * `designId` (21, 22, …)
2. Le front avait tendance à envoyer :
   * `baseProductId` (2) ou `designId = 1` ➜ **404** + position non appliquée.
3. Nous avons ajouté côté back des fallbacks + endpoints stables.
4. Il reste à **résoudre correctement les IDs** et **appliquer la position** côté front.

---

## 2. Étape ➊ – Ajouter le helper

Chemin à créer : `frontend/src/helpers/vendorIdResolvers.ts`

```ts
export interface VendorProductLite { id: number; baseProductId: number }
export interface VendorDesignLite  { id: number; imageUrl: string }

export function resolveVendorProductId(
  product: { id: number; baseProductId?: number } | null,
  vendorProducts: VendorProductLite[] | null
): number | null {
  if (!product || !vendorProducts?.length) return null;
  if (vendorProducts.some(vp => vp.id === product.id)) return product.id;
  const byBase = vendorProducts.find(vp => vp.baseProductId === product.id);
  if (byBase) return byBase.id;
  if (product.baseProductId) {
    const match = vendorProducts.find(vp => vp.baseProductId === product.baseProductId);
    if (match) return match.id;
  }
  return null;
}

export function resolveVendorDesignId(
  design: { id?: number; imageUrl?: string } | null,
  vendorDesigns: VendorDesignLite[] | null
): number | null {
  if (!vendorDesigns?.length) return null;
  if (design?.id && vendorDesigns.some(d => d.id === design.id)) return design.id;
  if (design?.imageUrl) {
    const imgMatch = vendorDesigns.find(d => d.imageUrl === design.imageUrl);
    if (imgMatch) return imgMatch.id;
  }
  return vendorDesigns.length === 1 ? vendorDesigns[0].id : null;
}
```

---

## 3. Étape ➋ – Corriger le hook `useDesignTransforms.ts`

1. **Importer les helpers**
```diff
-import { resolveVendorProductId } from '@/helpers/vendorProductHelpers';
+import { resolveVendorProductId, resolveVendorDesignId } from '@/helpers/vendorIdResolvers';
```

2. **Avant chaque appel API**
```diff
-const vpId = resolveVendorProductId(product, vendorProducts);      // déjà existant
-const url  = `/api/vendor-products/${vpId}/designs/${design.id}/position/direct`;
+const vpId  = resolveVendorProductId(product, vendorProducts);
+const desId = resolveVendorDesignId(design, vendorDesigns);
+
+if (!vpId || !desId) {
+  console.warn('IDs non résolus ➜ Debugger', { vpId, desId, product, design });
+  return; // on laisse PositionDebugger tenter la correction
+}
+
+const url = `/api/vendor-products/${vpId}/designs/${desId}/position/direct`;
```

3. **Lors du GET initial** faites la même résolution pour composer l'URL.

---

## 4. Étape ➌ – Mettre à jour `designPositionManager.ts`

Avant le `PUT` final :

```diff
-const url = `/api/vendor-products/${productId}/designs/${designId}/position/direct`;
+const realVpId  = resolveVendorProductId({ id: productId }, vendorProducts);
+const realDesId = resolveVendorDesignId({ id: designId }, vendorDesigns);
+
+if (!realVpId || !realDesId) {
+  console.warn('IDs invalides ➜ fallback Debugger');
+  return debuggerPositionFallback(productId, designId, positioning);
+}
+
+const url = `/api/vendor-products/${realVpId}/designs/${realDesId}/position/direct`;
```

---

## 5. Étape ➍ – Appliquer la position dans la vignette produit

Dans le composant d'aperçu :

```tsx
const pos = position || { x: 0, y: 0, scale: 1, rotation: 0 };

<img
  src={designUrl}
  style={{
    position: 'absolute',
    left: `${pos.x}px`,
    top:  `${pos.y}px`,
    transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`
  }}
/>
```

• **Pas de translate(-50%,-50%)** sinon cela recentre.
• Si `position === null` ➜ laissez la valeur par défaut (centre).

---

## 6. Tests rapides

1. Ouvrez **Sell Design** → placez le design ➜ `PUT` 200.
2. Rechargez **/vendor/products** ➜
   * `GET` doit appeler `/designs/21/position/direct` (ou 22…) et recevoir la position.
   * Le design apparaît exactement où vous l'avez mis.
3. Dans la DB : `SELECT * FROM product_design_positions;` ➜ ligne présente ✔️

---

## 7. Checklist finale

- [ ] Helper `vendorIdResolvers.ts` en place
- [ ] `useDesignTransforms.ts` résout vpId & designId avant chaque GET/PUT
- [ ] `designPositionManager.ts` idem pour la sauvegarde
- [ ] Composant d'aperçu applique `x/y/scale/rotation`
- [ ] Tests manuels OK (plus de design centré par défaut)

Une fois ces points cochés → le design restera à la position enregistrée, même après rafraîchissement. Bonne intégration ! 🎉 
 
 
 
 