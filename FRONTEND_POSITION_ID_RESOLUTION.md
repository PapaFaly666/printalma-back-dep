# 🛠️ Patch Frontend – Résolution des IDs `vendorProductId` & `designId`

## 1. Nouveau helper `vendorIdResolvers.ts`

```ts
// frontend/src/helpers/vendorIdResolvers.ts

/**
 * Tente de résoudre le véritable vendorProductId à partir d'un objet produit
 * qui peut contenir soit un id vendor, soit un baseProductId.
 */
export function resolveVendorProductId(
  product: { id: number; baseProductId?: number },
  vendorProducts: { id: number; baseProductId: number }[]
): number | null {
  if (!product || !vendorProducts?.length) return null;

  // 1) L'ID est déjà un vendorProduct.id appartenant au vendeur
  if (vendorProducts.some(vp => vp.id === product.id)) return product.id;

  // 2) ID reçu = baseProductId ➜ on cherche le vendorProduct correspondant
  const match = vendorProducts.find(vp => vp.baseProductId === product.id);
  if (match) return match.id;

  // 3) Produit contient baseProductId ➜ on cherche également
  if (product.baseProductId) {
    const baseMatch = vendorProducts.find(vp => vp.baseProductId === product.baseProductId);
    if (baseMatch) return baseMatch.id;
  }

  return null;
}

/**
 * Résout le vrai designId (21, 22, …) à partir d'un objet design et de la liste des designs du vendeur.
 * Si le vendeur n'a qu'un design, on le renvoie par défaut.
 */
export function resolveVendorDesignId(
  design: { id?: number; imageUrl?: string },
  vendorDesigns: { id: number; imageUrl: string }[]
): number | null {
  if (!vendorDesigns?.length) return null;

  // 1) L'ID existe déjà chez le vendeur
  if (design?.id && vendorDesigns.some(d => d.id === design.id)) return design.id;

  // 2) Cherche par imageUrl (cas migration)
  if (design?.imageUrl) {
    const match = vendorDesigns.find(d => d.imageUrl === design.imageUrl);
    if (match) return match.id;
  }

  // 3) Si un seul design ➜ on l'utilise
  if (vendorDesigns.length === 1) return vendorDesigns[0].id;

  return null;
}
```

---

## 2. Modification de `useDesignTransforms.ts`

Repérez la partie où l'on construit l'URL pour charger / sauvegarder la position.

```diff
-import { resolveVendorProductId } from '@/helpers/vendorProductHelpers';
+import { resolveVendorProductId, resolveVendorDesignId } from '@/helpers/vendorIdResolvers';

 // …
-const vpId = resolveVendorProductId(product, vendorProducts);
-const url  = `/api/vendor-products/${vpId}/designs/${design.id}/position/direct`;
+const vpId = resolveVendorProductId(product, vendorProducts);
+const resolvedDesignId = resolveVendorDesignId(design, vendorDesigns);
+
+if (!vpId || !resolvedDesignId) {
+  console.error('❌ Impossible de résoudre les IDs réels', { vpId, resolvedDesignId, product, design });
+  return; // ne pas appeler l'API ➜ le PositionDebugger prendra le relais
+}
+
+const url = `/api/vendor-products/${vpId}/designs/${resolvedDesignId}/position/direct`;
```

Assurez-vous que :
1. `vendorProducts` contient bien la liste obtenue via `/vendor/products` (architecture V2).
2. `vendorDesigns` est récupéré via `/vendor/designs?status=all` (c'est déjà le cas dans les hooks existants).

---

## 3. Modification de `designPositionManager.ts`

Avant d'envoyer la requête **PUT /position/direct** :

```diff
-const url = `/api/vendor-products/${productId}/designs/${designId}/position/direct`;
+const vpId = resolveVendorProductId({ id: productId }, vendorProducts);
+const realDesignId = resolveVendorDesignId({ id: designId }, vendorDesigns);
+
+if (!vpId || !realDesignId) {
+  // logger + laisser le Debugger gérer
+  console.warn('❌ IDs invalides, fallback Debugger', { productId, designId });
+  return debuggerPositionFallback(productId, designId, positioning);
+}
+
+const url = `/api/vendor-products/${vpId}/designs/${realDesignId}/position/direct`;
```

---

## 4. Résultat attendu

• Le frontend n'enverra plus `productId: 2` / `designId: 1` mais `vendorProductId: 51` et `designId: 21` (ou 22).  
• Les 404 disparaissent, la position se sauvegarde et se recharge sans boucle infinie.

Déployez, rafraîchissez – tout doit fonctionner ✅. 
 
 
 
 