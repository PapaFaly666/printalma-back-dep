# 🛑 HOW-TO Frontend – Stopper les 404 « Produit introuvable »

> 2 minutes pour corriger l'appel de sauvegarde de position

---

## 1. Pourquoi ça plante ?

```
PUT /api/vendor-products/2/designs/27/position/direct   → 404 NOT_FOUND
```

* `2` est l'**ID du produit de base** (baseProductId) venant du catalogue admin.
* Le backend attend l'**ID du produit vendeur** (vendorProductId) → typiquement ≥ 60.

---

## 2. Deux lignes de code pour résoudre l'ID

```ts
import { resolveVendorProductId, resolveVendorDesignId } from '@/helpers/vendorIdResolvers';

const vpId  = resolveVendorProductId(product, vendorProducts); // ex : 70
const desId = resolveVendorDesignId (design , vendorDesigns);  // ex : 27
```

*Si `vpId` ou `desId` est null ➜ ne pas appeler l'API : laisser la position par défaut*

---

## 3. Endpoint à utiliser

```http
PUT /api/vendor-products/{vpId}/designs/{desId}/position/direct
```

Exemple concret :
```
PUT /api/vendor-products/70/designs/27/position/direct
Body: { x:-89, y:-125, scale:0.45, rotation:0, constraints:{ adaptive:true, area:"design-placement" } }
```
→ 200 « Position sauvegardée »

---

## 4. Et l'ancien endpoint ?

Si vous êtes encore obligé d'utiliser le workflow legacy :

```
POST /vendor/design-transforms/save     ✅
POST /api/vendor/design-transforms/save ❌ 404
```

*Aucun préfixe `/api` sur cette route !*

---

## 5. Checklist rapide

- [ ] Vous importez les **helpers** pour résoudre les IDs ✔️
- [ ] L'URL appelle `/api/vendor-products/{vpId}/designs/{desId}/position/direct` ✔️
- [ ] Plus aucun `productId = 2` visible dans l'onglet Réseau ✔️
- [ ] Les réponses passent à **200** ✔️

---

🆘 Besoin d'un exemple complet ? Voir `FRONTEND_POSITION_ENDPOINTS_FIX_GUIDE.md`. 