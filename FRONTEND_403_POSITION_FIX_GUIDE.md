# 🛡️ GUIDE FRONTEND — Résoudre l'erreur 403 « Ce produit ne vous appartient pas »

Ce document explique :
1. **Pourquoi** vous recevez `403 Forbidden` ou `404 Not Found` sur le PUT `/api/vendor-products/:id/designs/:id/position/direct`.
2. **Comment** récupérer les **bons IDs** de produit & design.
3. Le **patch minimal** à appliquer dans vos helpers (`apiClient`, `PositionDebugger`, `DesignPositionManager`).

---

## 1. Origine de l'erreur 403

> **Message** : `Ce produit ne vous appartient pas`
>
> **Causes fréquentes** :
> 1. Mauvais **VendorProductId** → vous avez utilisé l'ID du produit *admin* au lieu du produit *vendeur*.
> 2. Mauvais **DesignId** → le design n'appartient pas au vendeur (et n'est pas publié).
> 3. Cookie `auth_token` manquant → requête considérée « non authentifiée ».

---

## 2. Checklist express

| ✅ | Étape |
|----|-------|
| 1  | Login : `POST /auth/login` → cookie httpOnly `auth_token` reçu ? |
| 2  | Profil : `GET /auth/profile` renvoie **200** ? |
| 3  | Produits : `GET /vendor/products` → présence du produit recherché ? |
| 4  | Designs : `GET /vendor/designs` → présence du design recherché ? |
| 5  | Position : `PUT /api/vendor-products/:vpId/designs/:dId/position/direct` |

Si une des étapes 1-4 échoue (404/401/403) ➜ **corrigez-la avant** de passer à l'étape 5.

---

## 3. Récupérer les BONs IDs

```ts
// Récupérer la liste complète des produits vendeurs
const { data: productsRes } = await api.get('/vendor/products');
const products = productsRes.data?.products || productsRes; // selon payload

// Exemple : choisir le premier produit
const vendorProductId = products[0].id;

// Récupérer les designs du vendeur (tous statuts)
const { data: designsRes } = await api.get('/vendor/designs?status=all');
const designs = designsRes.data?.designs || designsRes;

const designId = designs[0].id;
```

> 👀 **Tip** : Dans la réponse `/vendor/products` vous avez déjà `designId` et `vendorProductId` — récuperer directement ces valeurs est plus fiable.

---

## 4. Patch des helpers

### 4.1 `apiClient.ts`

```diff
-export const api = axios.create({
-  baseURL: 'http://localhost:3004',
-  timeout: 10000,
-  withCredentials: true,
-});
+export const api = axios.create({
+  baseURL: 'http://localhost:3004',
+  withCredentials: true, // cookie auth_token
+});
```

### 4.2 `PositionDebugger`

```diff
-const user = await this.api.get('/api/auth/me');
+const user = await this.api.get('/auth/profile');

-const vendorProducts = await this.api.get('/api/vendor-products');
+const vendorProducts = await this.api.get('/vendor/products');

-const designs = await this.api.get('/api/designs/my-designs');
+const designs = await this.api.get('/vendor/designs');
```

### 4.3 `DesignPositionManager`

```diff
-// Sauvegarde position
-const url = `/api/vendor-products/${productId}/designs/${designId}/position/direct`;
+const url = `/api/vendor-products/${productId}/designs/${designId}/position/direct`;
 // (✓ URL déjà correcte, on vérifie seulement les IDs avant l'appel)

// Avant d'appeler PUT, validez :
if (!productId || !designId) throw new Error('ProductId ou DesignId manquant');
```

---

## 5. Exemple complet (React)

```ts
import { api } from '../services/apiClient';

export async function saveDesignPosition({ vendorProductId, designId, position }) {
  // Étape sécurité : vérifier que les IDs appartiennent bien au vendeur
  const { data: products } = await api.get('/vendor/products');
  const ownsProduct = products.data?.products?.some(p => p.id === vendorProductId);
  if (!ownsProduct) throw new Error('Produit non trouvé chez le vendeur');

  const { data: designs } = await api.get('/vendor/designs');
  const ownsDesign = designs.data?.designs?.some(d => d.id === designId);
  if (!ownsDesign) throw new Error('Design non trouvé chez le vendeur');

  // PUT position
  await api.put(
    `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`,
    position,
  );
}
```

---

## 6. Cas spécifques « produit admin vs produit vendeur »

Dans l'ancien flux, l'ID produit **admin** (colonne `baseProductId`) était parfois utilisé côté front. 

**NE PAS** utiliser cet ID ! Utilisez l'ID `vendorProduct.id` retourné par :
```ts
const vpId = products.find(p => p.baseProductId === adminProductId)?.id;
```

---

## 7. Debug rapide en console

```js
// Vérifier propriétaire produit
await api.get('/vendor/products').then(r => console.table(r.data.data.products.map(p => ({ id: p.id, name: p.name }))));

// Vérifier propriétaire design
await api.get('/vendor/designs').then(r => console.table(r.data.data.designs.map(d => ({ id: d.id, name: d.name }))));
```

---

## 8. Conclusion

• En remplaçant tous les appels `/api/auth/me`, `/api/vendor-products`, `/api/designs/my-designs` par
  `/auth/profile`, `/vendor/products`, `/vendor/designs`, vous éliminez les 404.

• En validant préalablement que `vendorProductId` et `designId` **appartiennent au vendeur connecté**, vous éliminez les 403.

Happy debug ! 🎉 

---

## 9. Intégrer la *correction automatique* dans vos hooks

Lorsque `PositionDebugger.autoFix()` renvoie :
```ts
{
  correctProductId: 40,
  correctDesignId: 22
}
```
il faut **remonter** ces IDs à votre state global (Redux, React Context, Recoil, etc.) afin que **toutes** les requêtes suivantes utilisent les IDs corrigés.

### Exemple dans un hook React
```ts
// hooks/useDesignTransforms.ts
import { useState, useCallback } from 'react';
import { api } from '../services/apiClient';
import { DesignPositionManager } from '../utils/designPositionManager';

export function useDesignTransforms(initialProductId: number, initialDesignId: number) {
  const [productId, setProductId] = useState(initialProductId);
  const [designId, setDesignId]   = useState(initialDesignId);
  const positionManager = new DesignPositionManager(api);

  /**
   * Sauvegarde la position et gère la correction automatique.
   */
  const savePosition = useCallback(async (pos) => {
    const result = await positionManager.savePosition(productId, designId, pos);

    // 🔄 Si auto-fix => on met à jour les IDs dans le state
    if (result.correctedIds) {
      setProductId(result.correctedIds.productId);
      setDesignId(result.correctedIds.designId);
    }
  }, [productId, designId]);

  const getPosition = useCallback(() => {
    return positionManager.getPosition(productId, designId);
  }, [productId, designId]);

  return { productId, designId, savePosition, getPosition };
}
```

> ⚠️ **Important** : le composant parent (ou votre store global) doit écouter ces mises à jour pour éviter de repasser les anciens IDs aux hooks enfants.

### Astuce performance
1. Conservez un *mapping* `{ baseProductId ➜ vendorProductId }` dans un cache React-Query ou Redux.
2. Hydratez vos composants avec le `vendorProductId` **dès le premier render**.

---

## 10. Nettoyer les messages de debug
Pour éviter le spam « DEBUG PRODUCT IDS » :
```diff
-console.log('🔍 DEBUG PRODUCT IDS:', obj);
+if (process.env.NODE_ENV === 'development') {
+  console.debug('🔍 DEBUG PRODUCT IDS:', obj);
+}
```

---

## 11. Récapitulatif final
1. **Endpoints** corrigés ✅
2. **IDs** validés côté frontend avant chaque PUT ✅
3. **Correction automatique** remonte et persiste les nouveaux IDs ✅

Une fois ces 3 points en place, la suite des appels ne devrait plus jamais échouer en 403/404.

Happy debug ! 🎉 
 
 
 
 